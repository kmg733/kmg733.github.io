---
title: "브라우저 캐시 완벽 가이드 - HTTP 캐싱의 모든 것"
date: "2026-02-20"
description: "HTTP 캐싱의 동작 원리를 정리합니다. 강력 캐시와 협상 캐시의 차이, Cache-Control 디렉티브, ETag, 리소스 유형별 전략까지 실무에 필요한 캐시 지식을 다룹니다."
category: "개발"
subcategory: "웹"
tags: ["guide", "intermediate"]
glossary:
  - id: "strong-cache"
    term: "강력 캐시(Strong Cache)"
    brief: "서버에 요청하지 않고 로컬 캐시에서 즉시 응답하는 방식"
    detail: "Cache-Control의 max-age 또는 Expires 헤더로 유효 기간을 지정한다. 유효 기간 내에는 서버와 통신 없이 브라우저 캐시에서 리소스를 즉시 반환하므로 가장 빠르다. DevTools에서 'from memory cache' 또는 'from disk cache'로 표시된다."
  - id: "negotiated-cache"
    term: "협상 캐시(Negotiated Cache)"
    brief: "서버에 리소스 변경 여부만 확인한 뒤, 변경이 없으면 기존 캐시를 재사용하는 방식"
    detail: "ETag/If-None-Match 또는 Last-Modified/If-Modified-Since 헤더를 사용한다. 서버가 304 Not Modified를 응답하면 본문 없이 헤더만 전송되므로, 전체 리소스를 다시 받는 것보다 훨씬 빠르다."
  - id: "cache-control"
    term: "Cache-Control"
    brief: "HTTP 캐싱 동작을 제어하는 헤더"
    detail: "HTTP/1.1에서 도입된 캐시 제어 헤더이다. max-age, no-cache, no-store, public, private 등의 디렉티브를 조합하여 리소스의 캐시 정책을 세밀하게 지정할 수 있다. Expires보다 우선순위가 높다."
  - id: "etag"
    term: "ETag"
    brief: "리소스의 고유 식별자(해시값)"
    detail: "Entity Tag의 약자. 서버가 리소스의 내용을 기반으로 생성하는 고유 식별자이다. 리소스가 변경되면 ETag 값도 변경된다. Strong ETag(바이트 단위 일치)와 Weak ETag(의미적 동등성)로 나뉜다."
  - id: "cache-busting"
    term: "캐시 버스팅(Cache Busting)"
    brief: "URL을 변경하여 브라우저 캐시를 강제로 무효화하는 기법"
    detail: "파일명에 해시를 삽입(bundle.a1b2c3.js)하거나 쿼리 스트링에 버전을 추가(?v=1.2.3)하여 브라우저가 새 리소스로 인식하게 만드는 전략이다. 파일명 해시 방식이 가장 안정적이다."
  - id: "heuristic-caching"
    term: "휴리스틱 캐싱(Heuristic Caching)"
    brief: "Cache-Control이 없을 때 브라우저가 자체적으로 캐시 기간을 추정하는 방식"
    detail: "'(현재 시간 - Last-Modified) x 10%' 공식으로 캐시 유효 기간을 계산한다. 예측 불가능한 동작을 유발할 수 있으므로, 모든 응답에 Cache-Control을 명시적으로 설정하는 것이 권장된다."
---

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img src="/images/posts/browser-cache-guide/browser-cache.png" alt="브라우저 캐시" />
    </div>
    <figcaption>그림 1. Browser Cache</figcaption>
  </div>
</figure>

## 캐시가 필요한 이유

웹 페이지를 열 때마다 HTML, CSS, JavaScript, 이미지 등 수많은 리소스를 서버에서 내려받습니다.
매번 동일한 리소스를 반복해서 받는 것은 네트워크 트래픽 낭비이자 사용자 경험 저하의 원인이 됩니다.

HTTP 캐싱은 이전에 가져온 리소스를 재사용하여 이 문제를 해결합니다.
캐시의 핵심은 **저장(Store)**과 **재사용(Reuse)** 두 단계로 구성되며, 브라우저는 이 과정을 **강력 캐시**와 **협상 캐시**라는 두 가지 전략으로 처리합니다.

