---
title: "Spring @Transactional과 PostgreSQL 트랜잭션 abort"
date: "2026-04-29"
description: "PostgreSQL에서 트랜잭션 내 SQL 에러가 발생하면 이후 모든 쿼리가 실패하는 abort 상태를 분석합니다. try-catch가 무력화되는 원인, MySQL과의 차이, REQUIRES_NEW를 활용한 해결법을 정리합니다."
category: "개발"
subcategory: "Spring"
tags: ["guide", "intermediate"]
thumbnail: "/images/thumbnails/springboot"
glossary:
  - id: "transaction-abort"
    term: "트랜잭션 abort"
    brief: "PostgreSQL에서 트랜잭션 내 에러 발생 시 해당 트랜잭션 전체가 무효화된 상태"
    detail: "PostgreSQL은 트랜잭션 안에서 하나의 SQL이라도 에러가 발생하면 해당 트랜잭션을 abort 상태로 전환한다. abort 상태에서는 ROLLBACK이나 SAVEPOINT 롤백 외의 모든 SQL 실행이 거부되며, 'current transaction is aborted, commands ignored until end of transaction block' 에러가 반환된다."
  - id: "requires-new"
    term: "REQUIRES_NEW"
    brief: "기존 트랜잭션을 일시 중단하고 독립적인 새 트랜잭션을 시작하는 전파 옵션"
    detail: "Spring @Transactional의 propagation 속성 중 하나로, 호출 시점에 이미 진행 중인 트랜잭션이 있으면 이를 일시 중단(suspend)하고 새로운 독립 트랜잭션을 생성한다. 내부 트랜잭션의 성공/실패가 외부 트랜잭션에 영향을 주지 않으므로, 실패 가능성이 있는 쿼리를 격리할 때 사용한다."
  - id: "savepoint"
    term: "SAVEPOINT"
    brief: "트랜잭션 중간에 설정하는 복원 지점"
    detail: "PostgreSQL에서 SAVEPOINT를 설정하면 에러 발생 시 해당 지점까지만 롤백(ROLLBACK TO SAVEPOINT)하고 나머지 트랜잭션은 계속 진행할 수 있다. Spring에서는 NESTED 전파 옵션이 이에 해당한다."
  - id: "propagation"
    term: "트랜잭션 전파(Propagation)"
    brief: "이미 진행 중인 트랜잭션이 있을 때 새로운 트랜잭션을 어떻게 처리할지 결정하는 정책"
    detail: "Spring @Transactional의 propagation 속성으로 설정한다. REQUIRED(기본값, 기존 참여), REQUIRES_NEW(새 트랜잭션), NESTED(중첩 트랜잭션), NOT_SUPPORTED(트랜잭션 없이 실행) 등이 있다."
  - id: "rollback-only"
    term: "rollback-only"
    brief: "트랜잭션이 커밋되지 않고 반드시 롤백되어야 한다는 마킹 상태"
    detail: "Spring에서 @Transactional 메서드 내부에서 RuntimeException이 발생하면 트랜잭션에 rollback-only 마크가 설정된다. 이후 외부 메서드에서 예외를 catch하더라도 트랜잭션 커밋 시점에 UnexpectedRollbackException이 발생한다."
  - id: "nested-transaction"
    term: "중첩 트랜잭션(Nested Transaction)"
    brief: "외부 트랜잭션 안에서 SAVEPOINT를 사용해 부분 롤백이 가능한 하위 트랜잭션"
    detail: "PROPAGATION_NESTED를 사용하면 물리적으로는 하나의 트랜잭션이지만 SAVEPOINT로 구간을 나누어, 내부 구간만 롤백하고 외부 트랜잭션은 계속 진행할 수 있다. 단, 물리 트랜잭션이 같으므로 외부가 롤백되면 내부도 함께 롤백된다."
  - id: "atomicity"
    term: "원자성(Atomicity)"
    brief: "트랜잭션의 모든 연산이 전부 성공하거나 전부 실패해야 한다는 ACID 속성"
    detail: "ACID의 A에 해당하며, 트랜잭션 내 일부만 적용되는 부분 커밋을 허용하지 않는다. PostgreSQL은 이 원칙을 엄격하게 적용하여 트랜잭션 내 하나의 SQL이라도 실패하면 전체를 abort 상태로 전환한다. MySQL(InnoDB)은 상대적으로 유연하게 해석하여 실패한 statement만 무효화하고 트랜잭션을 유지한다."
