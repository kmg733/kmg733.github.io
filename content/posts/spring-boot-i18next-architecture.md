---
title: "Spring Boot에서 i18next로 다국어 구현하기 - localStorage SWR 캐싱 아키텍처"
date: "2026-02-27"
description: "Spring Boot + Thymeleaf 환경에서 i18next와 localStorage SWR 캐싱을 결합한 서버-클라이언트 하이브리드 다국어 아키텍처를 설계합니다. 기존 jquery.i18n.properties.js의 한계를 극복하고, 캐시 히트 시 네트워크 요청 0회를 달성하는 구조를 다룹니다."
category: "개발"
subcategory: "Spring Boot"
tags: ["guide", "intermediate"]
glossary:
  - id: "swr"
    term: "SWR(Stale-While-Revalidate)"
    brief: "캐시된 데이터를 먼저 사용하고, 백그라운드에서 최신 데이터를 가져오는 캐시 전략"
    detail: "HTTP Cache-Control 확장 디렉티브에서 유래한 개념이다. 사용자에게 즉각적인 응답을 제공하면서, 동시에 데이터의 최신성을 보장한다. React의 SWR 라이브러리도 이 개념에서 이름을 따왔다."
  - id: "i18next"
    term: "i18next"
    brief: "JavaScript 기반 국제화(i18n) 프레임워크"
    detail: "프레임워크에 독립적인 다국어 라이브러리이다. npm 주간 다운로드 400만 이상의 활발한 생태계를 보유하며, interpolation, fallback, 네임스페이스 등 풍부한 기능을 제공한다."
  - id: "message-source"
    term: "MessageSource"
    brief: "Spring의 메시지 국제화 인터페이스"
    detail: "Spring Framework에서 다국어 메시지를 관리하는 핵심 인터페이스이다. ReloadableResourceBundleMessageSource 구현체를 사용하면 .properties 파일 기반으로 메시지를 로드하고 locale에 따라 적절한 메시지를 반환한다."
---

Spring Boot + Thymeleaf 환경에서 다국어를 지원하려면 서버 렌더링과 클라이언트 JavaScript 양쪽에서 번역 메시지를 사용할 수 있어야 합니다.
이 글에서는 서버 사이드의 <Term id="message-source">MessageSource</Term>와 클라이언트 사이드의 <Term id="i18next">i18next</Term>를 결합하고,
localStorage 기반 <Term id="swr">SWR 캐싱</Term>으로 네트워크 요청을 최소화하는 하이브리드 다국어 아키텍처를 소개합니다.

---

## 기존 방식의 한계

레거시 프로젝트에서 자주 사용하는 `jquery.i18n.properties.js` 플러그인에는 다음과 같은 문제가 있습니다.

| 문제 | 설명 |
|------|------|
| **추가 HTTP 요청** | 페이지마다 `.properties` 파일을 별도로 fetch |
| **파싱 오버헤드** | 브라우저에서 properties 형식을 직접 파싱 |
| **전체 메시지 노출** | 서버 내부용 메시지까지 클라이언트에 노출 |
| **jQuery 의존** | jQuery 없이 사용 불가 |
| **유지보수 중단** | 활발한 업데이트가 없는 레거시 라이브러리 |

이러한 한계를 해결하기 위해, 프레임워크에 독립적이고 활발하게 유지보수되는 i18next를 선택했습니다.
i18next는 내장 interpolation, fallback 체계, 경량 코어(약 40KB minified) 등의 장점을 제공합니다.

---

## 아키텍처 개요

### Before vs After

| 항목 | Before (레거시) | After (i18next + SWR) |
|------|----------------|----------------------|
| **서버 렌더링** | `#{key}` (MessageSource 직접) | `#{key}` (동일) |
| **JS 다국어** | `jquery.i18n.properties.js` | i18next 라이브러리 |
| **메시지 로딩** | `.properties` 파일 직접 파싱 | localStorage SWR 캐싱 + REST API fallback |
| **네트워크 요청** | 페이지마다 `.properties` 파일 fetch | 캐시 히트 시 0회, Cold start 시 1회 (비동기) |
| **보안** | 전체 메시지 노출 | 블랙리스트 prefix 필터링 (`_server.` 차단) |
| **캐시 전략** | 없음 | SHA-256 해시 비교 기반 localStorage SWR |