| 구분 | <Term id="strong-cache">강력 캐시</Term> | <Term id="negotiated-cache">협상 캐시</Term> |
|------|------|------|
| **서버 요청** | 하지 않음 | 조건부 요청 |
| **응답 코드** | 200 (from cache) | 304 Not Modified |
| **판단 기준** | `Cache-Control`, `Expires` | `ETag`, `Last-Modified` |
| **데이터 전송** | 없음 (로컬 캐시 사용) | 헤더만 전송 (본문 없음) |
| **속도** | 가장 빠름 | 빠름 (헤더만 주고받음) |

이 글에서는 캐시의 종류부터 동작 흐름, 각 전략의 세부 동작, 리소스별 캐시 설정, 무효화 방법까지 순서대로 정리합니다.

---

## 캐시의 종류

### 저장 위치에 따른 분류

브라우저 캐시는 저장 위치에 따라 **Memory Cache**와 **Disk Cache**로 나뉩니다.

| 기준 | Memory Cache | Disk Cache |
|------|-------------|------------|
| **저장 위치** | 브라우저 탭의 메모리(RAM) | 하드디스크/SSD |
| **속도** | 가장 빠름 | 빠름 (메모리보다 느림) |
| **수명** | 탭을 닫으면 소멸 | 브라우저를 닫아도 유지 |
| **대상** | 작은 파일, 자주 사용되는 리소스 | 큰 파일, 일반 리소스 |
| **DevTools 표시** | `from memory cache` | `from disk cache` |

<div className="info-box">
  브라우저가 리소스를 Memory Cache에 넣을지 Disk Cache에 넣을지는 자체적으로 판단합니다.
  개발자가 직접 제어할 수는 없습니다.
</div>

### 캐시 계층에 따른 분류

캐시는 브라우저에만 존재하는 것이 아닙니다.
클라이언트에서 서버까지의 경로에 여러 계층의 캐시가 존재합니다.

```
클라이언트 (브라우저)
  └── Private Cache (개인 캐시)
        ├── 특정 사용자 전용
        └── Cache-Control: private

중간 서버
  └── Shared Cache (공유 캐시)
        ├── Proxy Cache ─ ISP, 기업 프록시 서버
        └── Managed Cache ─ CDN, Reverse Proxy, Service Worker

원본 서버 (Origin Server)
```

- **Private Cache**: 브라우저에만 저장되는 캐시입니다. `Cache-Control: private`으로 설정하면 CDN이나 프록시 서버에서는 캐시하지 않습니다.
- **Shared Cache**: 여러 사용자가 공유하는 캐시입니다. CDN(CloudFront, Cloudflare 등)이나 Reverse Proxy(Nginx, Varnish)가 대표적입니다.

---

## 캐시 동작 흐름

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/browser-cache-guide/browser-cache-light.png" alt="브라우저 캐시 동작 흐름" />
      <img className="theme-dark" src="/images/posts/browser-cache-guide/browser-cache-dark.png" alt="브라우저 캐시 동작 흐름" />
    </div>
    <figcaption>그림 2. 브라우저, 캐시 스토리지, 웹 서버 간의 리소스 흐름</figcaption>
  </div>
</figure>

브라우저가 리소스를 요청할 때, 캐시를 확인하는 과정은 다음과 같습니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/browser-cache-guide/cache-flow-light.png" alt="캐시 동작 흐름도" />
      <img className="theme-dark" src="/images/posts/browser-cache-guide/cache-flow-dark.png" alt="캐시 동작 흐름도" />
    </div>
    <figcaption>그림 3. 브라우저 캐시 동작 흐름 - 강력 캐시 확인 후 협상 캐시로 이어지는 과정</figcaption>
  </div>
</figure>

핵심은 **강력 캐시가 먼저**, 만료되면 **협상 캐시가 동작**한다는 점입니다.
이제 각 전략을 자세히 살펴보겠습니다.

---

## 강력 캐시 (Strong Cache)