---

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/thumbnails/springboot-light.png" alt="Spring Boot" />
      <img className="theme-dark" src="/images/thumbnails/springboot-dark.png" alt="Spring Boot" />
    </div>
  </div>
</figure>

회사에서 PostgreSQL DB를 사용하는 서비스에서 `@Transactional`을 다룰 때 있었던 일입니다.
`@Transactional`을 선언한 메서드 안에서 핵심 데이터를 INSERT한 뒤, 부가 로직으로 메일 발송 쿼리를 실행하는 구조였습니다.
메일 발송은 어디까지나 부가적인 요소이므로, 실패하더라도 메인 INSERT에는 영향을 주지 않아야 했습니다.
당연히 `try-catch`로 감싸서 처리했습니다.

테스트 중 메일 수신자 조회 쿼리에서 SQL 에러가 발생했지만, `try-catch`로 잡고 있으니 INSERT는 안전할 것이라 판단했습니다.
하지만 결과는 INSERT 데이터까지 모두 사라지는 **silent rollback**이었습니다.

원인은 PostgreSQL의 <Term id="transaction-abort">트랜잭션 abort</Term> 메커니즘이었습니다.
MySQL에서는 발생하지 않는, PostgreSQL 고유의 동작입니다.
이 글에서는 이 현상의 원인, MySQL과의 차이, 그리고 <Term id="requires-new">REQUIRES_NEW</Term>를 사용한 해결 방법을 정리합니다.

---

## 문제: try-catch로 잡았는데 다음 쿼리가 실패한다

아래는 문제가 발생한 코드의 구조를 단순화한 것입니다.

```java
@Transactional
public void processOrder(OrderDTO order) {
    // 1. 핵심 데이터 INSERT (성공)
    orderMapper.insert(order);

    // 2. 메일 수신자 조회 (실패 가능)
    try {
        mailMapper.selectRecipients(order.getId());
    } catch (Exception e) {
        log.warn("메일 수신자 조회 실패, 건너뜀: {}", e.getMessage());
    }

    // 3. 상태 업데이트
    orderMapper.updateStatus(order.getId(), "COMPLETED");
}
```

**기대 동작**: 2번이 실패해도 1번 INSERT와 3번 UPDATE는 커밋됩니다.

**실제 동작**: PostgreSQL에서는 **1번, 3번 모두 롤백**됩니다.

<div className="warning-box">
  <strong>핵심 문제</strong><br/><br/>
  Java의 <code>try-catch</code>는 JVM 프로세스 내의 예외 전파를 제어할 뿐입니다.
  PostgreSQL 서버의 트랜잭션 상태는 <strong>네트워크 너머에 있는 별개의 상태 머신</strong>이므로,
  Java 코드로 직접 복구할 수 없습니다.
</div>

---

## 원인: PostgreSQL의 트랜잭션 에러 처리 방식

### MySQL vs PostgreSQL — 에러 후 동작 차이

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/spring-transactional-postgresql-abort/mysql-vs-postgresql-light.png" alt="MySQL vs PostgreSQL 트랜잭션 에러 처리 비교" />
      <img className="theme-dark" src="/images/posts/spring-transactional-postgresql-abort/mysql-vs-postgresql-dark.png" alt="MySQL vs PostgreSQL 트랜잭션 에러 처리 비교" />
    </div>
  </div>
  <figcaption>MySQL은 에러 쿼리만 실패하고 트랜잭션이 계속되지만, PostgreSQL은 트랜잭션 전체가 abort 상태로 전환된다</figcaption>
</figure>

| 동작 | MySQL (InnoDB) | PostgreSQL |
|------|---------------|------------|
| 트랜잭션 내 SQL 에러 발생 | 해당 쿼리만 실패, 트랜잭션 유지 | **트랜잭션 전체가 abort 상태로 전환** |
| abort 후 다음 쿼리 실행 | 정상 실행 가능 | 거부됨 (`current transaction is aborted`) |
| abort 후 COMMIT 시도 | 정상 커밋 (에러 쿼리 제외) | **자동 ROLLBACK** |