### 전체 흐름

아래 다이어그램은 서버 시작부터 브라우저의 i18next 초기화까지 전체 흐름을 보여줍니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/spring-boot-i18next-architecture/architecture-flow-light.svg" alt="전체 아키텍처 흐름 - 서버 시작, Thymeleaf 렌더링, localStorage SWR 캐싱 분기" />
      <img className="theme-dark" src="/images/posts/spring-boot-i18next-architecture/architecture-flow-dark.svg" alt="전체 아키텍처 흐름 - 서버 시작, Thymeleaf 렌더링, localStorage SWR 캐싱 분기" />
    </div>
    <figcaption>그림 1. 서버 시작 → Thymeleaf 렌더링 → i18n-init.js SWR 캐싱 분기까지의 전체 흐름</figcaption>
  </div>
</figure>

핵심 아이디어는 **서버에서 해시값만 HTML에 주입**하고, 클라이언트에서 localStorage 캐시의 해시와 비교하여 네트워크 요청 여부를 결정하는 것입니다.

---

## 컴포넌트 구조

아키텍처를 구성하는 주요 컴포넌트와 그 관계를 먼저 살펴보겠습니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/spring-boot-i18next-architecture/component-structure-light.svg" alt="컴포넌트 구조 - MessageConfig, I18nMessageProvider, I18nRestController, Thymeleaf, i18n-init.js 간의 관계" />
      <img className="theme-dark" src="/images/posts/spring-boot-i18next-architecture/component-structure-dark.svg" alt="컴포넌트 구조 - MessageConfig, I18nMessageProvider, I18nRestController, Thymeleaf, i18n-init.js 간의 관계" />
    </div>
    <figcaption>그림 2. 서버와 클라이언트 컴포넌트 간의 의존 관계</figcaption>
  </div>
</figure>

| 컴포넌트 | 패키지 | 역할 |
|---------|--------|------|
| `MessageConfig` | `config` | MessageSource, MessageSourceAccessor 빈 설정 |
| `WebMvcConfig` | `config` | CookieLocaleResolver, LocaleChangeInterceptor 설정 |
| `I18nMessageProvider` | `i18n.service` | 블랙리스트 필터링, 불변 캐시, SHA-256 해시 계산 |
| `I18nRestController` | `i18n.controller` | REST API 엔드포인트 (`GET /api/i18n/messages`) |
| `i18n-init.js` | `static/javascript/common` | localStorage SWR 캐싱 + i18next 초기화 |

---

## 서버 사이드 구성

### MessageConfig

<Term id="message-source">MessageSource</Term>는 `.properties` 파일에서 다국어 메시지를 로드하는 Spring의 핵심 인터페이스입니다.

```java
@Configuration
public class MessageConfig {

    private final Locale defaultLocale = Locale.KOREAN;

    @Bean
    public MessageSource messageSource() {
        ReloadableResourceBundleMessageSource messageSource =
            new ReloadableResourceBundleMessageSource();
        messageSource.setBasenames("classpath:messages/messages");
        messageSource.setDefaultEncoding("UTF-8");
        messageSource.setFallbackToSystemLocale(false);
        return messageSource;
    }

    @Bean
    public MessageSourceAccessor messageSourceAccessor() {
        return new MessageSourceAccessor(messageSource(), defaultLocale);
    }
}
```

| 설정 | 설명 |
|------|------|
| `setBasenames` | `messages_ko.properties`, `messages_en.properties` 자동 매칭 |
| `setFallbackToSystemLocale(false)` | 시스템 locale이 아닌 기본 파일(`messages_ko`)로 fallback |
| `MessageSourceAccessor` | locale을 매번 전달하지 않아도 기본 locale로 메시지를 조회하는 헬퍼 |

### LocaleResolver와 Interceptor