<Term id="strong-cache">강력 캐시</Term>는 서버에 요청하지 않고 로컬 캐시에서 즉시 리소스를 반환하는 방식입니다.
네트워크 통신이 전혀 없으므로 가장 빠릅니다.

### Cache-Control 헤더

<Term id="cache-control">Cache-Control</Term>은 HTTP/1.1에서 도입된 캐시 제어 헤더입니다.

```http
Cache-Control: max-age=31536000
```

주요 디렉티브를 표로 정리하면 다음과 같습니다.

| 디렉티브 | 의미 | 예시 |
|----------|------|------|
| `max-age=<초>` | 캐시 유효 시간 (초 단위) | `max-age=3600` (1시간) |
| `no-cache` | 캐시 저장은 하되, 사용 전 반드시 서버 검증 | 자주 바뀌는 HTML |
| `no-store` | 캐시 저장 자체를 금지 | 민감한 개인정보 |
| `must-revalidate` | 만료 후 반드시 서버 검증 | 중요 데이터 |
| `public` | 중간 서버(CDN, 프록시)도 캐시 가능 | 공개 이미지, JS |
| `private` | 브라우저만 캐시 가능 | 개인화 페이지 |
| `s-maxage=<초>` | 공유 캐시(CDN)에서만 적용되는 max-age | CDN 전략 분리 |
| `immutable` | 리소스가 절대 변하지 않음 | 해시 포함 URL |
| `stale-while-revalidate=<초>` | 만료 후에도 캐시를 먼저 반환하고 백그라운드에서 갱신 | UX 최적화 |

### no-cache vs no-store

이름이 혼동을 주는 대표적인 디렉티브입니다.

```
no-cache
├── 캐시에 저장한다
├── 사용할 때마다 서버에 검증 요청을 보낸다
├── 서버가 304 응답하면 캐시 재사용 (본문 전송 없음)
└── "캐시하되, 항상 확인하고 써라"

no-store
├── 캐시에 저장하지 않는다
├── 매번 서버에서 전체 리소스를 다시 받는다
└── "절대 캐시하지 마라"
```

<div className="info-box">
  <strong>no-cache는 캐시를 금지하지 않습니다.</strong><br/>
  이름과 달리 리소스를 캐시에 저장하되, 사용 전에 항상 서버에 확인하는 것입니다.
  캐시 자체를 금지하려면 <code>no-store</code>를 사용해야 합니다.
</div>

### must-revalidate의 역할

`max-age`가 만료된 후의 동작에 차이가 생깁니다.

| 상황 | must-revalidate 없음 | must-revalidate 있음 |
|------|---------------------|---------------------|
| 네트워크 정상 | 서버에 검증 요청 | 서버에 검증 요청 |
| 네트워크 불가 | 만료된 캐시라도 사용 가능 | 504 Gateway Timeout 반환 |

네트워크가 불안정한 환경에서 오래된 데이터가 표시되는 것을 방지할 때 유용합니다.

### Expires와 Pragma (레거시)

HTTP/1.0에서 사용하던 헤더입니다.

```http
Expires: Wed, 21 Oct 2026 07:28:00 GMT
Pragma: no-cache
```

- **Expires**: 절대 시간으로 만료일을 지정합니다. 클라이언트와 서버의 시계가 다르면 문제가 발생할 수 있습니다.
- **Pragma**: `Cache-Control: no-cache`와 동일한 역할입니다. HTTP/1.0 하위 호환용으로만 사용합니다.

헤더 우선순위는 `Cache-Control > Expires > Pragma` 순입니다.
`Cache-Control: max-age`와 `Expires`가 함께 있으면 **max-age가 우선**됩니다.

---

## 협상 캐시 (Negotiated Cache)

<Term id="strong-cache">강력 캐시</Term>가 만료(Stale)된 후, 서버에 "리소스가 변경되었는지" 확인하는 방식입니다.
변경이 없으면 본문 없이 **304 Not Modified**만 응답하므로, 전체 리소스를 다시 받는 것보다 훨씬 효율적입니다.

### ETag / If-None-Match (권장)

