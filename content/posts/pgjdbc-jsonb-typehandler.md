---
title: "pgjdbc 42.7.11 JSONB 반환 타입 변경과 TypeHandler 대응"
date: "2026-05-06"
description: "pgjdbc 42.7.11에서 JSONB 컬럼의 반환 타입이 String에서 PGobject로 변경되었습니다. MyBatis 커스텀 TypeHandler를 글로벌 등록하여 기존 코드 변경 없이 호환성을 유지하는 방법을 정리합니다."
category: "개발"
subcategory: "Java"
tags: ["guide", "intermediate"]
thumbnail: "/images/thumbnails/java"
glossary:
  - id: "pgobject"
    term: "PGobject"
    brief: "PostgreSQL 비표준 타입을 Java에서 표현하는 pgjdbc 클래스"
    detail: "pgjdbc가 json, jsonb, inet, cidr 등 JDBC 표준에 정의되지 않은 PostgreSQL 타입을 Java 객체로 표현하기 위해 사용하는 래퍼 클래스이다. type 필드에 PostgreSQL 타입명, value 필드에 문자열 값을 담고 있으며, getValue()로 원본 문자열을 꺼낼 수 있다."
  - id: "typehandler"
    term: "TypeHandler"
    brief: "MyBatis에서 Java 타입과 JDBC 타입 간 변환을 담당하는 인터페이스"
    detail: "PreparedStatement에 파라미터를 설정하거나 ResultSet에서 값을 꺼낼 때 호출된다. BaseTypeHandler<T>를 상속하여 커스텀 변환 로직을 구현할 수 있으며, javaType과 jdbcType 조합으로 TypeHandlerRegistry에 등록된다."
  - id: "typeinfocache"
    term: "TypeInfoCache"
    brief: "pgjdbc가 PostgreSQL 타입과 Java 클래스 간 매핑을 캐싱하는 내부 클래스"
    detail: "PostgreSQL 타입명(json, jsonb 등)을 Java 클래스(PGobject, String 등)에 매핑하는 정보를 보관한다. 42.7.11 이전에는 jsonb가 이 캐시에 미등록 상태여서 String으로 반환되었으나, 42.7.11에서 등록이 추가되면서 PGobject로 반환되도록 변경되었다."
  - id: "typehandlerregistry"
    term: "TypeHandlerRegistry"
    brief: "MyBatis가 모든 TypeHandler를 (javaType, jdbcType) 쌍으로 관리하는 저장소"
    detail: "내부에 typeHandlerMap(메인 경로)과 jdbcTypeHandlerMap(폴백 경로) 두 저장소가 있다. ResultSet에서 값을 꺼낼 때 (javaType, jdbcType) 조합으로 메인 경로를 먼저 조회하고, javaType이 null인 경우에만 폴백 경로를 조회한다."
  - id: "jdbctype-other"
    term: "JdbcType.OTHER"
    brief: "JDBC 표준에 정의되지 않은 타입을 나타내는 범용 분류"
    detail: "PostgreSQL의 json, jsonb, inet, cidr 등 JDBC 표준(java.sql.Types)에 포함되지 않는 데이터베이스 고유 타입이 이 분류에 해당한다. MyBatis TypeHandler에서 @MappedJdbcTypes(JdbcType.OTHER)로 지정하면 이러한 비표준 타입의 변환을 처리할 수 있다."
---

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/thumbnails/java-light.png" alt="Java" />
      <img className="theme-dark" src="/images/thumbnails/java-dark.png" alt="Java" />
    </div>
  </div>
</figure>

Java에서 PostgreSQL에 접속할 때는 **pgjdbc**라는 JDBC 드라이버를 사용합니다.
Java 25 마이그레이션을 준비하면서 이 드라이버를 최신 버전인 42.7.11로 업그레이드했는데, 기존에 잘 동작하던 JSONB 관련 테스트가 일제히 실패하기 시작했습니다.

원인은 pgjdbc 내부의 타입 매핑 변경이었습니다.
`jsonb` 타입이 `String`이 아닌 `PGobject`라는 래퍼 객체로 반환되도록 수정된 것입니다.

이 글에서는 변경의 배경, 영향 범위, 그리고 MyBatis TypeHandler를 활용한 대응 방법을 정리합니다.
TypeHandler의 내부 동작 원리까지 함께 다루므로, 유사한 JDBC 타입 변환 문제를 만났을 때 응용할 수 있습니다.