`CookieLocaleResolver`는 사용자의 언어 선택을 브라우저 쿠키에 저장합니다.
세션 기반(`SessionLocaleResolver`)과 달리, 로그아웃이나 세션 만료 후에도 언어 설정이 유지됩니다.

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Bean
    public LocaleResolver localeResolver() {
        CookieLocaleResolver resolver = new CookieLocaleResolver("lang");
        resolver.setDefaultLocale(Locale.KOREAN);
        resolver.setCookieMaxAge(Duration.ofDays(365));
        resolver.setCookieHttpOnly(true);
        resolver.setCookieSecure(true);
        resolver.setCookiePath("/");
        return resolver;
    }

    @Bean
    public LocaleChangeInterceptor localeChangeInterceptor() {
        LocaleChangeInterceptor interceptor = new LocaleChangeInterceptor();
        interceptor.setParamName("lang");
        interceptor.setIgnoreInvalidLocale(true);
        return interceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(localeChangeInterceptor());
    }
}
```

`LocaleChangeInterceptor`는 URL의 `?lang=ko` 또는 `?lang=en` 파라미터를 감지하여 CookieLocaleResolver에 locale을 설정합니다.
`setIgnoreInvalidLocale(true)`으로 조작된 파라미터를 무시합니다.

<div className="info-box">
  <strong>보안 설정 포인트</strong><br/>
  <code>setCookieHttpOnly(true)</code>는 JavaScript에서 쿠키 접근을 차단하고,
  <code>setCookieSecure(true)</code>는 HTTPS에서만 쿠키가 전송되도록 합니다.
</div>

### 메시지 파일 구조

```
src/main/resources/messages/
├── messages_ko.properties   # 한국어 (기본)
└── messages_en.properties   # 영어
```

메시지 키는 `{영역}.{기능}.{상세}` 규칙을 따릅니다.

```properties
# 공통 버튼
common.btn.save=저장
common.btn.cancel=취소

# 메뉴
menu.dashboard=대시보드

# Toast 메시지
toast.save.success=저장되었습니다.

# 파라미터 치환 ({0}, {1})
auth.error.login.locked=로그인 제한시간 적용됨. {0}분 후 재시도하세요.

# 서버 전용 메시지 (클라이언트 미노출)
_server.error.db.connection=DB 연결 실패
_server.audit.login.success=로그인 성공
```

`_server.` prefix로 시작하는 키는 서버 내부용 메시지이며, 클라이언트에 노출되지 않습니다.
이 필터링은 다음 섹션의 `I18nMessageProvider`에서 처리합니다.

---

## I18nMessageProvider 설계

`I18nMessageProvider`는 이 아키텍처의 핵심 컴포넌트입니다.
서버 시작 시 메시지를 한 번만 빌드하고, 이후에는 불변 캐시에서 읽기만 수행합니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/spring-boot-i18next-architecture/server-init-flow-light.svg" alt="I18nMessageProvider 초기화 흐름 - ResourceBundle 로드, 블랙리스트 필터링, 불변 캐시 생성, SHA-256 해시 계산" />
      <img className="theme-dark" src="/images/posts/spring-boot-i18next-architecture/server-init-flow-dark.svg" alt="I18nMessageProvider 초기화 흐름 - ResourceBundle 로드, 블랙리스트 필터링, 불변 캐시 생성, SHA-256 해시 계산" />
    </div>
    <figcaption>그림 3. I18nMessageProvider 서버 시작 시 초기화 흐름</figcaption>
  </div>
</figure>

### 설계 원칙

| 원칙 | 구현 |
|------|------|
| **불변 캐시** | 생성자에서 모든 locale의 메시지를 빌드, `Collections.unmodifiableMap`으로 보관 |
| **블랙리스트 필터링** | `DENIED_PREFIXES`(`_server.`)에 해당하는 키만 차단, 나머지 전부 노출 |
| **locale 검증** | `ALLOWED_LOCALES`(ko, en)만 허용, 나머지는 ko로 fallback |
| **컨텐츠 해시** | SHA-256 기반 64자 hex 문자열로 메시지 변경 감지 |

### 블랙리스트 방식을 선택한 이유

```java
private static final Set<String> DENIED_PREFIXES = Set.of("_server.");
```

화이트리스트 방식(허용할 prefix를 모두 나열)도 가능하지만, 블랙리스트 방식은 다음 장점이 있습니다.

- 새 메시지 키를 추가할 때 prefix 등록이 불필요합니다
- 서버 전용 키에만 `_server.` prefix를 붙이면 됩니다
- 설정 변경 없이 클라이언트에서 바로 사용할 수 있습니다

### SHA-256 해시 계산

메시지 맵을 `TreeMap`으로 정렬한 뒤 `key=value` 문자열을 연결하여 SHA-256 해시를 계산합니다.
TreeMap을 사용하는 이유는 키 순서를 보장하여 **동일한 메시지 내용이면 항상 동일한 해시**가 생성되도록 하기 위함입니다.

```java
private String computeHash(Map<String, String> messages) {
    TreeMap<String, String> sorted = new TreeMap<>(messages);
    StringBuilder sb = new StringBuilder();
    sorted.forEach((k, v) -> sb.append(k).append('=').append(v).append('\n'));

    MessageDigest digest = MessageDigest.getInstance("SHA-256");
    byte[] hash = digest.digest(sb.toString().getBytes(StandardCharsets.UTF_8));
    return HexFormat.of().formatHex(hash); // 64자 hex 문자열
}
```

---

## REST API 엔드포인트

`I18nRestController`는 localStorage 캐시 미스 시 메시지를 로드하는 단일 엔드포인트를 제공합니다.

```java
@RestController
@RequiredArgsConstructor
public class I18nRestController {