<Term id="etag">ETag</Term>는 리소스의 내용을 기반으로 생성된 고유 식별자(해시값)입니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/browser-cache-guide/etag-flow-light.png" alt="ETag 협상 캐시 흐름" />
      <img className="theme-dark" src="/images/posts/browser-cache-guide/etag-flow-dark.png" alt="ETag 협상 캐시 흐름" />
    </div>
    <figcaption>그림 4. ETag / If-None-Match 협상 캐시 흐름</figcaption>
  </div>
</figure>

ETag는 Strong ETag(`"33a64df5"`)와 Weak ETag(`W/"33a64df5"`)로 나뉩니다.
Strong ETag는 바이트 단위 완전 일치를 요구하고, Weak ETag는 의미적 동등성만 확인합니다.

### Last-Modified / If-Modified-Since

파일의 마지막 수정 시간을 기준으로 비교하는 방식입니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/browser-cache-guide/last-modified-flow-light.png" alt="Last-Modified 협상 캐시 흐름" />
      <img className="theme-dark" src="/images/posts/browser-cache-guide/last-modified-flow-dark.png" alt="Last-Modified 협상 캐시 흐름" />
    </div>
    <figcaption>그림 5. Last-Modified / If-Modified-Since 협상 캐시 흐름</figcaption>
  </div>
</figure>

<details>
<summary>Last-Modified의 한계</summary>

- **초 단위 정밀도**: 1초 내 여러 번 수정되면 변경을 감지하지 못합니다.
- **내용 무관 변경**: 파일을 열었다 저장만 해도 수정 시간이 바뀝니다. 내용이 같아도 변경으로 인식됩니다.
- **분산 서버 환경**: 서버마다 파일의 수정 시간이 다를 수 있습니다.

이러한 한계 때문에 ETag를 기본으로 사용하고, Last-Modified는 보조 수단으로 함께 제공하는 것이 권장됩니다.

</details>

### ETag vs Last-Modified 비교

| 항목 | ETag | Last-Modified |
|------|------|---------------|
| **정밀도** | 내용 기반 (정확함) | 시간 기반 (초 단위) |
| **우선순위** | 높음 (먼저 확인) | 낮음 (ETag 없을 때 사용) |
| **계산 비용** | 해시 계산 필요 | 파일시스템에서 즉시 확인 |

<div className="info-box">
  <strong>베스트 프랙티스</strong><br/>
  서버는 ETag와 Last-Modified를 <strong>둘 다</strong> 응답에 포함하는 것이 좋습니다.
  브라우저는 If-None-Match(ETag)를 우선 확인하고, 없으면 If-Modified-Since를 사용합니다.
</div>

---

## 휴리스틱 캐싱

<Term id="heuristic-caching">휴리스틱 캐싱</Term>은 `Cache-Control`이나 `Expires`가 없을 때, 브라우저가 자체적으로 캐시 기간을 추정하는 방식입니다.

### 동작 조건

- `Cache-Control` 헤더 없음
- `Expires` 헤더 없음
- `Last-Modified` 헤더 있음

### 캐시 기간 계산

```
캐시 기간 = (현재 시간 - Last-Modified) × 10%
```

예를 들어, 마지막 수정 후 1년(365일)이 경과했다면 캐시 유효 기간은 약 36.5일로 추정됩니다.

```http
HTTP/1.1 200 OK
Last-Modified: Tue, 22 Feb 2025 22:22:22 GMT
Date: Tue, 22 Feb 2026 22:22:22 GMT
```

<div className="info-box">
  휴리스틱 캐싱은 예측 불가능한 동작을 유발할 수 있습니다.
  <strong>모든 응답에 명시적으로 Cache-Control을 설정</strong>하여 휴리스틱 캐싱을 방지하는 것이 권장됩니다.
</div>

---

## GET vs POST 캐시 동작

HTTP 메서드에 따라 캐시 동작이 다릅니다.

| 항목 | GET | POST |
|------|-----|------|
| **캐시 여부** | 캐시됨 | 캐시 안 됨 |
| **캐시 키** | URL + 쿼리 스트링 | 해당 없음 |
| **HTTP 스펙** | 안전한 메서드 (Safe) | 부수 효과 있음 (Unsafe) |