MySQL에 익숙한 상태에서 PostgreSQL로 전환하면 이 차이에 의해 예상치 못한 롤백이 발생할 수 있습니다.

### abort 상태란

PostgreSQL은 트랜잭션 내에서 SQL 에러가 발생하면 해당 트랜잭션을 <Term id="transaction-abort">abort 상태</Term>로 전환합니다.
abort 상태에서는 `ROLLBACK` 명령 외의 모든 SQL 실행이 거부됩니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/spring-transactional-postgresql-abort/abort-flow-light.png" alt="PostgreSQL 트랜잭션 abort 흐름" />
      <img className="theme-dark" src="/images/posts/spring-transactional-postgresql-abort/abort-flow-dark.png" alt="PostgreSQL 트랜잭션 abort 흐름" />
    </div>
  </div>
  <figcaption>SQL 에러 발생 후 try-catch로 잡아도 PostgreSQL 트랜잭션은 abort 상태를 유지한다</figcaption>
</figure>

```
Java 레벨                        DB 서버 레벨
─────────────                    ──────────────
try {
  mailMapper.select(...)  ──────→ SQL 실행 → 에러 → 트랜잭션 abort
} catch (Exception e) {
  log.warn("실패");              // DB는 여전히 abort 상태
}

orderMapper.update(...)  ───────→ "current transaction is aborted" 거부

// Spring COMMIT 시도    ───────→ PostgreSQL: ROLLBACK 처리
```

Java에서 예외를 catch해도 PostgreSQL 서버의 트랜잭션 상태는 변하지 않습니다.
abort된 트랜잭션은 `ROLLBACK`이나 <Term id="savepoint">SAVEPOINT</Term> 롤백으로만 복구할 수 있습니다.

---

## 해결 방법

아래 방법들은 **"실패해도 메인 비즈니스에 영향 없는 부가 로직"**을 격리할 때 사용합니다.
메인 로직과 <Term id="atomicity">원자성</Term>이 필요한 경우(함께 롤백되어야 하는 로직)에는 적합하지 않습니다.
PostgreSQL abort 방어뿐 아니라, DB 종류와 무관하게 **관심사 분리** 관점에서 부가 로직을 격리하는 설계 패턴으로 권장됩니다.

### 방법 1: REQUIRES_NEW로 실패 가능 쿼리 격리 (권장)

실무에서 이 문제를 해결할 때 사용한 방법입니다.
실패 가능한 로직을 **별도 Bean의 별도 트랜잭션**으로 분리합니다.

```java
// 메일 서비스 (별도 Bean)
@Service
@RequiredArgsConstructor
public class MailServiceImpl implements MailService {

    private final MailMapper mailMapper;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @Override
    public List<RecipientDTO> getRecipients(Long orderId) {
        return mailMapper.selectRecipients(orderId);
    }
}
```

```java
// 주문 서비스 (호출부)
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderMapper orderMapper;
    private final MailService mailService;  // 별도 Bean 주입

    @Transactional
    @Override
    public void processOrder(OrderDTO order) {
        orderMapper.insert(order);

        try {
            mailService.getRecipients(order.getId());  // 별도 트랜잭션
        } catch (Exception e) {
            log.warn("메일 수신자 조회 실패, 주문 처리는 계속: {}", e.getMessage());
        }

        orderMapper.updateStatus(order.getId(), "COMPLETED");
    }
}
```

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/spring-transactional-postgresql-abort/requires-new-solution-light.png" alt="REQUIRES_NEW 해결법 시퀀스" />
      <img className="theme-dark" src="/images/posts/spring-transactional-postgresql-abort/requires-new-solution-dark.png" alt="REQUIRES_NEW 해결법 시퀀스" />
    </div>
  </div>
  <figcaption>REQUIRES_NEW는 별도 트랜잭션(Tx2)을 생성하여, Tx2가 실패해도 외부 트랜잭션(Tx1)은 영향받지 않는다</figcaption>