    private final I18nMessageProvider i18nMessageProvider;

    @GetMapping("/api/i18n/messages")
    public ResponseEntity<Map<String, Object>> getMessages(
            @RequestParam(value = "lang", defaultValue = "ko") String lang) {
        return ResponseEntity.ok(Map.of(
                "hash", i18nMessageProvider.messagesHash(lang),
                "messages", i18nMessageProvider.messagesMap(lang)
        ));
    }
}
```

| 엔드포인트 | 메서드 | 응답 | 호출 시점 |
|-----------|--------|------|----------|
| `/api/i18n/messages?lang=ko` | GET | `{ hash, messages }` | localStorage 캐시 미스 또는 해시 불일치 시 |

응답에 `hash`를 함께 포함하여, 클라이언트가 캐시 저장 시 해시값도 함께 보관할 수 있도록 합니다.

---

## localStorage SWR 캐싱 전략

이 아키텍처의 핵심인 <Term id="swr">SWR</Term> 캐싱 전략을 살펴보겠습니다.
브라우저는 localStorage의 캐시 해시와 서버가 HTML에 주입한 해시를 비교하여, 3가지 경로 중 하나로 분기합니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/spring-boot-i18next-architecture/swr-cache-flow-light.svg" alt="SWR 캐싱 분기 플로차트 - Cache Hit, Stale, Cold Start 3가지 경로" />
      <img className="theme-dark" src="/images/posts/spring-boot-i18next-architecture/swr-cache-flow-dark.svg" alt="SWR 캐싱 분기 플로차트 - Cache Hit, Stale, Cold Start 3가지 경로" />
    </div>
    <figcaption>그림 4. localStorage SWR 캐싱의 3가지 분기 - Cache Hit, Stale, Cold Start</figcaption>
  </div>
</figure>

### 3가지 분기

| 분기 | 조건 | 동작 | 네트워크 |
|------|------|------|---------|
| **Cache Hit** | localStorage 캐시 존재 + 해시 일치 | 캐시 데이터로 즉시 init | 0회 |
| **Stale** | localStorage 캐시 존재 + 해시 불일치 (배포 후) | 기존 데이터로 init → 백그라운드 fetch | 1회 (비동기) |
| **Cold Start** | localStorage 캐시 없음 (첫 방문) | 빈 객체로 init → 백그라운드 fetch | 1회 (비동기) |

### 왜 이 방식인가?

다국어 메시지를 JavaScript에 전달하는 방법은 크게 세 가지입니다.

| 방식 | 추가 요청 | 보안 제어 | 초기 로딩 | 단점 |
|------|----------|----------|----------|------|
| **A. 매번 API Fetch** | O (매 페이지) | 가능 | 비동기 대기 필요 | 매 페이지 네트워크 요청 |
| **B. Thymeleaf 인라인 주입** | X | 가능 | HTML 크기 증가 | 메시지 수백 개일 때 HTML 수십 KB 증가 |
| **C. localStorage SWR** | 조건부 | 가능 | 동기 init 보장 | localStorage 의존 |

방식 C를 선택한 핵심 근거는 다음과 같습니다.

- **HTML 경량화**: 인라인 주입(방식 B)은 매 페이지 HTML에 전체 메시지가 포함되어 수십 KB 증가합니다. SWR 방식은 해시값(64바이트)만 주입합니다.
- **네트워크 효율**: 캐시 히트 시 네트워크 요청이 0회입니다. 배포 후 해시가 변경되면 백그라운드에서 비동기 갱신합니다.
- **동기 init 보장**: Cold start 시에도 i18next를 빈 객체로 즉시 초기화하여, downstream 스크립트에서 `i18next.t()`를 안전하게 호출할 수 있습니다.

---

## i18n-init.js 초기화 스크립트

`i18n-init.js`는 143줄의 IIFE로 구성되며, SWR 패턴을 구현합니다.

### 핵심 함수

| 함수 | 역할 |
|------|------|
| `loadFromCache()` | localStorage에서 캐시 로드, `{ messages, fresh }` 반환 |
| `saveToCache(messages, hash)` | localStorage에 메시지와 해시 저장 |
| `initI18next(messages)` | i18next 동기 초기화 |
| `fetchAndUpdate()` | `GET /api/i18n/messages` 비동기 fetch → 캐시 갱신 + i18next 리소스 교체 |

### 초기화 분기 코드

```javascript
const cached = loadFromCache();