---

## 변경 요약

| 항목 | 42.7.10 이하 | 42.7.11 이후 |
|------|------------|-------------|
| JSONB `rs.getObject()` 반환 타입 | `String` | `PGobject` |
| JSON `rs.getObject()` 반환 타입 | `PGobject` | `PGobject` (변경 없음) |
| MyBatis Map 바인딩 시 JSONB 값 | `String` | `PGobject` |
| 원인 | <Term id="typeinfocache">TypeInfoCache</Term>에 jsonb 미등록 | jsonb 타입 등록 추가 |

`json` 타입은 이전부터 `PGobject`로 반환되고 있었지만, `jsonb`는 pgjdbc 내부 매핑 테이블에 등록이 누락되어 있어 `String`으로 반환되고 있었습니다.
42.7.11에서 이 누락이 버그로 분류되어 수정되었습니다.

---

## 배경

pgjdbc는 PostgreSQL의 각 데이터 타입을 어떤 Java 클래스로 변환할지 <Term id="typeinfocache">TypeInfoCache</Term>라는 내부 매핑 테이블에서 관리합니다.
`json` 타입은 이 테이블에 <Term id="pgobject">PGobject</Term>로 등록되어 있었지만, `jsonb`는 누락되어 있었습니다.

등록되지 않은 타입은 기본적으로 `String`으로 반환되므로, `jsonb` 컬럼을 조회하면 JSON 문자열이 그대로 `String`으로 돌아왔습니다.
42.7.11에서 아래 한 줄이 추가되면서, `jsonb`도 `json`과 동일하게 `PGobject`로 반환되도록 변경되었습니다.

```java
// pgjdbc TypeInfoCache.java에 추가된 한 줄
{"jsonb", Oid.JSONB, Types.OTHER, "org.postgresql.util.PGobject", Oid.JSONB_ARRAY},
```

<div className="info-box">
  <strong>참고</strong><br/><br/>
  <a href="https://github.com/pgjdbc/pgjdbc/pull/3956">pgjdbc PR #3956</a> — 버그 수정으로 머지된 PR이므로, 이후 버전에서도 PGobject 반환이 유지될 것으로 판단됩니다.
</div>

---

## 영향 범위

MyBatis에서 JSONB 컬럼을 조회하는 코드 중, 반환값을 `String`으로 직접 캐스팅하는 모든 곳에서 `ClassCastException`이 발생합니다.

```java
// 42.7.10 이하: String으로 반환 → 문제 없음
Map<String, Object> result = mapper.selectSetting();
String setting = (String) result.get("setting"); // ✅ 정상

// 42.7.11: PGobject로 반환 → ClassCastException
String setting = (String) result.get("setting"); // ❌ ClassCastException
```

특히 `resultType="map"`을 사용하는 쿼리가 가장 많이 영향을 받습니다.
`Map`의 value 타입은 `Object`이므로, pgjdbc가 반환하는 값이 그대로 들어가기 때문입니다.

---

## 대응 방안 비교

세 가지 방안을 검토했고, 최종적으로 **TypeHandler 글로벌 등록**을 채택했습니다.

| | 방안 1: 서비스 코드 수정 | 방안 2: Interceptor | 방안 3: TypeHandler (채택) |
|------|:---:|:---:|:---:|
| 기존 코드 수정 | 모든 JSONB 사용처 | 불필요 | 불필요 |
| 성능 오버헤드 | 없음 | 결과 순회 비용 | 없음 |
| 적용 시점 | 결과 사용 시 | 결과 반환 후 | ResultSet 조회 시 |
| 누락 위험 | 높음 (수동 수정) | 낮음 | 없음 (글로벌) |

### 방안 1: 서비스 코드에서 PGobject 직접 처리

```java
Object value = result.get("setting");
String setting = (value instanceof PGobject pg) ? pg.getValue() : (String) value;
```

JSONB를 사용하는 모든 코드를 찾아 수정해야 합니다. 수정 누락 시 런타임에서 `ClassCastException`이 발생하므로 위험합니다.

### 방안 2: MyBatis Interceptor에서 후처리

```java
@Intercepts(@Signature(type = ResultSetHandler.class, method = "handleResultSets", ...))
public class PGobjectInterceptor implements Interceptor {
    // ResultSet 처리 후 PGobject를 String으로 변환
}
```