</figure>

<Term id="requires-new">REQUIRES_NEW</Term>는 외부 트랜잭션(Tx1)을 일시 중단하고, 내부 로직을 독립적인 새 트랜잭션(Tx2)에서 실행합니다.
Tx2에서 SQL 에러가 발생해도 abort 상태는 Tx2에만 적용되므로, Tx1은 정상적으로 계속 진행할 수 있습니다.

<div className="warning-box">
  <strong>REQUIRES_NEW 사용 시 주의사항</strong><br/><br/>
  <strong>1. 별도 Bean 필수</strong> — 같은 클래스 내 private 메서드에 붙이면 AOP 프록시를 타지 않아 무효입니다.<br/>
  <strong>2. 커넥션 2개 사용</strong> — 메인 + 신규 트랜잭션이 각각 DB 커넥션을 점유하므로 풀 고갈에 주의해야 합니다.<br/>
  <strong>3. 데드락 가능성</strong> — Tx1이 잡은 row를 Tx2가 접근하면 서로 대기 상태에 빠질 수 있습니다.<br/>
  <strong>4. 롤백 범위 비대칭</strong> — Tx2 실패 시 Tx1은 유지되지만, Tx1 실패 시 Tx2는 이미 커밋되어 롤백이 불가능합니다.
</div>

### 방법 2: SAVEPOINT로 부분 롤백

PostgreSQL의 <Term id="savepoint">SAVEPOINT</Term>를 활용하면 하나의 트랜잭션 안에서 부분 롤백이 가능합니다.
Spring의 `NESTED` <Term id="propagation">전파 옵션</Term>이 이에 해당합니다.

```java
@Transactional(propagation = Propagation.NESTED)
public List<RecipientDTO> getRecipients(Long orderId) {
    return mailMapper.selectRecipients(orderId);
}
```

```
트랜잭션 흐름:
BEGIN
INSERT orders ✅
SAVEPOINT sp1
  SELECT recipients ❌
ROLLBACK TO SAVEPOINT sp1    ← 여기까지만 롤백
UPDATE status ✅             ← 정상 실행 가능
COMMIT ✅
```

<Term id="nested-transaction">중첩 트랜잭션</Term>은 커넥션을 1개만 사용한다는 장점이 있지만, MyBatis 환경에서는 지원이 제한적입니다.
JPA/Hibernate 환경에서 더 적합한 방법입니다.

### 방법 3: 트랜잭션 밖에서 실행

실패해도 무방한 로직(알림, 메일 발송 등)은 트랜잭션 커밋 후 실행하는 것도 방법입니다.

```java
@Transactional
public void processOrder(OrderDTO order) {
    orderMapper.insert(order);
    orderMapper.updateStatus(order.getId(), "COMPLETED");
}
```

```java
// 호출부에서 분리
public void handleOrder(OrderDTO order) {
    orderService.processOrder(order);  // 트랜잭션 커밋 완료

    try {
        mailService.dispatch(order.toParam());  // 트랜잭션 밖에서 실행
    } catch (Exception e) {
        log.warn("메일 발송 실패: {}", e.getMessage());
    }
}
```

`@TransactionalEventListener`를 사용하면 커밋 후 실행을 더 깔끔하게 구현할 수 있습니다.

```java
// 이벤트 발행
@Transactional
public void processOrder(OrderDTO order) {
    orderMapper.insert(order);
    orderMapper.updateStatus(order.getId(), "COMPLETED");
    applicationEventPublisher.publishEvent(new OrderCompletedEvent(order));
}

// 커밋 후 이벤트 처리
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void onOrderCompleted(OrderCompletedEvent event) {
    mailService.dispatch(event.getOrder().toParam());
}
```

### 어떤 방법을 선택할 것인가