if (cached && cached.fresh) {
    // Cache hit: 해시 일치, 네트워크 불필요
    initI18next(cached.messages);
} else if (cached) {
    // Stale: 해시 불일치 (배포 후), 기존 메시지로 우선 init → 백그라운드 갱신
    initI18next(cached.messages);
    fetchAndUpdate();
} else {
    // Cold start: 캐시 없음 (첫 방문), 빈 객체로 init → 백그라운드 갱신
    initI18next({});
    fetchAndUpdate();
}
```

`loadFromCache()`는 localStorage에서 메시지와 해시를 읽은 뒤, `window.__i18nHash`(서버에서 주입한 해시)와 비교하여 `fresh` 여부를 판단합니다.

### i18next 설정

```javascript
function initI18next(messages) {
    i18next.init({
        lng: window.__i18nLocale,
        fallbackLng: 'ko',
        resources: {
            [window.__i18nLocale]: { translation: messages }
        },
        interpolation: {
            prefix: '{',
            suffix: '}',
            escapeValue: false
        },
        keySeparator: false,
        nsSeparator: false,
        initImmediate: false
    });
}
```

| 설정 | 값 | 이유 |
|------|-----|------|
| `interpolation.prefix/suffix` | `{`, `}` | Java MessageFormat `{0}` 호환 |
| `escapeValue` | `false` | 메시지가 ResourceBundle 출처이므로 HTML 이스케이프 불필요 |
| `keySeparator` | `false` | `.`이 포함된 키(`common.btn.save`)를 계층 구조로 해석하지 않음 |
| `nsSeparator` | `false` | `:`이 포함된 키를 네임스페이스로 해석하지 않음 |
| `initImmediate` | `false` | 동기 초기화 보장 |

<div className="info-box">
  <strong>keySeparator: false가 중요한 이유</strong><br/>
  i18next는 기본적으로 <code>.</code>을 키 구분자로 인식합니다.
  <code>common.btn.save</code>를 <code>common → btn → save</code> 계층 구조로 해석하려 하면 메시지를 찾지 못합니다.
  <code>keySeparator: false</code>로 설정하면 키를 평탄한 문자열 그대로 사용합니다.
</div>

### fetchAndUpdate 구현

```javascript
function fetchAndUpdate() {
    fetch('/api/i18n/messages?lang=' + window.__i18nLocale)
        .then(function(response) { return response.json(); })
        .then(function(data) {
            saveToCache(data.messages, data.hash);
            i18next.addResourceBundle(
                window.__i18nLocale, 'translation',
                data.messages, true, true
            );
        })
        .catch(function(error) {
            console.warn('[i18n] fetch failed:', error);
        });
}
```

`addResourceBundle`의 마지막 두 인자 `(true, true)`는 각각 `deep`과 `overwrite`를 의미합니다.
기존 리소스에 깊은 병합(deep merge)하되 동일 키는 덮어쓰므로, Stale 상태에서 최신 메시지로 자연스럽게 교체됩니다.

---

## Thymeleaf 통합

### 서버 렌더링

Thymeleaf에서는 기존과 동일하게 `#{key}` 표현식을 사용합니다.