MyBatis가 결과를 반환한 뒤 전체 결과를 한 번 더 순회하며 변환해야 하므로, 대량 데이터 조회 시 오버헤드가 발생합니다.

### 방안 3: MyBatis TypeHandler 글로벌 등록 (채택)

```java
@MappedJdbcTypes(JdbcType.OTHER)
public class PGobjectUnwrapTypeHandler extends BaseTypeHandler<Object> {

    private Object unwrap(Object value) {
        if (value instanceof PGobject pg) {
            return pg.getValue();
        }
        return value;
    }
}
```

ResultSet에서 값을 꺼내는 시점, 즉 **가장 이른 시점**에 변환하므로 오버헤드가 없습니다.
한 번 글로벌 등록하면 기존 코드를 전혀 수정하지 않아도 모든 쿼리에 자동 적용됩니다.

<div className="info-box">
  <strong>왜 TypeHandler가 최선인가</strong><br/><br/>
  방안 1은 수정 범위가 넓고 누락 위험이 높습니다. 방안 2는 결과 순회 비용이 발생합니다.<br/>
  <Term id="typehandler">TypeHandler</Term>는 ResultSet에서 값을 꺼내는 시점에 변환하므로, 추가 비용 없이 모든 쿼리에 일괄 적용할 수 있습니다.
</div>

---

## MyBatis TypeHandler 동작 원리

TypeHandler를 올바르게 등록하려면 MyBatis 내부에서 TypeHandler가 어떻게 선택되는지 이해해야 합니다.
이 섹션에서는 TypeHandler의 역할, 등록 구조, 조회 순서를 순서대로 살펴봅니다.

### TypeHandler의 역할

MyBatis는 Java 코드와 데이터베이스 사이에서 타입을 변환할 때 TypeHandler를 사용합니다.
INSERT/UPDATE 시에는 Java 값을 JDBC 타입으로 변환하고, SELECT 시에는 JDBC 결과를 Java 타입으로 변환합니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/pgjdbc-jsonb-typehandler/typehandler-role-light.png" alt="TypeHandler의 역할 - Java 타입과 JDBC 타입 간 양방향 변환" />
      <img className="theme-dark" src="/images/posts/pgjdbc-jsonb-typehandler/typehandler-role-dark.png" alt="TypeHandler의 역할 - Java 타입과 JDBC 타입 간 양방향 변환" />
    </div>
  </div>
  <figcaption>TypeHandler는 Java 타입과 JDBC 타입 간 양방향 변환을 담당합니다</figcaption>
</figure>

### 기본 내장 TypeHandler

MyBatis는 자주 사용하는 타입에 대해 기본 TypeHandler를 제공합니다.

| Java 타입 | JDBC 타입 | TypeHandler |
|----------|----------|-------------|
| `String` | `VARCHAR` | `StringTypeHandler` |
| `Integer` | `INTEGER` | `IntegerTypeHandler` |
| `Boolean` | `BOOLEAN` | `BooleanTypeHandler` |
| `Object` | `OTHER` | `ObjectTypeHandler` (기본) |

<Term id="jdbctype-other">JdbcType.OTHER</Term>는 JDBC 표준에 정의되지 않은 타입에 대한 범용 분류입니다.
PostgreSQL의 `json`, `jsonb`, `inet`, `cidr` 등 데이터베이스 고유 타입이 여기에 해당합니다.

기본 `ObjectTypeHandler`는 `rs.getObject()`의 반환값을 **그대로 전달**합니다.
pgjdbc 42.7.11에서는 이 반환값이 `PGobject`이므로, 기본 핸들러로는 `String` 변환이 이루어지지 않습니다.

### 커스텀 TypeHandler 작성

`BaseTypeHandler<T>`를 상속하여 4개의 추상 메서드를 구현합니다.

| 메서드 | 방향 | 호출 시점 |
|--------|------|----------|
| `setNonNullParameter` | Java → DB | INSERT/UPDATE의 `#{param}` 바인딩 |
| `getNullableResult(rs, columnName)` | DB → Java | SELECT 결과를 컬럼명으로 조회 (가장 자주 호출) |
| `getNullableResult(rs, columnIndex)` | DB → Java | SELECT 결과를 인덱스로 조회 |
| `getNullableResult(cs, columnIndex)` | DB → Java | 저장 프로시저 결과 조회 |

