---
title: "멀티탭 세션 타임 동기화 - 탭마다 따로 도는 카운트다운 맞추기"
date: "2026-06-05"
description: "탭마다 독립적으로 돌던 세션 만료 카운트다운을, BroadcastChannel과 리더 선출로 모든 탭이 같은 시점에 만료되도록 동기화한 과정을 정리합니다. 공유 타임스탬프 기준 만료 시각 계산과, 실제 만료를 보장하는 서버 측 처리까지 함께 다룹니다."
category: "개발"
subcategory: "웹"
tags: ["guide", "advanced"]
thumbnail: "/images/thumbnails/web"
glossary:
  - id: "broadcast-channel"
    term: "BroadcastChannel"
    brief: "같은 출처의 탭/창 사이에 메시지를 주고받는 브라우저 API"
    detail: "동일 origin의 여러 탭·창·iframe 간에 메시지를 직접 전달하는 브라우저 API입니다. 별도 서버 없이 탭 사이의 활동·경고·로그아웃 신호를 전파할 수 있어 멀티탭 동기화에 사용합니다. 미지원 브라우저에서는 localStorage의 storage 이벤트로 폴백합니다."
  - id: "leader-election"
    term: "리더 선출(Leader Election)"
    brief: "여러 탭 중 하나만 대표 역할을 맡도록 정하는 방식"
    detail: "여러 탭이 각자 만료 경고를 방송하면 토스트가 중복되므로, 단 한 탭만 경고를 방송할 권한을 갖도록 정하는 방식입니다. 선출된 리더 탭은 주기적으로 HEARTBEAT를 방송해 생존을 알리고, 리더가 사라지면 다른 탭이 새 리더가 됩니다."
  - id: "idle-timeout"
    term: "idle 만료"
    brief: "마지막 활동 이후 일정 시간 무활동이면 만료시키는 기준"
    detail: "사용자의 마지막 실제 활동 시각을 기준으로, 그 후 N분간 아무 활동이 없으면 세션을 만료시킵니다. 활동이 발생하면 기준 시각이 갱신되어 만료가 미뤄집니다. 절대 만료와 함께 두 축으로 동작하며, 둘 중 먼저 도달하는 쪽이 적용됩니다."
  - id: "absolute-timeout"
    term: "절대 만료(Absolute Timeout)"
    brief: "로그인 후 경과 시간이 상한을 넘으면 활동과 무관하게 만료시키는 기준"
    detail: "로그인 시각(loginTime)을 기준으로, 활동 여부와 상관없이 N시간(기본 12시간)이 지나면 무조건 세션을 만료시킵니다. idle 만료가 활동으로 계속 연장될 수 있는 것과 달리, 절대 만료는 갱신되지 않는 상한이므로 세션의 최대 수명을 보장합니다."
  - id: "idempotency"
    term: "멱등성(Idempotency)"
    brief: "같은 연산을 여러 번 수행해도 결과가 한 번 수행한 것과 같은 성질"
    detail: "연산을 한 번 적용하든 여러 번 적용하든 결과가 달라지지 않는 성질입니다. HTTP에서 GET·PUT·DELETE가 멱등하며, 분산 환경에서 재시도나 중복 요청에 안전한 설계의 핵심 개념입니다. 예를 들어 이미 무효화된 세션을 다시 무효화해도 '무효화됨'이라는 결과는 그대로이므로 멱등합니다."
  - id: "jwt"
    term: "JWT"
    brief: "서버에 상태를 저장하지 않고 토큰 자체에 정보를 담는 무상태 인증 방식"
    detail: "JSON Web Token. 사용자 정보와 만료 시각(exp) 등을 서명된 토큰 안에 담아, 서버가 세션을 저장하지 않고도 매 요청에서 서명·exp만 검증해 인증하는 방식입니다. 무상태라 수평 확장에 유리하지만, '마지막 활동' 추적(슬라이딩 만료)이나 만료 전 즉시 무효화는 별도의 서버 측 저장소(리프레시 토큰·폐기 목록) 없이는 구현하기 어렵습니다."
---

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/thumbnails/web-light.png" alt="멀티탭 세션 동기화" />
      <img className="theme-dark" src="/images/thumbnails/web-dark.png" alt="멀티탭 세션 동기화" />
    </div>
  </div>
</figure>