```html
<span th:text="#{menu.dashboard}">대시보드</span>
<input type="text" th:placeholder="#{common.placeholder.search}">
<span th:text="#{server.count.info(${total}, ${selected})}"></span>
```

### 인라인 해시 주입

`common.html` 공통 프래그먼트에서 locale과 해시를 JavaScript 전역 변수로 주입합니다.

```html
<!--i18next library-->
<script type="text/javascript" src="/static/lib/i18next/i18next.min.js"></script>

<script th:inline="javascript">
    window.__i18nLocale = /*[[${#locale.language}]]*/ 'ko';
    window.__i18nHash = /*[[${@i18nMessageProvider.messagesHash(#locale.language)}]]*/ '';
</script>

<script type="text/javascript" src="/static/javascript/common/i18n-init.js"></script>
```

`${@i18nMessageProvider.messagesHash(...)}`는 Thymeleaf SpEL로 Spring 빈의 메서드를 직접 호출합니다.
`@` 접두사가 빈 참조를 의미하며, `I18nMessageProvider`의 `messagesHash()` 메서드를 실행하여 64자 해시 문자열을 반환합니다.

### Cold Start 대응

localStorage 캐시가 없는 첫 방문에서는 `i18next.t()`가 키 자체를 반환합니다.
이 문제를 해결하기 위해, DataTable 기본값은 Thymeleaf `[[#{key}]]` 인라인 표현식으로 설정합니다.

```javascript
// common.html 내 DataTable defaults
$.extend(true, $.fn.dataTable.defaults, {
    language: {
        emptyTable: '[[#{datatable.empty}]]',
        info: '[[#{datatable.info}]]',
        lengthMenu: '[[#{datatable.lengthMenu}]]',
        // ...
    }
});
```

서버 렌더링 시점에 Thymeleaf가 `[[#{key}]]`를 실제 번역 텍스트로 치환하므로, i18next 초기화 전에도 번역된 텍스트가 표시됩니다.

---

## CacheControlFilter

`CacheControlFilter`(`OncePerRequestFilter` 상속)는 요청 경로에 따라 HTTP 캐시 정책을 분기합니다.

```java
@Override
protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain chain) throws ServletException, IOException {

    String path = request.getRequestURI();
    if (path.startsWith("/static/")) {
        response.setHeader("Cache-Control",
            "public, max-age=" + THIRTY_DAYS_SECONDS);
    } else {
        response.setHeader("Cache-Control",
            "no-store, no-cache, must-revalidate, max-age=0");
        response.setHeader("Pragma", "no-cache");
    }
    chain.doFilter(request, response);
}
```

| 경로 | Cache-Control | 설명 |
|------|--------------|------|
| `/static/**` | `public, max-age=2592000` | 정적 리소스 30일 캐시 |
| 그 외 | `no-store, no-cache, ...` | 동적 페이지/API 캐시 방지 |

Spring Security의 기본 Cache-Control 헤더는 `SecurityConfig`에서 비활성화되어 있으므로, 이 필터가 캐시 정책의 단일 관리 지점입니다.

