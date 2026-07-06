---
title: "FOR UPDATE로 다중 서버 동시성 제어하기 — 비관적 잠금 실전"
date: "2026-07-06"
description: "같은 PostgreSQL DB를 보는 웹 서버와 에이전트 서버가 같은 행을 동시에 읽고 UPDATE하면서 발생한 갱신 손실·중복 처리 문제를, FOR UPDATE 비관적 잠금으로 해결한 과정을 정리합니다. UPDATE만으로는 왜 경합이 예외 없이 통과되는지, NOWAIT·SKIP LOCKED 옵션 선택, Spring+MyBatis 적용과 TOCTOU 방지 실전 사례까지 다룹니다."
category: "개발"
subcategory: "Database"
tags: ["guide", "intermediate", "PostgreSQL"]
thumbnail: "/images/thumbnails/postgresql"
glossary:
  - id: "pessimistic-lock"
    term: "비관적 잠금(Pessimistic Lock)"
    brief: "충돌이 자주 일어난다고 가정하고, 조회 시점에 미리 잠그는 동시성 제어 전략"
    detail: "충돌 발생을 전제로 데이터를 읽는 순간 잠금을 걸어, 트랜잭션이 끝날 때까지 다른 트랜잭션의 접근을 막는다. PostgreSQL에서는 SELECT ... FOR UPDATE로 구현하며, '조회 → 검증 → 변경'을 하나의 원자적 흐름으로 직렬화한다. 반대 전략은 낙관적 잠금이다."
  - id: "optimistic-lock"
    term: "낙관적 잠금(Optimistic Lock)"
    brief: "충돌이 드물다고 가정하고, 커밋 시점에 버전 불일치로 충돌만 감지하는 전략"
    detail: "잠금을 걸지 않고 진행하되, version 컬럼을 두어 UPDATE 시 '내가 읽은 버전이 그대로일 때만' 성공하도록 한다. 버전이 바뀌었으면(다른 트랜잭션이 먼저 수정) 영향 행 수가 0이 되어 충돌을 감지하고 재시도한다. 경합이 드문 조회 위주 환경에 적합하다."
  - id: "for-update"
    term: "FOR UPDATE"
    brief: "조회한 행에 쓰기 잠금을 거는 PostgreSQL의 명시적 행 잠금 구문"
    detail: "SELECT ... FOR UPDATE는 WHERE로 매칭된 행에 배타적 쓰기 잠금을 건다. 잠금은 트랜잭션 커밋/롤백 시점까지 유지되며, 다른 트랜잭션의 FOR UPDATE·UPDATE·DELETE를 막는다. 잠금 없는 일반 SELECT는 MVCC 스냅샷을 읽으므로 막지 않는다."
  - id: "lost-update"
    term: "Lost Update(갱신 손실)"
    brief: "두 트랜잭션이 같은 값을 읽고 각자 계산해 쓸 때 나중 커밋이 앞선 변경을 덮어쓰는 문제"
    detail: "동시성 이상 현상의 하나. 두 트랜잭션이 같은 행을 읽어 같은 초기값을 기준으로 각자 갱신하면, 나중에 커밋한 쪽이 먼저 커밋한 쪽의 변경을 덮어써 한쪽 갱신이 사라진다. 재고 차감·카운터 증가 등에서 흔히 발생한다."
  - id: "toctou"
    term: "TOCTOU(Time-Of-Check-To-Time-Of-Use)"
    brief: "확인한 시점과 사용하는 시점 사이에 값이 바뀌어 발생하는 경합"
    detail: "'삭제 가능한 상태인지 확인(Check) → 실제 삭제(Use)' 사이에 다른 요청이 끼어들어 상태를 바꾸면, 이미 처리된 대상을 다시 처리하거나 없는 대상을 처리하게 된다. 확인과 사용을 하나의 잠금 구간으로 묶어 방지한다."
  - id: "nowait"
    term: "NOWAIT"
    brief: "이미 잠긴 행을 만나면 대기 없이 즉시 예외를 던지는 FOR UPDATE 옵션"
    detail: "SELECT ... FOR UPDATE NOWAIT은 대상 행이 이미 다른 트랜잭션에 잠겨 있으면 기다리지 않고 즉시 실패한다(PostgreSQL SQLSTATE 55P03, lock_not_available). 응답 시간이 중요한 웹 요청에서 '처리 중' 안내로 빠르게 되돌릴 때 적합하다."
  - id: "skip-locked"
    term: "SKIP LOCKED"
    brief: "잠긴 행은 건너뛰고 잠기지 않은 나머지 행만 반환하는 FOR UPDATE 옵션"
    detail: "SELECT ... FOR UPDATE SKIP LOCKED는 다른 트랜잭션이 이미 잠근 행을 에러 없이 건너뛴다. 여러 워커가 하나의 작업 큐 테이블을 나눠 가져갈 때, 서로 다른 행을 겹치지 않게 집어가도록 하는 데 유용하다."