회사 서비스의 세션 만료는 **프론트엔드 카운트다운**으로 처리하고 있었습니다.
로그인하면 화면 한쪽의 `#sessionClock`이 남은 시간을 세고, 0이 되면 만료 페이지로 보내는 구조였습니다.
단일 탭에서는 잘 동작했습니다.

문제는 **탭을 여러 개 띄웠을 때** 드러났습니다.
탭마다 카운트다운이 **독립적으로** 돌다 보니, 한 탭에서 한참 작업하는 동안에도 가만히 둔 옆 탭의 카운트다운은 계속 줄어들었습니다.
그래서 멀쩡히 일하던 중에 옆 탭 기준으로 먼저 만료되어 로그아웃되는 일이 생겼습니다.
탭마다 "마지막 활동 시각"을 따로 들고 있으니 만료 시점이 제각각이었던 겁니다.

이 글에서는 **탭마다 따로 도는 카운트다운을 어떻게 한 시점으로 동기화했는지**를 중심으로 정리합니다.
핵심 도구는 <Term id="broadcast-channel">BroadcastChannel</Term>과 <Term id="leader-election">리더 선출</Term>이며, 동기화의 기준이 되는 세션 타임 계산도 함께 다룹니다. (서버 측은 Spring Security 6 기반입니다.)

---

## 목표와 범위

본격적으로 들어가기 전에, 이번 작업이 맞추려 한 요구사항을 먼저 정리합니다.
본문의 설계 결정은 모두 이 요구사항을 기준으로 판단했습니다.

| 요구사항 | 내용 |
|---------|------|
| 만료 시점 일치 | 같은 브라우저의 모든 탭이 동일 시점에 만료 |
| 활동 전파 | 한 탭의 활동이 전 탭의 카운트다운을 리셋 |
| 경고 1회 | 만료 임박 경고를 탭마다 중복 없이 한 번만 표시 |
| 기존 동작 보존 | 단일탭·SSO 환경은 기존대로 동작 (동기화는 부가 기능) |

반대로 **범위 밖**으로 둔 것도 분명히 해둡니다.
다른 기기·다른 브라우저 간 세션 동기화, 그리고 서버가 모든 인스턴스·기기에 걸쳐 끊는 강제 로그아웃은 이번 목표가 아닙니다.
동기화 대상은 **"한 사용자가 같은 브라우저에서 띄운 여러 탭"**으로 한정합니다. 이 범위 설정이 뒤이은 기술 선택의 전제가 됩니다.

---

## 문제: 탭마다 따로 도는 카운트다운

기존 구조에서 각 탭은 저마다 독립된 카운트다운을 자기 활동 시각 기준으로 돌렸습니다.
그래서 다음과 같은 어긋남이 생겼습니다.

| 상황 | 기존 동작 | 원하는 동작 |
|------------|----------|------------|
| 탭 A에서 활동 | 탭 A만 리셋, 탭 B·C는 계속 감소 | 전 탭 카운트다운 리셋 |
| 탭 B가 먼저 0 도달 | 탭 B만 만료, 탭 A는 살아있다고 착각 | 전 탭이 같은 시점에 만료 |
| 만료 임박 경고 | 탭마다 각자 경고 → 토스트 중복 | 한 번만 경고 |

핵심 문제는 **만료 시각의 기준이 탭마다 흩어져 있다**는 점이었습니다.
이걸 맞추려면 두 가지가 필요했습니다.

1. 모든 탭이 **같은 활동 시각**을 기준으로 만료 시각을 계산할 것
2. 한 탭의 활동·경고·만료를 **다른 탭에 전파**할 것

<div className="info-box">
  <strong>동기화의 두 축</strong><br/><br/>
  ① 기준 통일 — 마지막 활동 시각을 한 곳(localStorage)에 두고 전 탭이 공유합니다.<br/>
  ② 신호 전파 — 활동/경고/로그아웃을 BroadcastChannel로 모든 탭에 방송합니다.
</div>

---

## 기술 선택: 왜 서버를 거치지 않고 브라우저 안에서 끝냈는가

동기화를 구현하기 전에 "어디에 상태를 두고, 어떻게 신호를 전달할지"를 먼저 정해야 했습니다.
선택지는 크게 둘이었습니다. **서버를 거치는 방식**(활동 시각을 DB나 Redis에 저장하고 폴링·WebSocket·SSE로 다른 탭에 알림)과 **브라우저 안에서 끝내는 방식**(localStorage·BroadcastChannel)입니다.
백엔드 개발자라면 활동 시각을 DB나 Redis에 두는 쪽이 먼저 떠오르기 쉽습니다. 하지만 이 문제의 성격을 따져보면 서버를 거칠 이유가 없었습니다.