<div className="info-box">
  <strong>i18next.min.js도 30일 캐시</strong><br/>
  i18next 라이브러리 파일은 <code>/static/lib/</code> 경로에 위치하므로 자동으로 30일 캐시가 적용됩니다.
  라이브러리 버전을 업데이트하면 파일명 또는 경로를 변경하여 캐시를 무효화합니다.
</div>

---

## 장단점 및 대안 비교

### 장점

| 항목 | 설명 |
|------|------|
| **HTML 경량화** | 해시값(64B)만 인라인 주입, 메시지 데이터 미포함 |
| **캐시 히트 시 제로 요청** | localStorage 캐시 히트 시 네트워크 요청 없음 |
| **동기 init 보장** | Cold start에서도 i18next를 즉시 초기화하여 downstream 안전 |
| **보안** | 블랙리스트 필터링으로 서버 내부 메시지 미노출 |
| **캐시 정확성** | SHA-256 해시 기반으로 메시지 변경 시에만 갱신 |
| **서버-클라이언트 일관성** | 같은 `.properties` 파일을 Thymeleaf와 i18next 모두에서 사용 |

### 단점과 완화 방안

| 단점 | 설명 | 완화 방안 |
|------|------|----------|
| **Cold start 번역 누락** | 첫 방문 시 `i18next.t()`가 키 자체를 반환 | DataTable 기본값을 Thymeleaf `[[#{key}]]`로 설정 |
| **런타임 언어 전환 불가** | 페이지 새로고침 필요 | MPA 구조에서는 자연스러운 동작 |
| **메시지 키 동기화 부담** | ko/en properties 수동 동기화 | IDE의 properties 비교 도구 활용 |
| **서버 재시작 필요** | 메시지 변경 시 서버 재시작으로 캐시 갱신 | 배포 시점에 자연스럽게 갱신 |
| **localStorage 의존** | 시크릿 모드/용량 초과 시 매번 fetch | fetch 실패 시 키 fallback |

### 다른 아키텍처와의 비교

| 아키텍처 | 적합한 환경 | 부적합한 환경 |
|---------|------------|--------------|
| **localStorage SWR (본 글)** | MPA, SSR 중심, 보안 중요, 캐시 효율 중요 | SPA, 실시간 언어 전환 필요 |
| **Thymeleaf 인라인 주입** | 단순 구조, 메시지 수 적음 | 메시지 수 많아 HTML 비대해지는 환경 |
| **API Fetch 전용** | SPA, 동적 언어 전환 필요 | 초기 로딩 성능 중요 |
| **정적 JS 빌드** | CDN 활용, 대규모 메시지 | 보안 필터링 필요 |

---

## 정리

| 개념 | 설명 |
|------|------|
| MessageSource | `.properties` 파일 기반 다국어 메시지 로딩 |
| CookieLocaleResolver | 쿠키 기반 언어 설정 저장 (HttpOnly, Secure) |
| I18nMessageProvider | 블랙리스트 필터링, 불변 캐시, SHA-256 해시 계산 |
| I18nRestController | 캐시 미스 시 `GET /api/i18n/messages` 제공 |
| Thymeleaf | `#{key}`로 서버 렌더링, `window.__i18nHash`로 해시 주입 |
| i18n-init.js | localStorage SWR 캐싱 + i18next 동기 초기화 |
| Cold Start 대응 | DataTable 기본값은 Thymeleaf `[[#{key}]]` 인라인 표현식 사용 |
| CacheControlFilter | 정적 리소스 30일 캐시, 동적 페이지 no-store |

이 아키텍처는 MPA(Multi-Page Application) + SSR(Server-Side Rendering) 환경에서 다국어를 효율적으로 처리하기 위해 설계되었습니다.
서버 사이드의 안정성(Thymeleaf `#{key}`)과 클라이언트 사이드의 유연성(i18next)을 결합하고, localStorage SWR 캐싱으로 네트워크 비용을 최소화합니다.

SPA 환경이라면 API Fetch 전용 방식이, 메시지 수가 적은 소규모 프로젝트라면 Thymeleaf 인라인 주입이 더 적합할 수 있습니다.
프로젝트의 요구사항에 맞는 전략을 선택하는 것이 중요합니다.