이 글에서 만드는 TypeHandler는 SELECT 방향(`getNullableResult`)에서 `PGobject`를 `String`으로 풀어주는 역할을 합니다.

---

## TypeHandler 등록 — 메인 경로 vs 폴백 경로

TypeHandler를 만들었다면 MyBatis에 등록해야 합니다.
이때 **등록 방식에 따라 TypeHandler가 저장되는 위치가 달라지며**, 이것이 실제로 TypeHandler가 호출되는지 여부를 결정합니다.

### 두 가지 저장소

TypeHandler 등록에는 **javaType**과 **jdbcType** 두 가지 키가 관여합니다.
등록 방식에 따라 <Term id="typehandlerregistry">TypeHandlerRegistry</Term> 내부의 서로 다른 저장소에 저장됩니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/pgjdbc-jsonb-typehandler/typehandler-registry-light.png" alt="TypeHandlerRegistry 내부 구조 - 메인 경로와 폴백 경로" />
      <img className="theme-dark" src="/images/posts/pgjdbc-jsonb-typehandler/typehandler-registry-dark.png" alt="TypeHandlerRegistry 내부 구조 - 메인 경로와 폴백 경로" />
    </div>
  </div>
  <figcaption>TypeHandlerRegistry는 메인 경로와 폴백 경로, 두 저장소를 갖습니다</figcaption>
</figure>

- **메인 경로 (`typeHandlerMap`)**: (javaType, jdbcType) 쌍을 키로 사용합니다. MyBatis가 가장 먼저 조회하는 경로입니다.
- **폴백 경로 (`jdbcTypeHandlerMap`)**: jdbcType만 키로 사용합니다. javaType을 알 수 없는 극히 예외적인 상황에서만 조회됩니다.

```java
// 메인 경로에 등록 — javaType과 jdbcType을 모두 지정
register(Object.class, JdbcType.OTHER, handler);

// 폴백 경로에 등록 — jdbcType만 지정
register(JdbcType.OTHER, handler);
```

### TypeHandler 조회 순서

MyBatis가 ResultSet에서 값을 꺼낼 때 어떤 TypeHandler를 사용할지 결정하는 과정입니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/pgjdbc-jsonb-typehandler/typehandler-lookup-flow-light.png" alt="TypeHandler 조회 순서 플로우차트" />
      <img className="theme-dark" src="/images/posts/pgjdbc-jsonb-typehandler/typehandler-lookup-flow-dark.png" alt="TypeHandler 조회 순서 플로우차트" />
    </div>
  </div>
  <figcaption>javaType이 결정된 상태에서는 폴백 경로에 도달하지 않습니다</figcaption>
</figure>

**핵심은 Step 3**입니다.
MyBatis는 대부분의 경우 javaType을 알고 있습니다.
`resultType="map"`이면 `Object.class`, DTO의 `String` 필드면 `String.class`로 결정됩니다.
javaType이 결정된 상태에서는 **폴백 경로를 조회하지 않고 기본 핸들러를 사용**합니다.

### 왜 폴백 경로 등록은 동작하지 않는가

`resultType="map"`으로 jsonb 컬럼을 조회하는 상황을 예로 들어보겠습니다.
이때 MyBatis가 결정하는 값은 다음과 같습니다.

```java
// javaType = Object.class (Map<String, Object>의 value 타입)
// jdbcType = JdbcType.OTHER (PostgreSQL jsonb)
```

**폴백 경로에만 등록한 경우** — TypeHandler가 호출되지 않습니다:

```text
Step 2: typeHandlerMap에서 (Object.class, OTHER) 조회 → 등록된 핸들러 없음
Step 3: javaType이 null인가? → Object.class이므로 null 아님 → 폴백 경로 스킵
결과: 기본 ObjectTypeHandler 사용 → PGobject가 그대로 Map에 들어감 ❌
```

**메인 경로에 등록한 경우** — TypeHandler가 정상 호출됩니다:

```text
Step 2: typeHandlerMap에서 (Object.class, OTHER) 조회 → PGobjectUnwrapTypeHandler 발견 ✅
결과: PGobject → String 변환 완료
```