### 동기화 대상은 "한 브라우저 안의 여러 탭"이다

맞춰야 하는 건 **한 사용자가 같은 브라우저에서 띄운 여러 탭**입니다.
서로 다른 기기나 다른 브라우저 간 동기화가 아니라, **같은 출처(same-origin) 안의 로컬 조정 문제**입니다.
세션 쿠키 자체가 브라우저 단위라, 동기화 범위도 자연히 브라우저 안으로 한정됩니다.
즉 이 신호는 네트워크를 나갔다 들어올 필요가 없습니다.

### 서버를 거치면 치르는 비용

카운트다운 리셋은 **사용자 활동마다** 일어나는 매우 빈번한 이벤트입니다.
이걸 서버로 보내면 다음 비용이 따라옵니다.

- **네트워크 왕복**: 활동마다 서버에 쓰고 다른 탭이 읽으려면 매번 RTT를 탑니다. 반면 BroadcastChannel·localStorage는 같은 머신·같은 브라우저 안의 **메모리/IPC 전달**이라 네트워크 스택(직렬화 → 소켓 → 공인망 → 서버 → 역순)을 아예 거치지 않습니다. 메모리·IPC 전달은 마이크로초대인데 브라우저↔서버 왕복은 보통 수~수십 밀리초로, "네트워크 홉을 타느냐"가 곧 차수(order of magnitude) 차이를 만듭니다.
- **서버 부하**: 빈번한 활동 기록·조회가 그대로 쓰기/읽기 트래픽이 됩니다.
- **푸시 수단 부재**: DB·캐시는 탭에 능동적으로 알릴 방법이 없어, 폴링하거나 WebSocket/SSE를 따로 붙여야 합니다.
- **인프라 추가**: Redis Pub/Sub이나 상시 WebSocket 연결을 단지 탭 동기화 하나를 위해 운영하는 것은 과한 인프라입니다.

> 이처럼 "더 가까운 계층에서, 네트워크 홉 없이 끝내는 것이 싸다"는 원칙은 [읽기 성능 vs 쓰기 성능 최적화 전략](/blog/read-write-performance-optimization)에서 계층별 비용 구조로 다뤘고, 그 바탕이 되는 레이턴시 숫자(μs·ms)의 감각은 [Latency Numbers](/blog/latency-numbers)에서 정리했습니다.

### 브라우저 기본 수단으로 충분하다

이 문제는 브라우저가 이미 제공하는 두 수단으로 깔끔하게 풀립니다.
핵심은 **"이벤트(신호)"와 "상태(값)"를 나눠 맡기는 것**입니다.

| 역할 | 수단 | 이유 |
|------|------|------|
| 이벤트 전파 | BroadcastChannel | 활동·경고·로그아웃 같은 신호를 탭 간 즉시 전달. 휘발성이라 신호용으로 적합 |
| 상태 공유 | localStorage | `sf_lastActivity` 같은 기준값을 지속 보관. 늦게 합류한 탭도 현재 기준을 읽음 |
| 폴백 | localStorage `storage` 이벤트 | BroadcastChannel 미지원 시 같은 값 변경을 신호로 활용 |

BroadcastChannel만 쓰면 **이미 방송이 끝난 뒤 열린 탭**은 직전 활동 시각을 알 수 없습니다(이벤트는 휘발성).
그래서 마지막 활동 시각이라는 **상태**는 localStorage에 두어 누구나 읽을 수 있게 하고, **이벤트**만 BroadcastChannel로 전파합니다.

### 후보 비교

서버 경유 방식의 대표 후보(Redis Pub/Sub, WebSocket/SSE)와 브라우저 내부 방식을 같은 기준으로 비교하면 다음과 같습니다.

| 기준 | Redis Pub/Sub | WebSocket / SSE | localStorage + BroadcastChannel |
|------|--------------|-----------------|--------------------------------|
| 전파 지연 | 네트워크 왕복 | 네트워크 왕복 | 브라우저 내부(거의 즉시) |
| 서버 부하 | 활동마다 발생 | 상시 연결 유지 | 없음 |
| 추가 인프라 | Redis 운영 | 연결·핸들러 | 없음(브라우저 내장) |
| 적용 범위 | 기기·브라우저 간 | 기기·브라우저 간 | 같은 브라우저 내 |
| 이 문제 적합성 | 과함 | 과함 | 적합 |