---

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/thumbnails/postgresql-light.png" alt="PostgreSQL" />
      <img className="theme-dark" src="/images/thumbnails/postgresql-dark.png" alt="PostgreSQL" />
    </div>
  </div>
</figure>

하나의 **PostgreSQL** DB를 함께 바라보는 두 서버가 있었습니다.
사용자 요청을 받는 **웹 서버(A)**와, 백그라운드 작업을 처리하는 **에이전트 서버(B)**입니다.
둘 다 같은 작업 항목의 상태를 DB에서 "현재 처리 가능한가"로 조회한 뒤 상태를 변경하는 로직을 갖고 있었고, 두 서버가 거의 동시에 같은 행을 건드리는 순간 문제가 시작됐습니다.

처음에는 이렇게 생각했습니다.
"A 서버가 UPDATE하면 그 행에 자동으로 잠금이 걸릴 테니, 거의 동시에 들어온 B 서버의 UPDATE는 당연히 예외가 나면서 실패하겠지."
그래서 경합이 발생하면 그 예외를 단순 `try-catch`로 잡아 "이미 처리됨"으로 넘기려 했습니다.

하지만 예외는 발생하지 않았습니다.
두 서버의 UPDATE는 **둘 다 성공**했고, 그 결과 한쪽의 갱신이 사라지거나 같은 작업이 중복 처리되는 경합이 그대로 발생했습니다.
`try-catch`가 잡을 예외 자체가 없었던 것입니다.

원인은 검증에 쓰는 일반 SELECT가 아무 잠금도 걸지 않고, UPDATE가 잡는 행 잠금은 "충돌 시 예외"가 아니라 "먼저 끝날 때까지 대기 후 진행"으로 동작하기 때문이었습니다.
경합을 실제로 막으려면 변경 시점이 아니라 **조회 시점부터 명시적으로 행을 잠가야** 했고, 그 수단이 <Term id="for-update">FOR UPDATE</Term>를 이용한 <Term id="pessimistic-lock">비관적 잠금</Term>이었습니다.

이 글에서는 다중 서버 환경에서 동시성 문제가 왜 생기는지, `FOR UPDATE`가 이를 어떻게 직렬화하는지, 그리고 Spring + MyBatis에서 <Term id="toctou">TOCTOU</Term> 경합을 막은 실전 사례까지 정리합니다.
잠금 동작과 옵션(`NOWAIT`·`SKIP LOCKED`), 에러 코드(`55P03` 등)는 모두 **PostgreSQL 기준**입니다.

---

## 왜 필요했나 — 같은 DB를 보는 두 서버

동시성 문제의 핵심은 **여러 실행 주체가 같은 데이터를 동시에 읽고 변경**하는 데 있습니다.
웹 서버와 에이전트 서버는 애초에 서로 다른 프로세스(다른 JVM)라, 어느 한쪽의 코드로는 상대의 실행을 제어할 수 없습니다.
문제가 왜 생겼는지, 그리고 왜 처음의 `try-catch` 접근이 통하지 않았는지 순서대로 짚어 보겠습니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/postgresql-for-update-pessimistic-lock/multi-server-race-light.png" alt="두 서버가 같은 DB 행을 동시에 읽고 UPDATE하여 갱신이 손실되는 흐름" />
      <img className="theme-dark" src="/images/posts/postgresql-for-update-pessimistic-lock/multi-server-race-dark.png" alt="두 서버가 같은 DB 행을 동시에 읽고 UPDATE하여 갱신이 손실되는 흐름" />
    </div>
  </div>
  <figcaption>서버 A·B가 각자 초기값 100을 읽고 갱신하면, 나중에 커밋한 B가 A의 변경을 덮어써 갱신이 손실된다</figcaption>
</figure>

두 서버가 각각 10, 5를 팔았다면 최종 재고는 85여야 하지만, B가 자신이 읽은 100을 기준으로 덮어써 95가 됩니다.
A의 갱신이 사라진 <Term id="lost-update">Lost Update</Term>입니다.

### 기대 — UPDATE가 자동으로 막아줄 것이다

처음의 기대는 이랬습니다.

- A 서버가 먼저 UPDATE하면 그 행에 잠금이 걸린다
- 거의 동시에 들어온 B 서버의 UPDATE는 잠긴 행을 건드리니 예외가 나면서 실패한다
- 그러니 그 예외만 `try-catch`로 잡아 "이미 처리됨"으로 넘기면 된다

### 현실 — 예외가 아니라 대기, 그리고 덮어쓰기

하지만 두 가지 이유로 예외는 발생하지 않습니다.

1. **검증에 쓰는 SELECT는 잠금을 걸지 않는다** — "상태가 처리 가능한가"를 확인하는 일반 SELECT는 MVCC 스냅샷을 읽을 뿐 아무 잠금도 잡지 않습니다. 그래서 두 서버가 같은 값을 나란히 읽습니다.
2. **UPDATE의 행 잠금은 "예외"가 아니라 "대기"다** — A 서버의 UPDATE가 행을 잠근 동안, B 서버의 UPDATE는 예외를 던지지 않고 그냥 기다립니다(기본 동작). A가 커밋해 잠금이 풀리면 B의 UPDATE가 이어서 실행되어 성공합니다.