<div className="warning-box">
  <strong>반드시 메인 경로에 등록해야 합니다</strong><br/><br/>
  <code>register(JdbcType.OTHER, handler)</code>는 폴백 경로에만 저장됩니다.<br/>
  <code>resultType="map"</code>에서 javaType은 <code>Object.class</code>로 이미 결정되어 있으므로, 폴백 경로에는 도달하지 못합니다.<br/>
  반드시 <code>register(Object.class, JdbcType.OTHER, handler)</code>로 메인 경로에 등록해야 합니다.
</div>

---

## 구현

위에서 설명한 내용을 바탕으로 실제 코드를 작성합니다.

### TypeHandler 클래스

`getNullableResult` 메서드에서 반환값이 `PGobject`인 경우 `getValue()`로 문자열을 꺼내고, 그 외에는 원래 값을 그대로 반환합니다.

```java
@Slf4j
@MappedJdbcTypes(JdbcType.OTHER)
public class PGobjectUnwrapTypeHandler extends BaseTypeHandler<Object> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i,
                                     Object parameter, JdbcType jdbcType) throws SQLException {
        ps.setObject(i, parameter);
    }

    @Override
    public Object getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return unwrap(rs.getObject(columnName));
    }

    @Override
    public Object getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return unwrap(rs.getObject(columnIndex));
    }

    @Override
    public Object getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return unwrap(cs.getObject(columnIndex));
    }

    private Object unwrap(Object value) {
        if (value instanceof PGobject pg) {
            log.debug("PGobject unwrap: type={}", pg.getType());
            return pg.getValue();
        }
        return value;
    }
}
```

### 글로벌 등록

Spring Boot의 `ConfigurationCustomizer`를 사용하여 MyBatis 설정에 TypeHandler를 등록합니다.
앞서 설명한 대로 **메인 경로에 등록**하기 위해 `Object.class`와 `JdbcType.OTHER`를 함께 지정합니다.

```java
@Configuration
public class MyBatisConfig {

    @Bean
    public ConfigurationCustomizer pgobjectTypeHandlerCustomizer() {
        return configuration -> {
            PGobjectUnwrapTypeHandler handler = new PGobjectUnwrapTypeHandler();
            configuration.getTypeHandlerRegistry().register(Object.class, JdbcType.OTHER, handler);
        };
    }
}
```

---

## 동작 흐름

등록이 완료된 후, JSONB 컬럼이 조회되면 다음과 같은 흐름으로 변환이 이루어집니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/pgjdbc-jsonb-typehandler/pgjdbc-jsonb-overview-light.png" alt="pgjdbc JSONB TypeHandler 전체 흐름 요약" />
      <img className="theme-dark" src="/images/posts/pgjdbc-jsonb-typehandler/pgjdbc-jsonb-overview-dark.png" alt="pgjdbc JSONB TypeHandler 전체 흐름 요약" />
    </div>
  </div>
  <figcaption>DB에서 JSONB 값이 TypeHandler를 거쳐 String으로 변환되는 전체 흐름</figcaption>
</figure>

각 단계를 좀 더 구체적으로 보면 다음과 같습니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/pgjdbc-jsonb-typehandler/typehandler-flow-light.png" alt="TypeHandler 동작 흐름 상세 - DB에서 MyBatis 결과까지" />
      <img className="theme-dark" src="/images/posts/pgjdbc-jsonb-typehandler/typehandler-flow-dark.png" alt="TypeHandler 동작 흐름 상세 - DB에서 MyBatis 결과까지" />
    </div>
  </div>
  <figcaption>pgjdbc가 PGobject를 반환하면, TypeHandler가 getValue()로 String을 꺼내 MyBatis에 전달합니다</figcaption>
</figure>

1. PostgreSQL이 JSONB 컬럼 값을 반환합니다.
2. pgjdbc 42.7.11이 이 값을 `PGobject` 객체로 래핑하여 `rs.getObject()`에 반환합니다.
3. MyBatis가 `(Object.class, JdbcType.OTHER)` 조합으로 TypeHandler를 조회하여 `PGobjectUnwrapTypeHandler`를 찾습니다.
4. `unwrap()` 메서드가 `PGobject.getValue()`를 호출하여 원본 JSON 문자열을 꺼냅니다.
5. 꺼낸 `String` 값이 `Map<String, Object>` 또는 DTO 필드에 바인딩됩니다.

---

## resultType별 적용 범위

TypeHandler가 적용되는 범위는 MyBatis의 `resultType` 설정과 DTO 필드 타입에 따라 달라집니다.