GET 요청은 URL이 같으면 캐시가 적중합니다.
쿼리 파라미터가 다르면 **별도의 캐시 엔트리**로 저장됩니다.

```
GET /api/servers?keyword=web     → 서버 요청 → 캐시 저장 [A]
GET /api/servers?keyword=db      → 서버 요청 → 캐시 저장 [B]
GET /api/servers?keyword=web     → 캐시 히트 [A]
GET /api/servers?keyword=web&page=2  → 서버 요청 → 캐시 저장 [C]
```

POST는 HTTP 스펙(RFC 7231)에서 **부수 효과(side effect)**가 있는 메서드로 정의됩니다.
같은 요청을 보내도 서버 상태가 변경될 수 있으므로, 브라우저는 POST 응답을 캐시하지 않습니다.

<details>
<summary>AJAX 요청도 동일한가?</summary>

동일합니다. `$.ajax()`, `fetch()` 등의 AJAX 요청도 일반 HTTP 요청과 같은 캐싱 규칙을 따릅니다.

```javascript
// GET → 캐시 대상
fetch('/api/list.do?page=1');

// POST → 캐시 안 됨
fetch('/api/save.do', { method: 'POST', body: formData });
```

</details>

---

## Vary 헤더

같은 URL이라도 요청 헤더에 따라 다른 응답을 제공해야 할 때 사용합니다.

```http
Vary: Accept-Language
```

이 경우 캐시 키가 **URL + Accept-Language 값**으로 구성됩니다.

```
GET /index.html  (Accept-Language: ko)  → 한국어 HTML 캐시
GET /index.html  (Accept-Language: en)  → 영어 HTML 캐시 (별도 저장)
```

### Vary 사용 시 주의사항

| 설정 | 권장 여부 | 이유 |
|------|----------|------|
| `Vary: Accept-Encoding` | 권장 | gzip/br 구분에 적절 |
| `Vary: Accept-Language` | 권장 | 다국어 지원에 적절 |
| `Vary: User-Agent` | 비권장 | 변형이 너무 많아 캐시 적중률 급감 |
| `Vary: Cookie` | 비권장 | 사용자마다 다른 캐시가 생성되어 의미 없음 |

---

## 리소스 유형별 캐시 전략

실무에서 리소스 유형에 따라 어떤 캐시 전략을 적용하면 좋은지 정리합니다.

| 리소스 유형 | Cache-Control | 이유 |
|------------|---------------|------|
| **HTML** (메인 페이지) | `no-cache` | 항상 최신 확인 필요, 304로 빠르게 검증 |
| **JS/CSS** (해시 포함 URL) | `max-age=31536000, immutable` | URL이 곧 버전, 영구 캐시 안전 |
| **JS/CSS** (해시 없음) | `no-cache` 또는 `max-age=0` | 변경 감지 불가, 매번 검증 필요 |
| **이미지/폰트** | `max-age=2592000` (30일) | 자주 변경되지 않음 |
| **API 응답** | `no-store` 또는 `no-cache, private` | 동적 데이터, 개인정보 포함 가능 |
| **민감 데이터** | `no-store` | 절대 캐시 금지 |

### 실제 사례: 토스의 캐시 전략

```http
HTML 파일:
  Cache-Control: max-age=0, s-maxage=31536000
  → 브라우저: 매번 서버 검증 (ETag/304)
  → CDN: 1년 캐시 (배포 시 CDN Invalidation)

JS/CSS 파일 (해시 포함):
  Cache-Control: max-age=31536000
  URL: /static/bundle.a1b2c3d4.js
  → URL에 콘텐츠 해시가 포함되어 영구 캐시 안전
  → 파일 변경 시 해시가 바뀌어 새 URL로 요청됨
```

`max-age=0`과 `s-maxage=31536000`을 조합하면, 브라우저는 매번 서버에 검증하면서도 CDN에서는 1년간 캐시를 유지할 수 있습니다. 배포할 때 CDN Invalidation만 수행하면 됩니다.