결국 둘 다 성공합니다.
두 서버가 SELECT 시점에 같은 값을 읽었으므로, 각자 그 값을 기준으로 UPDATE해 한쪽 갱신이 사라집니다.

<div className="warning-box">
  <strong>UPDATE 락은 충돌을 "실패"시키지 않는다</strong><br/><br/>
  PostgreSQL에서 UPDATE가 잡는 행 잠금은 다른 트랜잭션을 <strong>예외로 실패시키는 게 아니라 대기시킵니다</strong>.
  대기가 풀리면 뒤따른 UPDATE도 그대로 성공하므로, "충돌하면 예외가 나겠지"라는 가정으로 짠 <code>try-catch</code>는 아무것도 잡지 못합니다.
</div>

정리하면, **UPDATE 문 하나만으로는 "조회 → 검증" 구간을 지킬 수 없습니다.**
UPDATE도 자신이 바꾸는 행에는 잠금을 잡지만, 그 잠금은 값을 실제로 바꾸는 순간에 걸릴 뿐이고 검증에 쓰는 앞선 SELECT는 잠기지 않기 때문입니다.
PostgreSQL 문서도 "행 잠금은 조회를 막지 않으며, 같은 행에 대한 쓰기·잠금만 막는다"고 설명합니다.

그래서 경합을 막으려면, 변경할 UPDATE가 아니라 그 앞의 **검증용 SELECT부터** 잠가야 합니다.
`SELECT ... FOR UPDATE`가 바로 그 역할입니다.
PostgreSQL 공식 문서는 이를 "SELECT로 조회한 행을, 현재 트랜잭션이 끝날 때까지 다른 트랜잭션이 잠그거나 수정·삭제하지 못하도록 잠근다"고 정의합니다([Row-Level Locks](https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-ROWS)).
조회 시점에 `FOR UPDATE`로 행을 잠그면, 뒤따른 트랜잭션은 앞선 트랜잭션이 끝날 때까지 조회 자체가 대기하고, 풀린 뒤에는 최신값을 읽게 되어 "조회 → 검증 → 변경" 전체가 직렬화됩니다.

---

## 동시성 경합의 정체 — Lost Update와 TOCTOU

`FOR UPDATE`가 무엇을 막아주는지 이해하려면, 막아야 할 경합의 유형을 먼저 봐야 합니다.

### Lost Update (갱신 손실)

앞의 재고 예시가 전형적인 Lost Update입니다.
두 트랜잭션이 같은 값을 읽고 각자 계산해 쓰면, 나중 커밋이 앞선 변경을 덮어써 갱신이 사라집니다.

```
[FOR UPDATE 없을 때 — 재고 100에서 각자 차감]

A: SELECT stock FROM item_t WHERE id=1   → 100
B: SELECT stock FROM item_t WHERE id=1   → 100   (같은 값을 읽음)
A: UPDATE item_t SET stock = 100 - 10    → 90
B: UPDATE item_t SET stock = 100 - 5     → 95    (A의 -10이 사라짐)
```

### TOCTOU (Time-Of-Check-To-Time-Of-Use)

**확인한 시점(Check)과 사용하는 시점(Use) 사이에 값이 바뀌는** 경합입니다.
"삭제 가능한 상태인지 확인 → 실제 삭제" 사이에 다른 요청이 끼어들면, 이미 처리된 대상을 또 처리하게 됩니다.

```
A: SELECT status → '삭제가능' (삭제해도 되겠다고 판단)
B: SELECT status → '삭제가능' (B도 삭제해도 되겠다고 판단)
A: 물리 삭제 실행
B: 물리 삭제 실행 → 이미 없는 행을 다시 삭제 / 복구와 충돌
```

두 경합 모두 원인은 하나입니다. **각 트랜잭션이 "예전에 읽은 값"을 기준으로 판단**하기 때문입니다.
읽은 순간에 그 행을 잠가버리면, 뒤따르는 트랜잭션은 앞선 트랜잭션이 끝난 뒤 최신값을 보게 되어 경합이 사라집니다.

사실상 Lost Update나 TOCTOU 같은 경합을 막으려면 이처럼 **조회 시점에 잠금을 획득**하는 것이 좋습니다.
이는 동시성 제어에서 표준적으로 권장되는 방법입니다.

---

## FOR UPDATE 동작 원리

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/postgresql-for-update-pessimistic-lock/for-update-serialize-light.png" alt="FOR UPDATE로 서버 B가 대기 후 최신값을 읽어 중복 처리를 스킵하는 흐름" />
      <img className="theme-dark" src="/images/posts/postgresql-for-update-pessimistic-lock/for-update-serialize-dark.png" alt="FOR UPDATE로 서버 B가 대기 후 최신값을 읽어 중복 처리를 스킵하는 흐름" />
    </div>
  </div>
  <figcaption>서버 B는 A가 커밋할 때까지 대기했다가 최신값('RUNNING')을 읽으므로, 중복 처리가 원천 차단된다</figcaption>