### 한계

이 선택에는 분명한 한계가 있습니다. 하나씩 짚으면 다음과 같습니다.

- **같은 브라우저 안으로 한정**됩니다. 다른 기기·다른 브라우저의 탭은 동기화되지 않습니다. 하지만 그건 애초에 요구사항이 아니었습니다.
- **서버 세션에 대한 높은 의존성**입니다. localStorage 값은 화면 표시를 위한 캐시일 뿐, 조작되더라도 뒤에서 다루듯 서버가 실제 만료를 막습니다.
- **localStorage는 XSS에 노출**됩니다. 그래서 민감정보는 저장하지 않고(타임스탬프뿐), 방송 redirect는 `sanitizeRedirect`로 검증합니다.

---

## 멀티탭 동기화 설계 (session-sync.js)

목표는 두 가지입니다.
**여러 탭이 동일 시점에 만료**되고, 한 탭에서의 활동이 **모든 탭의 카운트다운을 리셋**하는 것.
이를 `session-sync.js`로 구현했습니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/multitab-session-time-sync/multitab-leader-election-light.png" alt="멀티탭 리더 선출과 메시지 방송 시퀀스" />
      <img className="theme-dark" src="/images/posts/multitab-session-time-sync/multitab-leader-election-dark.png" alt="멀티탭 리더 선출과 메시지 방송 시퀀스" />
    </div>
  </div>
  <figcaption>리더 탭만 HEARTBEAT와 WARNING을 방송하고, 활동·로그아웃은 전 탭에 전파되어 만료 시점이 일치한다</figcaption>
</figure>

### 메시지 타입

탭 사이에 주고받는 신호는 네 종류입니다.

| 타입 | 의미 | 처리 |
|------|------|------|
| `ACTIVITY` | 사용자 활동 발생 | 수신 탭이 카운트다운 리셋 |
| `HEARTBEAT` | 리더 생존 신호 | 비리더 탭이 리더 체크 타이머 갱신 |
| `WARNING` | 만료 임박 경고 | 전 탭 토스트 1회 표시 |
| `LOGOUT` | 만료/로그아웃 확정 | 전 탭 즉시 종료 |

### 리더 선출이 필요한 이유

만료 임박 경고를 **모든 탭이 각자 방송하면 토스트가 N번 중복**됩니다.
그래서 단 한 탭(리더)만 경고를 방송할 권한을 갖습니다.
리더는 주기적으로 HEARTBEAT를 방송해 생존을 알리고, 리더가 사라지면 다른 탭이 새 리더가 됩니다.

### 만료 시각 계산 — 공유 타임스탬프 기준

동기화의 토대는 모든 탭이 함께 참조하는 공유 타임스탬프입니다.
탭마다 `Date.now()`로 만료 시각을 따로 계산하면 어긋나므로, `localStorage`에 공유된 `sf_lastActivity`를 기준으로 모든 탭이 동일한 만료 시각을 계산합니다.

```javascript
const getSessionTimeoutDate = async () => {
    const timeoutMs = (await getSessionTimeout()) * 60 * 1000;

    let baseTime = Date.now();
    const shared = localStorage.getItem('sf_lastActivity');
    if (shared) {
        const parsed = parseInt(shared, 10);
        // 미래값/과거 과다값 방어
        if (!isNaN(parsed) && parsed > 0 && parsed <= Date.now()) {
            baseTime = parsed;
        }
    }
    return new Date(baseTime + timeoutMs);  // 전 탭 동일 만료 시각
};
```

한 탭이 활동으로 `sf_lastActivity`를 갱신하면, 그 값을 공유하는 다른 탭들도 같은 기준에서 만료 시각을 다시 맞추게 됩니다.

### 활동 전파 — 순서가 중요하다

AJAX가 완료되면 `countdownReset()`이 호출되어, 활동을 알리고 카운트다운을 다시 맞춥니다.
먼저 활동을 알리는 `notifyActivity()`부터 보겠습니다. 이 함수는 두 가지 일을 합니다. 공유 타임스탬프(`sf_lastActivity`)를 현재 시각으로 갱신하고, 다른 탭에 `ACTIVITY` 메시지를 방송합니다.