| 비교 | REQUIRES_NEW | NESTED (SAVEPOINT) | 트랜잭션 밖 실행 |
|------|-------------|-------------------|---------------|
| 트랜잭션 수 | 2개 | 1개 | 1개 |
| DB 커넥션 | 2개 | 1개 | 1개 |
| 메인 롤백 시 서브 | 커밋 유지 | 함께 롤백 | 커밋 유지 |
| MyBatis 지원 | **완전 지원** | 제한적 | 완전 지원 |
| 서브 로직에서 DB 필요 | **가능** | 가능 | 가능 |
| 적용 난이도 | 별도 Bean 분리 필요 | 간단 | 호출 구조 변경 필요 |
| 적합한 상황 | **실패 가능 쿼리 격리** | JPA 환경 부분 롤백 | 알림, 로깅 등 후처리 |

실무에서 REQUIRES_NEW를 선택한 이유는 소거법이었습니다.

**NESTED(SAVEPOINT)를 배제한 이유** — 프로젝트가 MyBatis 기반이라 NESTED 전파 옵션의 지원이 제한적이었습니다. JPA/Hibernate 환경이 아니었기 때문에 SAVEPOINT 자동 관리를 기대할 수 없었습니다.

**트랜잭션 밖 실행을 배제한 이유** — 메일 발송 로직 내부에서 수신자 SELECT 쿼리가 필요했습니다. 트랜잭션 밖으로 빼면 커넥션 관리가 복잡해지고, 기존 Controller/Service 호출 흐름을 재설계해야 하는 범위가 REQUIRES_NEW보다 컸습니다. `@TransactionalEventListener`는 이벤트 발행/구독 구조를 새로 도입해야 해서 변경 범위가 과대했습니다.

**REQUIRES_NEW를 선택한 이유** — 별도 Bean 분리만 하면 기존 Service 메서드의 호출 구조를 크게 바꾸지 않고 적용할 수 있었습니다. 메일 발송 서비스가 이미 독립적인 책임을 가지고 있어서 Bean 분리가 자연스러운 설계였고, 메일 발송이 빈번하지 않아 커넥션 2개 사용에 따른 풀 고갈 위험도 낮았습니다.

---

## 트랜잭션 abort를 유발하는 다른 시나리오

위에서 다룬 SQL 에러 외에도 트랜잭션이 abort되거나 롤백되는 시나리오는 여러 가지가 있습니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/spring-transactional-postgresql-abort/abort-scenarios-light.png" alt="트랜잭션 abort 유발 시나리오 분류" />
      <img className="theme-dark" src="/images/posts/spring-transactional-postgresql-abort/abort-scenarios-dark.png" alt="트랜잭션 abort 유발 시나리오 분류" />
    </div>
  </div>
  <figcaption>트랜잭션 abort/rollback은 PostgreSQL 레벨과 Spring 레벨 양쪽에서 발생할 수 있다</figcaption>
</figure>

### PostgreSQL 레벨

**제약 조건 위반** — UNIQUE, FK, CHECK, NOT NULL 제약 조건 위반은 SQL 에러와 동일하게 트랜잭션을 abort시킵니다.

```java
@Transactional
public void createUser(UserDTO user) {
    userMapper.insert(user);        // UNIQUE 제약 위반 → abort
    auditMapper.insertLog(user);    // 실행 불가
}
```

**직렬화 실패** — `SERIALIZABLE` 격리 수준에서 동시에 같은 데이터를 수정하면 PostgreSQL이 한쪽 트랜잭션을 abort합니다.

**데드락 감지** — 두 트랜잭션이 교차로 lock을 잡으면 PostgreSQL이 데드락을 감지하고 한쪽을 강제 abort합니다.

**타임아웃** — `statement_timeout` 설정에 의해 쿼리가 시간 초과되면 해당 쿼리 취소와 함께 트랜잭션이 abort됩니다.

### Spring 레벨

**<Term id="rollback-only">rollback-only</Term> 마킹** — PostgreSQL abort와는 별개로, Spring 프레임워크 레벨에서 발생하는 롤백입니다.

```java
@Service
public class OuterService {
    @Autowired private InnerService innerService;

    @Transactional
    public void outerMethod() {
        try {
            innerService.innerMethod();  // RuntimeException → rollback-only 마킹
        } catch (Exception e) {
            log.warn("잡았으니 계속...");
        }
        // COMMIT 시도 → UnexpectedRollbackException 발생
    }
}

@Service
public class InnerService {
    @Transactional  // 기본 REQUIRED → 같은 트랜잭션 참여
    public void innerMethod() {
        throw new RuntimeException("실패!");
    }
}
```