</figure>

`FOR UPDATE`는 조회하는 순간 해당 행에 쓰기 잠금을 걸어, 트랜잭션이 끝날 때까지 다른 트랜잭션이 그 행을 수정하거나 함께 잠그지 못하게 막습니다.
동작에는 세 가지 핵심 원칙이 있습니다.

| 원칙 | 설명 |
|------|------|
| **행 단위 잠금** | `WHERE` 조건에 매칭된 행만 잠급니다. `WHERE`가 인덱스를 못 타면 더 많은 행을 스캔·잠글 수 있어 주의가 필요합니다 |
| **트랜잭션 필수** | 잠금은 커밋/롤백까지 유지됩니다. 트랜잭션 밖(auto-commit)에서 실행하면 SELECT 직후 잠금이 즉시 풀려 **효과가 없습니다** |
| **읽기는 안 막음** | 잠긴 행이라도 잠금 없는 일반 `SELECT`는 예전 스냅샷을 읽을 수 있습니다(MVCC). 막히는 건 다른 `FOR UPDATE`와 쓰기 작업뿐입니다 |

### 일반 UPDATE 잠금과 무엇이 다른가

일반 `UPDATE`도 자신이 바꾸는 행에 잠금을 잡습니다.
그런데도 `FOR UPDATE`가 따로 필요한 이유는 **잠금을 잡는 시점**이 다르기 때문입니다.

| 구분 | 일반 UPDATE의 행 잠금 | SELECT ... FOR UPDATE |
|------|----------------------|------------------------|
| **잠금 시점** | 행을 **실제로 바꾸는 순간** | **조회하는 순간** (변경 전) |
| **잠그는 행** | 실제로 변경되는 행 | `WHERE`로 조회한 행 |
| **보호 구간** | 쓰기끼리의 충돌만 순차화 | 조회 → 검증 → 변경 전체 |
| **read-then-write 경합** | 못 막음 (각자 옛 값으로 덮어씀) | 막음 (뒤 트랜잭션은 최신값을 읽음) |
| **락 모드** | `FOR NO KEY UPDATE` (키 외 컬럼 변경 시, 조금 약함) | `FOR UPDATE` (가장 강함) |

결정적 차이는 **잠금 획득 시점**입니다.
일반 UPDATE의 잠금은 "쓰는 순간"에 걸리므로, 그 앞에서 값을 읽어 판단하는 검증용 SELECT를 보호하지 못합니다.
그래서 두 UPDATE가 서로 대기하며 순차 실행되더라도, 각자 앞서 읽어둔 옛 값을 기준으로 덮어써 갱신이 사라집니다.

```
[UPDATE 락만 — 쓰기는 순차화돼도 Lost Update는 그대로]
A: SELECT stock → 100                (잠금 없음)
B: SELECT stock → 100                (잠금 없음, 같은 값)
A: UPDATE stock = 100 - 10 → 90      (이 순간 행 잠금 획득)
B: UPDATE stock = 100 - 5            (A 커밋까지 대기 → 이어서 90을 95로 덮어씀)
                                      └ 순차 실행됐어도 A의 -10이 손실

[FOR UPDATE — 조회부터 잠가 전체를 직렬화]
A: SELECT stock FOR UPDATE → 100     (조회 시점에 행 잠금 획득)
B: SELECT stock FOR UPDATE           (A 커밋까지 조회 자체가 대기)
A: UPDATE stock = 100 - 10 → 90 ; COMMIT   (잠금 해제)
B: (대기 풀림) SELECT → 90            (최신값을 읽음)
B: UPDATE stock = 90 - 5 → 85        (올바르게 차감)
```

`FOR UPDATE`는 같은 배타 잠금을 **조회 시점에 미리** 잡아, 뒤따르는 트랜잭션의 조회 자체를 대기시킵니다.
덕분에 뒤 트랜잭션은 앞 트랜잭션이 커밋한 최신값을 읽고, "조회 → 검증 → 변경" 전체가 하나로 직렬화됩니다.

### "조회 → 검증 → 변경"을 한 트랜잭션에 묶어야 한다

`FOR UPDATE`의 목적은 단순 조회가 아니라 **"잠근 상태로 검증하고, 그 잠금을 유지한 채 변경"**하는 데 있습니다.
조회만 하고 트랜잭션을 끝내면 의미가 없습니다.

```
잘못된 흐름: SELECT FOR UPDATE (트랜잭션 종료) → 검증 → UPDATE (새 트랜잭션)
             └ 잠금이 이미 풀려 그 사이 경합 발생 가능

올바른 흐름: [ SELECT FOR UPDATE → 검증 → UPDATE → COMMIT ]  ← 하나의 트랜잭션
```

---

## 잠금 대기 옵션 3종