```javascript
// session-sync.js
function notifyActivity() {
    const now = Date.now();
    localStorage.setItem('sf_lastActivity', String(now));   // ① 공유 타임스탬프 갱신
    channel?.postMessage({ type: 'ACTIVITY', time: now });  // ② 다른 탭에 활동 방송
}
```

방송을 받은 다른 탭은 갱신된 `sf_lastActivity`를 기준으로 카운트다운을 다시 맞춥니다. (BroadcastChannel이 없는 환경에서는 `localStorage.setItem`이 일으키는 `storage` 이벤트가 그 역할을 대신합니다.)

이제 `countdownReset()`이 이 `notifyActivity()`와 `getSessionTimeoutDate()`를 묶습니다. 여기서 **방송과 계산의 순서**를 지켜야 합니다.

```javascript
const countdownReset = async () => {
    // ① 먼저 sf_lastActivity 를 now 로 갱신 + 방송
    if (window.sessionSync?.notifyActivity) {
        window.sessionSync.notifyActivity();
    }
    // ② 그 다음 공유 타임스탬프 기준으로 만료 시각 계산
    const timeoutDate = await getSessionTimeoutDate();
    $('#sessionClock').countdown(timeoutDate);
};
```

`notifyActivity()`가 먼저 `sf_lastActivity`를 갱신해야 이어지는 `getSessionTimeoutDate()`가 그 값을 읽습니다.
순서가 반대면, 활동을 일으킨 탭이 **갱신 전의 옛 활동 시각**을 기준으로 만료 시각을 계산해, 정작 자기 카운트다운이 리셋되지 않습니다.

### 경고 중복 방지 — "활동"이 아니라 "잔여시간" 기준

타임아웃이 짧으면 잔여시간이 항상 60초 이하라, 활동이 일어날 때마다 경고 토스트가 뜨는 문제가 생깁니다.
그래서 경고의 표시·재무장을 **활동이 아니라 잔여시간 구간**으로 판단합니다.

```javascript
.on('update.countdown', function(event) {
    const remainingSeconds = event.offset.totalSeconds;
    if (remainingSeconds > 60) {
        window.sessionSync.armWarning();        // 경고 구간 밖 → 재무장
    } else if (remainingSeconds > 0 && window.sessionSync.isLeader()) {
        window.sessionSync.broadcastWarning();  // 임박 → 리더만 방송
    }
})
```

> 탭 간 상태를 localStorage로 공유하고 만료 시각을 캐시값에서 재구성하는 방식은, [localStorage SWR 캐싱 패턴](/blog/localstorage-swr-caching-pattern)에서 다룬 "캐시를 신뢰 가능한 기준으로 다루는" 발상과 같은 결을 가집니다.

---

## 동기화의 기준: 세션 타임은 어떻게 계산하나

앞에서는 탭들이 "같은 만료 시각"을 맞추는 방법을 봤습니다.
그렇다면 그 만료 시각의 바탕이 되는 "세션 타임"이 무엇인지부터 짚어보겠습니다.
세션 만료는 하나의 기준만으로는 부족합니다.
"활동이 없으면 만료"와 "오래되면 만료"는 다른 요구이기 때문입니다.
그래서 **두 가지 독립적인 만료 기준**을 동시에 두고, 둘 중 먼저 도달하는 쪽을 적용합니다.

| 만료 축 | 기준 속성 | 의미 | 기본값 |
|---------|----------|------|--------|
| <Term id="idle-timeout">idle 만료</Term> | 마지막 활동 시각 | 마지막 활동 후 N분간 무활동 시 만료 | DB `sessionTime`(분) |
| <Term id="absolute-timeout">절대 만료</Term> | `loginTime` | 로그인 후 N시간 경과 시 무조건 만료 | 12시간 |

```
유효 잔여시간 = min(idle 잔여, 절대 잔여)

idle 잔여 = idleTimeoutSec  - (now - sf_lastActivity)
절대 잔여 = absoluteTimeout - (now - loginTime)
```

클라이언트 카운트다운은 마지막 활동 시각(`sf_lastActivity`)을 공유 타임스탬프로 삼아 idle 잔여를 계산해 보여줍니다.
다만 이 카운트다운은 표시일 뿐이고, 실제 만료가 일어나도록 보장하는 일은 서버가 맡습니다(다음 절).

---

## 진짜 만료는 서버가 쥔다