---

## 캐시 무효화 방법

### 클라이언트 측

| 방법 | 동작 |
|------|------|
| **일반 새로고침** (F5) | `Cache-Control: max-age=0` + 조건부 요청 |
| **강력 새로고침** (Ctrl+F5) | 캐시 무시, 서버에서 전체 리소스를 새로 받음 |
| **캐시 삭제** | 브라우저 설정에서 수동 삭제 |

### 서버 측

| 방법 | 동작 |
|------|------|
| **Cache Busting** | URL에 버전/해시 포함 (가장 효과적) |
| **CDN Invalidation** | CDN 캐시 삭제 (브라우저 캐시는 영향 없음) |
| **Clear-Site-Data** | `Clear-Site-Data: "cache"` 헤더로 브라우저 캐시 삭제 |
| **짧은 max-age** | 캐시 유효 기간 단축 |

### Cache Busting 전략

<Term id="cache-busting">캐시 버스팅</Term>은 URL을 변경하여 브라우저가 새 리소스로 인식하게 만드는 기법입니다.

```
방법 1: 쿼리 스트링 (간단하지만 일부 프록시에서 무시될 수 있음)
  /js/common.js?v=1.2.3
  /js/common.js?v=1.2.4

방법 2: 파일명에 해시 삽입 (권장)
  /js/common-a1b2c3d4.js
  /js/common-e5f6g7h8.js

방법 3: 경로에 버전 포함
  /v1.2.3/js/common.js
  /v1.2.4/js/common.js
```

<div className="info-box">
  <strong>파일명 해시 방식이 가장 안정적</strong>입니다.<br/>
  쿼리 스트링 방식은 일부 CDN/프록시에서 캐시 키로 인식하지 않을 수 있습니다.
  Webpack, Vite 등 번들러에서 자동으로 파일명에 해시를 삽입해줍니다.
</div>

---

## DevTools에서 캐시 확인하기

Chrome DevTools의 Network 탭에서 캐시 동작을 확인할 수 있습니다.

### Status / Size 컬럼 해석

| 표시 | 의미 | 서버 요청 |
|------|------|----------|
| `200` (일반 Size) | 서버에서 새로 받음 | O |
| `200` (from memory cache) | 메모리 캐시 히트 (강력 캐시) | X |
| `200` (from disk cache) | 디스크 캐시 히트 (강력 캐시) | X |
| `304` Not Modified | 협상 캐시 성공 | O (헤더만) |

- `from memory cache`는 0ms에 가까운 속도로 로딩됩니다.
- `from disk cache`는 수 ms 정도 소요됩니다.
- `304`는 수백 바이트의 헤더만 전송됩니다.

<div className="info-box">
  DevTools를 열고 <strong>"Disable cache"</strong>를 체크하면 모든 캐시가 비활성화됩니다.
  <strong>개발 중에만</strong> 사용하고, 실제 사용자 환경을 테스트할 때는 반드시 해제해야 합니다.
</div>

---

## 정리

| 개념 | 설명 |
|------|------|
| 강력 캐시 | `Cache-Control: max-age`로 서버 요청 없이 로컬에서 즉시 응답 |
| 협상 캐시 | `ETag`/`Last-Modified`로 변경 여부만 확인하여 304로 빠르게 응답 |
| no-cache | 캐시를 금지하지 않음. "저장하되, 매번 확인하고 사용" |
| no-store | 진정한 캐시 금지. 저장 자체를 하지 않음 |
| 캐시 대상 | GET 요청만 캐시됨. POST는 캐시되지 않음 |
| AJAX 캐시 | AJAX도 일반 HTTP 요청과 동일한 캐싱 규칙을 따름 |
| 쿼리 파라미터 | 쿼리 파라미터가 다르면 별도의 캐시 엔트리 |
| Cache Busting | URL에 해시를 삽입하는 것이 가장 안정적인 캐시 무효화 전략 |
| 휴리스틱 캐싱 | 모든 응답에 Cache-Control을 명시하여 방지 |
| 베스트 프랙티스 | ETag와 Last-Modified를 함께 제공 |