이미 다른 트랜잭션이 잠근 행을 만났을 때 **어떻게 반응할지**가 옵션의 차이입니다. (PostgreSQL 기준)

| 옵션 | 잠긴 행을 만나면 | 결과 |
|------|-----------------|------|
| **(기본)** | 풀릴 때까지 **무한 대기** | 잠금 획득 후 행 반환 |
| **NOWAIT** | 대기 없이 **즉시 실패** | 에러 (SQLSTATE `55P03`, lock_not_available) |
| **SKIP LOCKED** | 잠긴 행만 **건너뜀** | 잠기지 않은 나머지 행만 반환 (에러 없음) |

```sql
-- 기본: 잠긴 행이 풀릴 때까지 대기
SELECT * FROM job_t WHERE id = #{id} FOR UPDATE;

-- NOWAIT: 이미 잠겨 있으면 대기 0초, 즉시 예외
SELECT * FROM job_t WHERE id = #{id} FOR UPDATE NOWAIT;

-- SKIP LOCKED: 잠긴 행은 무시하고 처리 가능한 행만 (작업 큐 분배에 유용)
SELECT * FROM job_t WHERE status = 'READY' FOR UPDATE SKIP LOCKED LIMIT 1;
```

### 어떤 옵션을 고를 것인가

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/postgresql-for-update-pessimistic-lock/lock-option-decision-light.png" alt="대기·NOWAIT·SKIP LOCKED 옵션 선택 플로우차트" />
      <img className="theme-dark" src="/images/posts/postgresql-for-update-pessimistic-lock/lock-option-decision-dark.png" alt="대기·NOWAIT·SKIP LOCKED 옵션 선택 플로우차트" />
    </div>
  </div>
  <figcaption>잠긴 행을 만났을 때 기다려도 되는지에 따라 기본·NOWAIT·SKIP LOCKED를 선택한다</figcaption>
</figure>

<Term id="nowait">NOWAIT</Term>은 "지금 못 잡으면 실패로 간주"입니다.
웹 요청처럼 응답 시간이 중요해 무한 대기를 허용할 수 없을 때, "다른 작업이 진행 중입니다" 같은 안내로 빠르게 되돌려주기에 적합합니다.

<div className="warning-box">
  <strong>NOWAIT의 두 갈래: "잠겨 있음"과 "대상 없음"은 다르다</strong><br/><br/>
  <code>NOWAIT</code>은 <strong>잠긴 행</strong>을 만났을 때만 예외를 던집니다.
  <code>WHERE</code> 조건에 맞는 <strong>행이 아예 없으면</strong> 예외 없이 0건(→ <code>null</code>)을 반환하고 잠금도 잡지 않습니다.
  즉 "잠겨 있음(예외)"과 "대상 없음(null)"은 서로 다른 경로이므로, 서비스에서 두 경우를 구분해 처리해야 합니다.
</div>

<Term id="skip-locked">SKIP LOCKED</Term>는 여러 워커가 하나의 작업 큐를 나눠 처리할 때 빛을 발합니다.
각 워커가 잠긴 행은 건너뛰고 비어 있는 다음 행을 집어가므로, 서로 겹치지 않게 일감을 분배할 수 있습니다.

---

## 비관적 잠금 vs 낙관적 잠금

`FOR UPDATE`는 비관적 잠금입니다. 대안으로 버전 컬럼을 이용한 <Term id="optimistic-lock">낙관적 잠금</Term>이 있습니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/postgresql-for-update-pessimistic-lock/pessimistic-vs-optimistic-light.png" alt="비관적 잠금과 낙관적 잠금의 처리 흐름 비교" />
      <img className="theme-dark" src="/images/posts/postgresql-for-update-pessimistic-lock/pessimistic-vs-optimistic-dark.png" alt="비관적 잠금과 낙관적 잠금의 처리 흐름 비교" />
    </div>
  </div>
  <figcaption>비관적 잠금은 미리 잠가 충돌을 방지하고, 낙관적 잠금은 커밋 시점에 버전으로 충돌을 감지해 재시도한다</figcaption>
</figure>

| 구분 | 비관적 (FOR UPDATE) | 낙관적 (version 컬럼) |
|------|--------------------|-----------------------|
| **전제** | 충돌이 자주 일어난다 | 충돌이 드물다 |
| **방식** | 미리 잠그고 진행, 남은 요청은 대기 | 안 잠그고, 커밋 시 버전 불일치로 충돌 감지 |
| **충돌 시** | 애초에 발생 안 함 (직렬화) | 실패 후 **재시도** 필요 |
| **단점** | 대기·데드락·처리량 저하 | 재시도 로직 필요, 경합 잦으면 재시도 폭증 |
| **적합** | 상태 전이·재고 차감 등 정확성 중요 + 경합 빈번 | 조회 위주 + 가끔의 동시 수정 |

```sql
-- 낙관적 잠금: 잠그지 않고, 내가 읽은 버전이 그대로일 때만 UPDATE 성공
UPDATE job_t
SET status = 'RUNNING', version = version + 1
WHERE id = #{id} AND version = #{version};
-- 영향 행 수가 0이면 그 사이 누군가 바꾼 것 → 재조회 후 재시도
```