지금까지의 동기화는 모두 클라이언트 쪽 이야기입니다.
그런데 `sf_lastActivity`는 localStorage 값이라 사용자가 조작할 수 있고, 백그라운드 탭에서는 JS 타이머가 느려지거나 멈출 수도 있습니다.
그래서 카운트다운은 어디까지나 **표시(UX)** 수단이고, 만료의 최종 판정은 서버가 쥡니다.

- **idle 만료**는 서블릿 컨테이너의 `maxInactiveInterval`이 처리합니다. 로그인 시 idle 타임아웃(+버퍼)을 설정해 두면, 실제 요청이 들어올 때마다 컨테이너가 마지막 접근 시각을 갱신하고, 무활동이 그 시간을 넘으면 세션을 만료시킵니다.
- **절대 만료**(로그인 후 12시간)는 컨테이너가 제공하지 않으므로, 인터셉터가 `loginTime`을 검사해 강제합니다.

클라이언트 카운트다운이 조작되거나 멈춰도 서버 기준 만료는 그대로 적용되므로, 동기화는 신뢰할 수 있는 표시 계층으로 남습니다.

<div className="info-box">
  <strong>참고 — 함께 고친 별개의 문제</strong><br/><br/>
  카운트다운 위젯이 없는 에러 페이지에서 세션이 만료되지 않던 문제도 이 작업과 함께 고쳤습니다.
  원인은 세션 만료를 무제한으로 두고 카운트다운에만 의존한 것이었고, 위 <code>maxInactiveInterval</code> 설정으로 해결됩니다.
  다만 이건 탭 간 <strong>동기화</strong>와는 다른 축의 개선입니다.
</div>

---

## 멱등 무효화와 동시 만료 경합

멀티탭 동기화를 적용하면 새로운 경합이 생깁니다.
전 탭이 같은 시점에 만료되도록 맞춰놨으니, 카운트다운 종료나 절대 만료가 발생하면 **여러 탭의 요청이 같은 세션을 거의 동시에 무효화**하려 합니다.
이미 무효화된 세션에 `invalidate()`를 다시 호출하면 `IllegalStateException`이 던져지는데, 이는 "세션을 끝낸다"는 목표가 이미 달성된 **정상 경합**입니다.
따라서 이 예외만 삼키고, 그 외 예외는 전파합니다. 이미 무효화된 세션을 다시 무효화해도 안전하도록 만드는, <Term id="idempotency">멱등</Term>한 처리입니다.

```java
public static void invalidateQuietly(HttpSession session) {
    if (session == null) return;
    try {
        session.invalidate();
    } catch (IllegalStateException alreadyInvalidated) {
        // 다른 동시 요청(멀티탭 만료)이 먼저 무효화함 — 정상 경합, 무시
        log.debug("Session already invalidated by a concurrent request - skip: {}",
                alreadyInvalidated.getMessage());
    }
}
```

---

## 보안과 폴백 설계

### 방송 redirect 검증

`LOGOUT` 방송에는 이동할 `redirect` 경로가 담깁니다.
하지만 이 값을 그대로 믿으면, 동일 origin XSS가 성립했을 때 다른 탭을 임의 URL로 강제 이동시킬 수 있습니다.
그래서 **같은 출처의 상대경로만 허용**하고, 그 외는 만료 페이지로 폴백합니다.

```javascript
function sanitizeRedirect(redirect) {
    // '/' 로 시작하고 '//' 가 아닌 상대경로만 허용
    return (typeof redirect === 'string' && /^\/(?!\/)/.test(redirect))
        ? redirect
        : TIMEOUT_URL;
}
```

절대 URL, `javascript:` 스킴, `//`로 시작하는 프로토콜 상대 URL은 모두 차단됩니다.

### Graceful Degradation

멀티탭 동기화는 어디까지나 부가 기능이므로, 환경이 받쳐주지 않아도 **단일탭 기준의 기존 동작은 유지**되어야 합니다.

| 상황 | 폴백 동작 |
|------|----------|
| BroadcastChannel 미지원 | localStorage `storage` 이벤트로 전파 |
| localStorage 접근 불가 | 단일탭 모드로 정상 동작 (방송만 생략) |
| `session-sync.js` 미로드 | 기존 단일탭 카운트다운 유지 |
| SSO 세션 (`#sessionClock` 없음) | 리더 선출·활동 추적 무동작 |

### AJAX vs 페이지 만료 응답 분기