| resultType | 필드 타입 | 사용되는 TypeHandler | TypeHandler 적용 |
|-----------|----------|---------------------|:----------------:|
| `map` / `HashMap` | `Object` | **PGobjectUnwrapTypeHandler** | ✅ 자동 |
| DTO | `Object` | **PGobjectUnwrapTypeHandler** | ✅ 자동 |
| DTO | `String` | `StringTypeHandler` | — (원래부터 안전) |
| `resultMap` + typeHandler 지정 | 명시적 지정 | 지정된 핸들러 | ✅ 수동 |

글로벌 등록이므로 `resultMap`에 개별 `typeHandler`를 지정할 필요가 없습니다.

### DTO 필드 타입에 따른 안전성

```java
// ✅ String 필드 → StringTypeHandler가 rs.getString()을 호출 → 항상 String 반환
public class SomeDTO {
    private String settingValue;
}

// ⚠️ Object 필드 → PGobjectUnwrapTypeHandler가 처리
public class SomeDTO {
    private Object settingValue;
}
```

DTO 필드를 `String`으로 선언하면 MyBatis는 `StringTypeHandler`를 사용합니다.
`StringTypeHandler`는 내부에서 `rs.getString()`을 호출하므로, pgjdbc가 `PGobject`를 반환하더라도 JDBC 드라이버 레벨에서 문자열로 변환됩니다.
즉 **DTO 필드가 `String`이면 이 문제 자체가 발생하지 않습니다**.

이 TypeHandler가 필요한 경우는 `Map` resultType이거나 DTO 필드가 `Object`인 경우입니다.

---

## SQL 연산자에 따른 차이

PostgreSQL의 JSON 연산자에 따라서도 영향 여부가 달라집니다.

```sql
-- ->> : text로 반환 → TypeHandler 관여 없음 (항상 안전)
SELECT setting -> 'kerberos' ->> 'realm' AS realm

-- -> : jsonb로 반환 → Map resultType에서 PGobject 가능 → TypeHandler가 처리
SELECT setting -> 'kerberos' AS kerberos_config
```

| 연산자 | 반환 타입 | TypeHandler 필요 |
|--------|----------|:----------------:|
| `->>` | `text` (String) | 불필요 |
| `->` | `jsonb` (PGobject) | ✅ 필요 |

`->>`는 결과를 text로 반환하므로 어떤 상황에서든 `String`으로 안전하게 처리됩니다.
`->`는 결과가 jsonb 타입으로 남아 있어, `Map` resultType에서 `PGobject`가 들어올 수 있습니다.

---

## 주의사항

<div className="warning-box">
  <strong>JdbcType.OTHER 공유 범위</strong><br/><br/>
  이 TypeHandler는 <code>JdbcType.OTHER</code>에 매핑되므로, jsonb 외에도 <code>inet</code>, <code>cidr</code> 등 PostgreSQL 비표준 타입에도 적용됩니다.
  단, <code>unwrap()</code> 메서드는 <code>PGobject</code> 인스턴스만 변환하고 나머지는 그대로 통과시키므로, 다른 타입에 부작용을 일으키지 않습니다.
</div>

<div className="info-box">
  <strong>롤백 호환성</strong><br/><br/>
  pgjdbc를 42.7.11 미만으로 롤백하더라도 TypeHandler는 정상 동작합니다.
  이전 버전에서 JSONB는 <code>String</code>으로 반환되므로 <code>instanceof PGobject</code> 조건에 해당하지 않고, 값이 그대로 통과합니다.
</div>

---

## 핵심 요약

1. pgjdbc 42.7.11에서 JSONB 반환 타입이 `String` → `PGobject`로 변경되었습니다 (버그 수정, 영구 적용).
2. 기존 코드를 수정하지 않고 MyBatis TypeHandler 글로벌 등록으로 대응할 수 있습니다.
3. 등록 시 반드시 `register(Object.class, JdbcType.OTHER, handler)`로 **메인 경로**에 등록해야 합니다. jdbcType만 지정하면 폴백 경로에 저장되어 대부분의 상황에서 호출되지 않습니다.
4. DTO 필드가 `String`이면 `StringTypeHandler`가 처리하므로, 이 문제의 영향을 받지 않습니다.
5. pgjdbc를 다시 다운그레이드하더라도 TypeHandler는 그대로 호환됩니다.