<div className="info-box">
  정확성이 중요하고 경합이 실제로 자주 난다면 비관적 잠금이,
  경합이 드물고 재시도가 가능하다면 낙관적 잠금이 유리합니다.
  다중 서버가 같은 상태값을 놓고 <strong>빈번하게 경합</strong>하는 상황이라면, 재시도 폭증을 피할 수 있는 비관적 잠금이 더 안정적입니다.
</div>

> 참고로 `FOR UPDATE`는 행 잠금 중 가장 강한 모드입니다. PostgreSQL에는 `FOR NO KEY UPDATE`, `FOR SHARE`, `FOR KEY SHARE` 같은 더 약한 모드도 있어, "이 행을 참조하는 동안 삭제·변경만 막고 동시 읽기는 허용"하고 싶을 때는 `FOR SHARE`를 쓸 수 있습니다. 대부분의 "조회 → 검증 → 변경" 시나리오는 `FOR UPDATE`면 충분합니다.

---

## 어디에 쓰나 — 대표 활용 사례

`FOR UPDATE`는 **"같은 행을 여러 요청이 읽고 → 판단하고 → 바꾸는"** 모든 곳에 쓰입니다.
특히 정확성이 돈이나 수량에 직결돼 경합을 절대 놓치면 안 되는 상황이 대표적입니다.

### 은행 계좌 이체

가장 전형적인 사례입니다.
A 계좌에서 B 계좌로 이체할 때, 출금 계좌의 잔액을 확인하고 차감해야 합니다.
잔액 검증과 차감 사이에 같은 계좌를 건드리는 다른 이체가 끼어들면, 잔액이 마이너스가 되거나(초과 인출) 한쪽 갱신이 사라집니다.

```java
@Transactional(rollbackFor = Exception.class)
public void transfer(long fromId, long toId, long amount) {
    // 데드락 예방: 두 계좌를 항상 같은 순서(작은 id부터)로 잠근다
    accountMapper.lockForUpdate(Math.min(fromId, toId));
    accountMapper.lockForUpdate(Math.max(fromId, toId));

    long balance = accountMapper.selectBalance(fromId);  // 잠금 유지 상태의 최신 잔액
    if (balance < amount) {
        throw new CustomException("출금 계좌의 잔액이 부족합니다.");
    }
    accountMapper.decrease(fromId, amount);
    accountMapper.increase(toId, amount);
}
```

```xml
<select id="lockForUpdate" resultType="long">
    SELECT account_id
    FROM account_t
    WHERE account_id = #{accountId}
    FOR UPDATE
</select>
```

이체는 **두 계좌를 모두** 잠가야 해서 잠금 순서가 특히 중요합니다.
한 트랜잭션은 A→B 순으로, 다른 트랜잭션은 B→A 순으로 잠그면 서로를 기다리다 데드락에 빠집니다.
그래서 항상 같은 기준(여기서는 id 오름차순)으로 잠급니다. (데드락은 뒤의 '주의사항'에서 자세히 다룹니다.)

### 그 밖의 활용

| 사례 | 무엇을 막나 | 적합한 옵션 |
|------|-----------|-----------|
| 재고 차감·좌석/티켓 예약 | 한정 수량 초과 판매(oversell) | `FOR UPDATE` (대기) |
| 선착순 쿠폰·한정 수량 발급 | 남은 수량 초과 발급 | `FOR UPDATE` (대기/NOWAIT) |
| 작업 큐 분배 | 여러 워커의 중복 처리 | `FOR UPDATE SKIP LOCKED` |
| 상태 전이 (READY→RUNNING) | 중복 실행·이중 처리 | `FOR UPDATE` (+NOWAIT) |

공통점은 모두 **"확인한 값이 처리 시점까지 그대로여야 하는"** 경우라는 것입니다.
조회와 변경 사이에 값이 바뀌면 안 되는 로직이라면 `FOR UPDATE`가 후보입니다.

---

## Spring + MyBatis 적용

### @Transactional이 반드시 있어야 한다

가장 흔한 실수는 트랜잭션 경계 없이 매퍼만 호출하는 것입니다.
그러면 SELECT 직후 잠금이 풀려 아무 효과가 없습니다.

```java
@Transactional(rollbackFor = Exception.class)
public boolean startJob(Long jobId) {
    // 1. 행 잠금 + 최신 상태 조회 (잠금 유지)
    String status = jobMapper.selectStatusForUpdate(jobId);

    // 2. 잠금이 걸린 상태에서 검증
    if (!"READY".equals(status)) {
        return false;  // 이미 다른 서버가 처리함
    }

    // 3. 상태 변경 (커밋 시점에 잠금 해제)
    jobMapper.updateStatus(jobId, "RUNNING");
    return true;
}
```