서버가 세션 만료를 응답할 때는 요청 유형에 맞춰 분기합니다.
AJAX에는 401 JSON을 내려 기존 공통 스크립트가 처리하게 하고, 일반 페이지 요청은 만료 페이지로 리다이렉트합니다.

```java
if (SessionTimeoutSupport.isAjaxRequest(xRequestedWith, accept)) {
    response.setStatus(401);
    // {errMessage:"sessionTimeoutException", ...} — 공통 스크립트 호환, i18n 메시지
} else {
    response.sendRedirect("/error/timeout");
}
```

> 401 응답에 담는 만료 안내 문구는 하드코딩하지 않고 메시지 리소스로 관리합니다. 이런 다국어 메시지 처리 구조는 [Spring Boot에서 i18next로 다국어 구현하기](/blog/spring-boot-i18next-architecture)에서 자세히 다뤘습니다.

---

## 주의사항

작업하면서 반복적으로 부딪힌, 놓치기 쉬운 지점들입니다.

<div className="warning-box">
  <strong>멀티탭 세션 동기화 체크리스트</strong><br/><br/>
  <strong>1. 만료 시각은 공유 타임스탬프로 계산한다</strong><br/>
  → 탭마다 <code>Date.now()</code>로 계산하면 시점이 어긋납니다. <code>sf_lastActivity</code>를 전 탭이 공유해야 합니다.<br/><br/>
  <strong>2. 활동 방송 순서를 지킨다</strong><br/>
  → <code>notifyActivity()</code> → <code>getSessionTimeoutDate()</code> 순서여야 저장 탭의 카운트다운도 리셋됩니다.<br/><br/>
  <strong>3. 경고는 리더만 방송한다</strong><br/>
  → 모든 탭이 방송하면 토스트가 중복됩니다. 리더 선출로 한 탭만 경고하게 합니다.<br/><br/>
  <strong>4. 경고 재무장은 잔여시간 기준으로 한다</strong><br/>
  → 활동 기준으로 하면 짧은 타임아웃에서 토스트가 중복됩니다.<br/><br/>
  <strong>5. 동시 만료는 멱등하게 처리한다</strong><br/>
  → 멀티탭 동시 만료의 <code>IllegalStateException</code>은 정상 경합이므로 삼키되, 그 외 예외는 전파합니다.
</div>

---

## 확장 관점: 다중 인스턴스와 JWT 환경에서는

지금까지의 구현은 **서버 세션(`HttpSession`) 기반**입니다.
idle 만료는 컨테이너의 `maxInactiveInterval`에, 절대 만료는 세션 속성 `loginTime`에 기대고, 만료는 `session.invalidate()` 또는 컨테이너 타임아웃으로 처리합니다.
이 전제가 환경에 따라 어떻게 영향을 받는지 두 가지로 짚어봅니다.

### 다중 인스턴스 + 외부 세션 저장소(Redis)

트래픽 분산을 위해 같은 비즈니스 로직의 서버를 여러 대 띄우면, 인메모리 세션은 인스턴스마다 따로 존재해 요청이 다른 인스턴스로 갈 때 세션을 잃습니다.
그래서 **Spring Session + Redis**처럼 세션을 외부 저장소로 빼서 모든 인스턴스가 공유하게 만듭니다.

이때 **동기화는 그대로, 오히려 더 견고하게 동작합니다.**

| 항목 | 인메모리 세션 | Redis 외부 세션 |
|------|--------------|----------------|
| 클라이언트 동기화(BroadcastChannel) | 동작 | **동일하게 동작** (백엔드와 무관) |
| 세션(`maxInactiveInterval`·`loginTime`) | 단일 JVM에만 존재 | **전 인스턴스 공유** |
| idle 갱신·세션 유지 | sticky session 필요 | 어느 인스턴스로 가도 동일 세션 |
| `invalidateQuietly` | 그 JVM에서만 | **전 인스턴스에 즉시 반영** |

**클라이언트 동기화 층은 백엔드가 몇 대든 영향을 받지 않습니다.** 이유는 BroadcastChannel(과 localStorage)이 **오리진** 단위로 동작하기 때문입니다. 오리진은 스킴(`https`)·호스트(도메인 또는 IP)·포트의 조합인데, 브라우저는 로드 밸런서 뒤의 개별 인스턴스를 보지 못하고 `https://app.example.com` 같은 **하나의 오리진**만 봅니다. 요청이 어느 인스턴스로 라우팅되든 오리진은 그대로이므로, 탭 간 메시지 전파는 백엔드 구성(1대든 N대든)과 무관하게 브라우저 안에서 동일하게 일어납니다.