`innerMethod()`가 `RuntimeException`을 던지면 Spring의 `TransactionInterceptor`가 현재 트랜잭션에 rollback-only 플래그를 설정합니다.
외부에서 catch해도 이미 마킹된 플래그는 되돌릴 수 없으며, 커밋 시점에 `UnexpectedRollbackException`이 발생합니다.

<div className="info-box">
  <strong>PostgreSQL abort vs Spring rollback-only</strong><br/><br/>
  PostgreSQL abort는 <strong>DB 서버</strong>가 트랜잭션을 무효화하는 것이고,
  rollback-only는 <strong>Spring 프레임워크</strong>가 트랜잭션을 무효화하는 것입니다.
  원인은 다르지만 결과는 동일합니다 — <code>try-catch</code>로 복구할 수 없는 롤백이 발생합니다.
</div>

**기본 롤백 규칙** — Spring `@Transactional`은 기본적으로 `RuntimeException`(unchecked)에 대해 롤백하고, `Exception`(checked)에 대해서는 커밋합니다. 이 규칙을 인지하지 못하면 의도치 않은 롤백이 발생할 수 있습니다.

```java
// RuntimeException → 자동 롤백
@Transactional
public void process() {
    throw new CustomBusinessException("비즈니스 규칙 위반");
}

// 특정 예외에 대해 롤백하지 않으려면
@Transactional(noRollbackFor = CustomBusinessException.class)
public void process() {
    throw new CustomBusinessException("비즈니스 규칙 위반");
}
```

---

## 자가 진단 체크리스트

`@Transactional` 메서드를 작성할 때 다음 항목을 확인하면 silent rollback을 예방할 수 있습니다.

<div className="warning-box">
  <strong>@Transactional 안전 체크리스트</strong><br/><br/>
  <strong>1. try-catch 안에 DB 쿼리가 있는가?</strong><br/>
  → PostgreSQL에서는 catch해도 트랜잭션이 abort될 수 있습니다.<br/><br/>
  <strong>2. 메인 로직과 부가 로직이 같은 트랜잭션인가?</strong><br/>
  → 부가 로직(메일, 알림, 로깅) 실패가 메인 로직을 롤백시킬 수 있습니다.<br/><br/>
  <strong>3. 같은 클래스 내 메서드에 @Transactional을 붙였는가?</strong><br/>
  → AOP 프록시를 타지 않으므로 전파 옵션이 무효입니다. 별도 Bean으로 분리해야 합니다.<br/><br/>
  <strong>4. REQUIRES_NEW 사용 시 같은 테이블에 접근하는가?</strong><br/>
  → 외부 트랜잭션이 잡은 row에 접근하면 데드락 위험이 있습니다.<br/><br/>
  <strong>5. 내부 @Transactional 메서드의 예외를 외부에서 catch하고 있는가?</strong><br/>
  → rollback-only 마킹으로 인해 커밋 시점에 <code>UnexpectedRollbackException</code>이 발생할 수 있습니다.
</div>

---

## 정리

| 구분 | 내용 |
|------|------|
| **PostgreSQL 특성** | 트랜잭션 내 SQL 에러 → 전체 abort → COMMIT 시 자동 ROLLBACK |
| **MySQL과의 차이** | MySQL은 에러 쿼리만 실패하고 트랜잭션 유지, PostgreSQL은 전체 abort |
| **try-catch 한계** | Java 예외만 처리, DB 트랜잭션 상태는 복구 불가 |
| **REQUIRES_NEW** | 별도 Bean + 별도 트랜잭션으로 격리 (MyBatis 호환, 커넥션 2개) |
| **NESTED** | SAVEPOINT 기반 부분 롤백 (커넥션 1개, MyBatis 제한적) |
| **트랜잭션 후 실행** | `@TransactionalEventListener(AFTER_COMMIT)` 활용 |
| **Spring rollback-only** | 내부 @Transactional 예외 시 마킹, catch해도 커밋 불가 |