```xml
<!-- id는 PK라 단일 행만 잠긴다 -->
<select id="selectStatusForUpdate" resultType="string">
    SELECT status
    FROM job_t
    WHERE id = #{jobId}
    FOR UPDATE
</select>
```

### NOWAIT 예외 매핑

`FOR UPDATE NOWAIT`이 잠금 획득에 실패하면 PostgreSQL은 `55P03` 에러를 던지고, Spring은 이를 `CannotAcquireLockException`(상위 `PessimisticLockingFailureException`)으로 변환합니다.
서비스에서 잡아 사용자 친화적 메시지로 바꿉니다.

```java
@Transactional(rollbackFor = Exception.class)
public void forceDelete(Long jobId) {
    String status;
    try {
        // NOWAIT: 다른 서버가 이미 잠갔으면 대기 없이 락 예외
        status = jobMapper.selectStatusForUpdateNoWait(jobId);
    } catch (PessimisticLockingFailureException e) {
        throw new CustomException("다른 작업이 처리 중입니다. 잠시 후 다시 시도해 주세요.");
    }
    if (!DELETABLE_STATUSES.contains(status)) {
        throw new CustomException("삭제 가능한 상태가 아닙니다.");
    }
    jobMapper.deletePhysically(jobId);  // 잠금 유지한 채 삭제까지
}
```

---

## 실전 사례 — 강제삭제 TOCTOU 방지

실제 운영에서 겪은 문제입니다.

### 문제 상황

작업 항목에 대해 **강제삭제(force delete)** 와 **복구(recover)** 가 거의 동시에 요청될 수 있었습니다.
게다가 두 요청은 서로 다른 서버(웹·에이전트)를 통해 들어와, 한 프로세스 안에서 순서를 정할 수 있는 상황이 아니었습니다.
각 요청은 "현재 상태가 삭제 가능한가"를 확인한 뒤 처리하는데, 확인과 처리 사이(TOCTOU)에 서로 끼어들어 경합이 발생했습니다.

```
서버 A (force 요청):  상태 조회 → '삭제실패' 확인 → 물리 삭제
서버 B (recover 요청):            상태 조회 → '삭제실패' 확인 → 상태 복구
                       └ 두 흐름이 겹치면: 복구된 대상을 삭제하거나, 없는 행을 삭제
```

앞서 봤듯이 일반 조회·변경만으로는 예외 없이 경합이 통과되므로, 검증에 쓰는 조회 구간부터 DB 행을 직접 잠가야 했습니다.

### 해결: FOR UPDATE NOWAIT으로 확인~처리 구간 잠금

```java
@Transactional(rollbackFor = Exception.class)
public void forceDeleteFailedItem(long itemId) {
    String status;
    try {
        // PK 행을 즉시 잠근다. 다른 서버의 recover나 force가 이미 잠갔으면
        // 대기 없이 락 예외 → "처리 중" 안내로 되돌린다.
        status = itemMapper.selectDeleteStatusForUpdateNoWait(itemId);
    } catch (PessimisticLockingFailureException e) {
        // SQLState 55P03. 다른 작업이 해당 행을 점유 중.
        throw new CustomException("다른 작업이 처리 중입니다. 잠시 후 다시 시도해 주세요.");
    }

    // 잠금을 유지한 채 상태를 검증한다 (여기서의 상태는 확정된 최신값)
    if (!FORCE_DELETABLE_STATUSES.contains(status)) {
        throw new CustomException("삭제 대기중/진행중/실패 상태만 강제 삭제할 수 있습니다.");
    }

    // 확인~삭제까지 동일 트랜잭션에서 잠금을 유지 → TOCTOU 경합 차단
    deleteItemPhysically(itemId);
}
```

```xml
<!-- PK 단일 행만 잠금. 이미 잠긴 행이면 대기 없이 55P03 예외를 던진다. -->
<select id="selectDeleteStatusForUpdateNoWait" resultType="string">
    SELECT delete_status
    FROM item_info_t
    WHERE item_seq = #{itemId}
    FOR UPDATE NOWAIT
</select>
```

### 핵심 포인트

- **NOWAIT을 택한 이유** — 웹 요청이므로 대기시키기보다 "처리 중" 안내로 즉시 되돌리는 편이 UX상 낫습니다.
- **PK 잠금** — `WHERE`가 PK라 정확히 한 행만 잠겨, 잠금 범위가 최소입니다.
- **동일 트랜잭션 유지** — 조회로 얻은 잠금이 검증·삭제까지 이어져야 확인~사용 사이 경합이 사라집니다.
- **서버 경계를 넘는 직렬화** — 잠금이 DB에 있으므로, 요청이 어느 서버에서 오든 같은 행에 대한 처리는 하나씩 직렬화됩니다.

---

## 주의사항 (트레이드오프)

### 1. @Transactional 누락 = 잠금 무효

가장 치명적인 실수입니다.
트랜잭션 밖에서 매퍼가 auto-commit 되면 SELECT 직후 잠금이 풀립니다.
서비스 계층에 트랜잭션 경계가 반드시 있어야 합니다.