오히려 **서버 쪽이 더 견고해집니다.** 세션을 Redis로 옮기기만 하면 서버 측 만료 로직은 코드 변경 없이 그대로 가고, 세션 무효화가 한 JVM에 갇히지 않고 전 인스턴스에 일관되게 반영됩니다. sticky session에 기대지 않아도 어느 인스턴스가 요청을 받든 같은 세션을 보게 됩니다.

> 한 가지 주의: 세션 속성이 Redis로 직렬화되므로 `loginTime` 같은 값의 타입·직렬화 정합성을 더 신경 써야 합니다. 또 활동마다 세션을 쓰면 Redis 쓰기가 늘지만, 빈번한 카운트다운 리셋은 BroadcastChannel이 브라우저 안에서 처리하고 서버는 실제 HTTP 요청 때만 쓰므로 부담이 폭증하지는 않습니다.

### JWT(무상태) 환경의 한계

세션 대신 **<Term id="jwt">JWT</Term>** 같은 무상태 토큰을 쓰면 이야기가 달라집니다.
얹어둘 서버 세션이 없으니, 세션에 기대던 기능이 그대로 옮겨가지 못합니다.

| 기능 | 세션 기반(이 글) | JWT(무상태) |
|------|-----------------|-------------|
| 절대 만료 | `loginTime` 검사 | **토큰 `exp`로 간단** (서명+exp 검증) |
| idle(슬라이딩) 만료 | `maxInactiveInterval` | **어려움** — 무상태로는 "마지막 활동"을 못 들고 있음 |
| 즉시 무효화/강제 로그아웃 | `session.invalidate()` | **불가** — exp 전엔 못 끊음, 별도 폐기 목록 필요 |

가장 큰 한계는 **idle 만료와 즉시 무효화**입니다.
둘 다 "서버가 상태를 들고 있어야" 가능한 기능인데, JWT의 장점인 무상태성과 정면으로 부딪힙니다.
그래서 JWT로 idle 만료나 강제 로그아웃을 구현하려면 결국 **리프레시 토큰 회전 + Redis의 활동·폐기 상태 저장소(블랙리스트)**를 도입하게 되고, 이는 "무상태"를 일부 포기하고 서버 상태를 되돌리는 셈입니다.
역설적으로, 세션 방식이 공짜로 주던 것(슬라이딩 만료·즉시 무효화)을 JWT에서는 인프라를 더 들여 되사는 구조가 됩니다.

단, **클라이언트 멀티탭 동기화 층은 JWT에서도 그대로 쓸 수 있습니다.**
BroadcastChannel·localStorage는 인증 방식과 무관하고, 공유 타임스탬프의 기준만 세션 잔여시간 대신 토큰 `exp`(또는 리프레시 만료)로 바꾸면 됩니다.

---

## 마치며

"옆 탭 때문에 작업 중에 로그아웃된다"는 불편에서 출발했지만, 결국 **흩어진 만료 기준을 한 시점으로 모으는** 문제였습니다.
정리하면 다음과 같습니다.

| 구분 | 내용 |
|------|------|
| **기준 통일** | 마지막 활동 시각을 `sf_lastActivity` 하나로 공유해 전 탭이 같은 만료 시각을 계산 |
| **신호 전파** | BroadcastChannel + 리더 선출로 활동·경고·만료를 전 탭에 일관 적용 |
| **순서·중복 방어** | 활동 방송 후 만료 시각 계산, 경고는 잔여시간 기준 + 리더만 방송 |
| **세션 타임 기준** | idle 만료(`maxInactiveInterval`)와 절대 만료(`loginTime`, 12h) 중 먼저 도달하는 쪽 적용 |
| **서버가 진짜 만료** | idle은 컨테이너 `maxInactiveInterval`, 절대는 인터셉터(`loginTime`) — 카운트다운은 표시일 뿐 |
| **멱등 무효화** | 동시 만료 경합(`IllegalStateException`)을 정상 경합으로 삼킴 |

탭 동기화는 따지고 보면 "기준을 어디에 둘 것인가"의 문제였습니다.
표시는 여러 탭에 흩어지더라도 기준 시각은 하나로 공유하고, 그 기준이 실제로 지켜지는지는 서버가 받쳐준다 — 이 분리가 멀티탭 만료를 일관되게 만든 핵심이었습니다.