### 2. 데드락 (잠금 순서)

여러 행을 잠글 때 트랜잭션마다 **잠금 순서가 다르면** 교착에 빠집니다.
항상 동일한 순서로 잠급니다.

```sql
-- 항상 같은 순서(예: id 오름차순)로 잠가 데드락을 피한다
SELECT * FROM job_t WHERE id IN (1, 2, 3) ORDER BY id FOR UPDATE;
```

PostgreSQL은 데드락을 자동으로 감지해 교착에 빠진 트랜잭션 중 하나를 강제 종료(`40P01 deadlock_detected`)하고 나머지를 진행시킵니다.
무한정 멈추지는 않지만, 종료된 트랜잭션은 롤백되므로 애초에 잠금 순서를 통일해 예방하는 게 정석입니다.

### 3. 잠금 유지 시간 최소화

트랜잭션 안에서 외부 API 호출·파일 I/O 등 느린 작업을 하면, 그 시간만큼 잠금이 유지돼 다른 요청이 줄줄이 대기합니다.
잠금 구간에는 꼭 필요한 DB 작업만 둡니다.

### 4. 잠금 범위 = WHERE 인덱스에 의존

`WHERE`가 인덱스를 못 타면 더 많은 행을 스캔하며 잠글 수 있습니다.
잠글 조건 컬럼(특히 PK/유니크)에 인덱스가 있는지 확인합니다.

### 5. 예외를 삼키는 계층에 주의

프로젝트에 SQL 예외를 잡아 빈 결과로 바꾸는 공통 처리(AOP 등)가 있으면, `NOWAIT`의 락 실패 예외(`55P03`)까지 삼켜져 **"잠금 실패"가 "데이터 없음"으로 둔갑**할 수 있습니다.

```
NOWAIT 락 실패 → 55P03 예외 → (공통 예외처리가 삼킴) → null 반환
  → 서비스가 "대상 없음"으로 오인 (실제로는 "잠겨 있음")
```

해당 매퍼가 공통 예외처리 대상인지 확인하고, 필요하면 우회하거나 **서비스 계층에서 직접 예외를 잡아** 두 경우를 구분해야 합니다.

### 6. 격리 수준과의 관계

`FOR UPDATE`는 격리 수준과 별개로 동작하는 **명시적 행 잠금**입니다.
READ COMMITTED에서도 `FOR UPDATE`로 특정 행만 직렬화할 수 있어, 격리 수준을 통째로 올리는 것보다 범위가 좁고 실용적입니다.

---

## 정리

| 구분 | 내용 |
|------|------|
| **문제** | 같은 DB를 보는 두 서버(웹·에이전트)가 같은 행을 동시에 읽고 UPDATE → Lost Update·TOCTOU |
| **흔한 오해** | UPDATE가 자동 잠금+예외로 막아줄 것이라 기대 → 실제론 대기 후 성공, `try-catch` 무력 |
| **해결** | 검증용 SELECT부터 `FOR UPDATE`로 행 잠금 → 서버 경계를 넘어 직렬화 |
| **필수 조건** | `@Transactional` — 조회·검증·변경을 한 트랜잭션에 묶어야 함 |
| **NOWAIT** | 잠긴 행이면 대기 없이 즉시 실패(55P03) → 웹 요청에서 빠른 안내 |
| **SKIP LOCKED** | 잠긴 행은 건너뜀 → 작업 큐 분배 |
| **대안** | 경합이 드물면 낙관적 잠금(version 컬럼 + 재시도) |
| **주의점** | 트랜잭션 경계, 데드락(잠금 순서), 잠금 시간, 인덱스, 예외 삼킴 |

같은 DB를 보는 여러 서버가 같은 행을 놓고 벌이는 경합은, UPDATE가 자동으로 막아주거나 예외로 실패해 주지 않습니다.
경합을 직렬화하려면 변경 시점이 아니라 검증용 조회 시점부터 `FOR UPDATE`로 행을 잠가, "조회 → 검증 → 변경"을 하나의 트랜잭션으로 묶어야 합니다.
그러면 요청이 어느 서버에서 들어오든 같은 행에 대한 처리 순서가 보장됩니다.
웹 요청이라면 `NOWAIT`으로 빠르게 되돌리고, 락 실패와 대상 없음을 구분해 처리하는 것까지가 한 세트입니다.

---

## 참고

- [PostgreSQL 공식 문서 — 13.3.2. Row-Level Locks (FOR UPDATE / FOR SHARE)](https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-ROWS)
- [PostgreSQL 공식 문서 — 13.2.1. Read Committed Isolation Level](https://www.postgresql.org/docs/current/transaction-iso.html#XACT-READ-COMMITTED)
- [PostgreSQL 공식 문서 — SELECT: The Locking Clause (NOWAIT / SKIP LOCKED)](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE)
- [PostgreSQL 공식 문서 — Appendix A. PostgreSQL Error Codes (55P03, 40P01)](https://www.postgresql.org/docs/current/errcodes-appendix.html)
