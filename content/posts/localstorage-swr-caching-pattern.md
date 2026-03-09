---
title: "localStorage SWR 캐싱 패턴 - 네트워크 요청 0회를 달성하는 브라우저 캐시 전략"
date: "2026-03-06"
description: "브라우저의 localStorage에 데이터를 캐시하고, 해시 비교 기반 SWR(Stale-While-Revalidate) 전략으로 네트워크 요청을 최소화하는 클라이언트 사이드 캐싱 패턴을 소개합니다. 비개발자도 이해할 수 있도록 일상 비유부터 시작하여, 구현 원리까지 단계적으로 설명합니다."
category: "개발"
subcategory: "웹"
tags: ["guide", "beginner"]
thumbnail: "/images/thumbnails/web"
glossary:
  - id: "swr"
    term: "SWR(Stale-While-Revalidate)"
    brief: "캐시된 데이터를 먼저 사용하고, 백그라운드에서 최신 데이터를 가져오는 캐시 전략"
    detail: "HTTP Cache-Control 확장 디렉티브에서 유래한 개념이다. 사용자에게 즉각적인 응답을 제공하면서, 동시에 데이터의 최신성을 보장한다. '일단 가진 것을 먼저 보여주고, 뒤에서 새 것을 확인한다'로 요약할 수 있다. React의 SWR 라이브러리도 이 개념에서 이름을 따왔다."
  - id: "localstorage"
    term: "localStorage"
    brief: "브라우저에 내장된 영구 저장소"
    detail: "Web Storage API의 일부로, 브라우저를 닫아도 데이터가 유지되는 키-값 저장소이다. 도메인당 약 5MB의 용량을 제공하며, JavaScript의 localStorage.setItem()과 localStorage.getItem()으로 데이터를 읽고 쓴다. 서버에 자동 전송되지 않아 네트워크 트래픽을 유발하지 않는다."
  - id: "hash"
    term: "해시(Hash)"
    brief: "데이터의 고유 지문을 생성하는 함수"
    detail: "SHA-256 같은 해시 함수는 임의 길이의 입력을 고정 길이의 출력으로 변환한다. 같은 입력은 항상 같은 출력을 만들고, 입력이 한 글자라도 바뀌면 완전히 다른 출력이 생성된다. 이 특성을 이용하여 데이터의 변경 여부를 빠르게 판단할 수 있다."
  - id: "cache-hit"
    term: "캐시 히트(Cache Hit)"
    brief: "저장된 캐시 데이터를 그대로 사용할 수 있는 상태"
    detail: "브라우저가 요청한 데이터가 캐시에 존재하고, 그 데이터가 최신 상태인 경우를 말한다. 캐시 히트 시 서버에 별도의 요청을 보내지 않으므로 응답 속도가 가장 빠르고 네트워크 비용이 0이다."
  - id: "cold-start"
    term: "Cold Start"
    brief: "캐시가 전혀 없는 최초 상태"
    detail: "사용자가 처음 방문하거나 캐시가 삭제된 상태를 말한다. 이 경우 서버에서 데이터를 받아와야 하므로 네트워크 요청이 1회 발생한다. 한 번 데이터를 받아오면 캐시에 저장되어 이후부터는 Cache Hit 또는 Stale 상태가 된다."
---

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/localstorage-swr-caching-pattern/hero-light.png" alt="localStorage SWR 캐싱 패턴" />
      <img className="theme-dark" src="/images/posts/localstorage-swr-caching-pattern/hero-dark.png" alt="" />
    </div>
  </div>
</figure>

웹 페이지를 열 때마다 서버에서 같은 데이터를 반복해서 받아오는 것은 낭비입니다.
특히 다국어 번역 메시지나 설정 데이터처럼 자주 변하지 않는 데이터라면 더욱 그렇습니다.

이 글에서는 브라우저의 <Term id="localstorage">localStorage</Term>에 데이터를 캐시하고,
<Term id="hash">해시</Term> 비교 기반 <Term id="swr">SWR(Stale-While-Revalidate)</Term> 전략으로
네트워크 요청을 최소화하는 캐싱 패턴을 소개합니다.
비개발자도 이해할 수 있도록, 일상 비유부터 시작하여 단계적으로 설명합니다.

<div className="info-box">
  <strong>이 패턴의 실제 적용 사례가 궁금하다면</strong><br/>
  <a href="/blog/spring-boot-i18next-architecture">Spring Boot에서 i18next로 다국어 구현하기</a>에서
  이 캐싱 패턴을 Spring Boot + Thymeleaf 환경의 다국어 아키텍처에 적용한 전체 구현을 다룹니다.
</div>

---

## 일상 비유로 이해하는 캐싱

캐싱은 **"자주 쓰는 물건을 가까운 곳에 두는 것"**과 같습니다.
집 앞 편의점에서 매일 우유를 사 온다고 가정해 보겠습니다.

| 전략 | 행동 | 결과 |
|------|------|------|
| **캐시 없음** | 매번 편의점에 가서 우유를 산다 | 매번 시간이 걸린다 |
| **캐시 우선** | 냉장고에 우유가 있으면 그걸 마신다. 없으면 편의점에 간다 | 빠르지만, 유통기한이 지난 우유를 마실 수 있다 |
| **SWR** | 냉장고 우유를 먼저 마시면서, 가족에게 "편의점에서 새 우유 좀 사다 줘"라고 부탁한다 | 기다림 없이 즉시 마시면서, 다음에는 신선한 우유가 준비된다 |

SWR의 핵심은 **"기다리지 않는다"**는 것입니다.
가진 것을 즉시 사용하면서, 동시에 백그라운드에서 최신 데이터를 준비합니다.

---

## 3가지 캐시 전략 비교

캐시 없음, 캐시 우선, SWR 전략의 차이를 다이어그램으로 살펴보겠습니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/localstorage-swr-caching-pattern/cache-strategies-light.png" alt="3가지 캐시 전략 비교 - 캐시 없음, 캐시 우선, SWR 전략의 흐름도" />
      <img className="theme-dark" src="/images/posts/localstorage-swr-caching-pattern/cache-strategies-dark.png" alt="" />
    </div>
    <figcaption>그림 1. 캐시 없음 / 캐시 우선 / SWR 전략의 동작 차이</figcaption>
  </div>
</figure>

- **캐시 없음**: 매번 서버에 요청합니다. 같은 요청이라도 서버에 또 요청합니다.
- **캐시 우선**: 캐시가 있으면 즉시 사용합니다. 하지만 캐시가 오래되었는지 확인하지 않습니다.
- **SWR**: 캐시가 있으면 즉시 사용하면서, 동시에 백그라운드에서 최신 데이터를 가져와 캐시를 갱신합니다.

SWR은 **속도(캐시 즉시 사용)**와 **최신성(백그라운드 갱신)**을 동시에 달성하는 전략입니다.

---

## 왜 localStorage인가?

SWR 패턴의 캐시 저장소로 <Term id="localstorage">localStorage</Term>를 사용하는 이유를 알기 위해, 브라우저가 제공하는 저장 방식을 비교해 보겠습니다.

| 항목 | Cookie | sessionStorage | localStorage |
|------|--------|----------------|--------------|
| **용량** | ~4KB | ~5MB | ~5MB |
| **수명** | 만료일 설정 가능 | 탭을 닫으면 삭제 | 직접 삭제할 때까지 영구 |
| **서버 전송** | 매 요청마다 자동 전송 | 전송 안 됨 | 전송 안 됨 |
| **SWR 캐시에 적합?** | 용량 작고 불필요한 전송 | 탭 닫으면 소멸 | **영구 저장, 충분한 용량** |

localStorage가 SWR 캐시에 적합한 이유는 세 가지입니다.

1. **영구 저장**: 브라우저를 닫아도 데이터가 남아있어 다음 방문 시 즉시 사용할 수 있습니다.
2. **충분한 용량**: 5MB이면 JSON 형태의 번역 데이터나 설정 데이터를 저장하기에 충분합니다.
3. **서버 미전송**: Cookie와 달리 매 요청에 자동으로 포함되지 않아 네트워크 트래픽을 유발하지 않습니다.

### 기본 사용법

```javascript
// 저장
localStorage.setItem('user_lang', 'ko');

// 조회
const lang = localStorage.getItem('user_lang');  // 'ko'

// 삭제
localStorage.removeItem('user_lang');

// 객체 저장 (JSON 변환 필요)
const data = { name: '홍길동', age: 30 };
localStorage.setItem('user', JSON.stringify(data));

// 객체 조회
const user = JSON.parse(localStorage.getItem('user'));
```

---

## SWR 캐싱 패턴의 동작 원리

SWR 패턴은 사용자의 요청을 3가지 상태로 분류하여 처리합니다.

### 3가지 분기

| 상태 | 조건 | 동작 | 서버 요청 |
|------|------|------|----------|
| **<Term id="cache-hit">Cache Hit</Term>** | 캐시 있음 + 해시 일치 | 캐시 데이터로 즉시 표시 | **0회** |
| **Stale** | 캐시 있음 + 해시 불일치 | 캐시로 즉시 표시 + 백그라운드 갱신 | 1회 (비동기) |
| **<Term id="cold-start">Cold Start</Term>** | 캐시 없음 | 서버에서 데이터 요청 후 표시 | 1회 |

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/localstorage-swr-caching-pattern/swr-flow-light.png" alt="SWR 전체 흐름도 - Cache Hit, Stale, Cold Start 3가지 분기" />
      <img className="theme-dark" src="/images/posts/localstorage-swr-caching-pattern/swr-flow-dark.png" alt="" />
    </div>
    <figcaption>그림 2. SWR 캐싱의 3가지 분기 - Cache Hit, Stale, Cold Start</figcaption>
  </div>
</figure>

### 핵심 포인트

- **Cache Hit**이 가장 이상적인 상태입니다. 서버 요청이 0회이므로 네트워크 비용이 없습니다.
- **Stale** 상태에서도 사용자는 기다림 없이 즉시 화면을 봅니다. 백그라운드 갱신은 사용자가 인식하지 못합니다.
- **Cold Start**는 최초 1회만 발생합니다. 이후부터는 Cache Hit 또는 Stale 상태가 됩니다.

일반적인 웹 사이트에서 사용자의 대부분의 방문은 **Cache Hit** 상태입니다.
서버 데이터가 변경되는 빈도보다 사용자가 방문하는 빈도가 훨씬 높기 때문입니다.

---

## 해시 기반 캐시 무효화

SWR 패턴에서 "캐시 데이터가 최신인지"를 어떻게 판단할까요? 이 문제의 해답이 **<Term id="hash">해시</Term> 비교**입니다.

### 해시란?

해시는 데이터의 **지문**입니다.
같은 데이터는 항상 같은 해시를 만들고, 데이터가 한 글자라도 바뀌면 완전히 다른 해시가 생성됩니다.

```
"안녕하세요"  → SHA-256 → "a1b2c3d4..."
"안녕하세요!" → SHA-256 → "x9y8z7w6..."  (완전히 다름)
"안녕하세요"  → SHA-256 → "a1b2c3d4..."  (항상 동일)
```

### 무효화 방식 비교

캐시가 오래되었는지 판단하는 방법은 여러 가지입니다.

| 방식 | 원리 | 장점 | 단점 |
|------|------|------|------|
| **타임스탬프** | 일정 시간 경과 후 만료 | 단순한 구현 | 데이터가 안 변해도 만료됨 |
| **버전 번호** | 수동으로 버전 올리기 | 명확한 관리 | 사람이 직접 올려야 하므로 실수 가능 |
| **해시 비교** | 데이터 내용 기반 자동 판단 | 정확한 변경 감지 | 해시 계산 비용 (미미) |

해시 비교 방식이 가장 정확합니다.
데이터가 실제로 변경되었을 때만 캐시를 갱신하고, 변경되지 않았으면 불필요한 네트워크 요청을 하지 않습니다.

### 전체 흐름 시퀀스

아래 시퀀스 다이어그램은 첫 방문(Cold Start), 재방문(Cache Hit), 데이터 변경 후 방문(Stale)의 전체 흐름을 보여줍니다.

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/localstorage-swr-caching-pattern/hash-invalidation-light.png" alt="해시 비교 기반 캐시 무효화 시퀀스 - 첫 방문, 재방문, 데이터 변경 후 방문" />
      <img className="theme-dark" src="/images/posts/localstorage-swr-caching-pattern/hash-invalidation-dark.png" alt="" />
    </div>
    <figcaption>그림 3. 해시 비교 기반 SWR 캐싱의 전체 시퀀스</figcaption>
  </div>
</figure>

동작을 요약하면 다음과 같습니다.

1. 서버는 데이터의 SHA-256 해시를 미리 계산하여 HTML에 삽입합니다.
2. 브라우저는 localStorage에 저장된 캐시 해시와 서버 해시를 비교합니다.
3. **일치하면** → 캐시 그대로 사용합니다(네트워크 요청 0회).
4. **불일치하면** → 캐시로 먼저 화면을 표시하고, 백그라운드에서 새 데이터를 받아옵니다.

---

## 구현 예시

### 캐시 데이터 구조

localStorage에 저장되는 데이터는 다음과 같은 구조입니다.

```javascript
// localStorage 키: "i18n_ko"
{
  "hash": "a1b2c3d4e5f6...",          // 데이터의 SHA-256 해시
  "data": {                            // 실제 캐시 데이터
    "btn.save": "저장",
    "btn.cancel": "취소",
    "msg.success": "성공했습니다"
  },
  "timestamp": 1709251200000           // 저장 시각 (참고용)
}
```

### 핵심 코드

```javascript
const CACHE_PREFIX = 'i18n_';

/**
 * SWR 패턴으로 캐시 데이터를 로드한다.
 * @param {string} locale - 언어 코드 (ko, en)
 * @param {string} serverHash - 서버가 HTML에 삽입한 데이터 해시
 * @returns {object} 캐시 데이터 (빈 객체일 수 있음)
 */
function loadWithSWR(locale, serverHash) {
  const cacheKey = CACHE_PREFIX + locale;
  const cached = localStorage.getItem(cacheKey);

  // Cold Start: 캐시가 없음
  if (!cached) {
    fetchAndCache(locale, cacheKey);
    return {};
  }

  const cacheData = JSON.parse(cached);

  // Cache Hit: 해시 일치 → 그대로 사용
  if (cacheData.hash === serverHash) {
    return cacheData.data;
  }

  // Stale: 해시 불일치 → 캐시로 먼저 표시 + 백그라운드 갱신
  fetchAndCache(locale, cacheKey);
  return cacheData.data;
}
```

분기 로직은 단순합니다. 캐시가 없으면 서버에 요청하고, 캐시가 있으면 해시를 비교하여 일치하면 그대로, 불일치하면 캐시를 먼저 반환하면서 백그라운드 갱신을 시작합니다.

```javascript
/**
 * 서버에서 데이터를 받아 localStorage에 저장한다.
 * 비동기로 실행되므로 화면을 블로킹하지 않는다.
 */
async function fetchAndCache(locale, cacheKey) {
  try {
    const response = await fetch(`/api/i18n/messages?lang=${locale}`);
    const result = await response.json();

    localStorage.setItem(cacheKey, JSON.stringify({
      hash: result.hash,
      data: result.data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('캐시 갱신 실패:', error);
    // 실패해도 기존 캐시로 동작하므로 치명적이지 않다
  }
}
```

<div className="info-box">
  <strong>왜 fetch 실패가 치명적이지 않은가?</strong><br/>
  SWR 패턴에서 <code>fetchAndCache</code>는 백그라운드 갱신입니다.
  실패하더라도 기존 캐시 데이터로 정상 동작하며, 다음 방문 시 다시 갱신을 시도합니다.
  이것이 SWR의 강점입니다 — 네트워크 장애에도 견고하게 동작합니다.
</div>

### 사용 방법

```javascript
// HTML에서 서버가 삽입한 해시값
const serverHash = window.__i18nHash;
const locale = window.__i18nLocale;

// SWR 캐시 로드
const messages = loadWithSWR(locale, serverHash);

// i18next 초기화
i18next.init({
  lng: locale,
  resources: { [locale]: { translation: messages } }
});
```

서버는 HTML 렌더링 시 `window.__i18nHash`에 데이터의 SHA-256 해시(64자)만 삽입합니다.
전체 메시지 데이터가 아닌 해시값만 주입하므로 HTML 크기 증가는 무시할 수 있는 수준입니다.

---

## 적합한 상황과 부적합한 상황

이 패턴은 모든 데이터에 적합한 것은 아닙니다.
핵심 판단 기준은 **"잠깐 이전 데이터가 보여도 괜찮은가?"**입니다.

| 적합한 상황 | 부적합한 상황 |
|------------|-------------|
| 다국어 번역 메시지 | 실시간 주식 가격 |
| 설정/환경 데이터 | 채팅 메시지 |
| 메뉴 구조 데이터 | 결제 금액 |
| 코드 테이블 (공통 코드) | 재고 수량 |
| 자주 변하지 않는 참조 데이터 | 항상 최신이어야 하는 데이터 |

번역 메시지가 한 번의 방문 동안 이전 버전으로 보이는 것은 문제가 되지 않습니다.
하지만 결제 금액이 이전 값으로 보이는 것은 심각한 문제입니다.

### 장점

| 항목 | 설명 |
|------|------|
| **즉각적인 응답** | 캐시에서 즉시 로딩하므로 사용자가 기다리지 않습니다 |
| **네트워크 비용 절감** | Cache Hit 시 서버 요청 0회. 트래픽과 서버 부하가 감소합니다 |
| **오프라인 대응** | 네트워크가 불안정해도 캐시 데이터로 동작할 수 있습니다 |
| **점진적 갱신** | 사용자 경험을 해치지 않고 백그라운드에서 데이터를 갱신합니다 |
| **캐시 정확성** | 해시 비교로 데이터가 실제 변경되었을 때만 갱신합니다 |

### 단점과 완화 방안

| 단점 | 완화 방안 |
|------|----------|
| Stale 상태에서 짧은 순간 이전 데이터 표시 | 비동기 갱신 후 UI 자동 반영 또는 다음 페이지에서 최신 표시 |
| 단순 fetch보다 구현 복잡도 증가 | 핵심 로직이 약 30줄 수준으로 관리 가능 |
| localStorage 5MB 용량 한계 | 필요한 데이터만 캐시하여 용량 관리 |

---

## 주의사항

### localStorage의 한계

| 한계 | 설명 | 대응 방안 |
|------|------|----------|
| **5MB 용량 제한** | 도메인당 약 5MB만 저장 가능 | 캐시 데이터 크기 관리, 불필요한 데이터 제외 |
| **동기 API** | `getItem()`은 동기 실행. 대용량 데이터 시 UI 블로킹 가능 | 캐시 데이터 크기를 합리적으로 유지 |
| **문자열만 저장** | 객체는 `JSON.stringify()`/`JSON.parse()` 변환 필요 | 변환 비용은 미미하나 인지 필요 |
| **시크릿 모드** | 브라우저에 따라 제한될 수 있음 | `try-catch`로 예외 처리 |

### 보안 주의

localStorage는 JavaScript로 누구나 접근할 수 있습니다.
따라서 **민감한 데이터는 절대 저장하면 안 됩니다.**

| 구분 | 데이터 예시 |
|------|-----------|
| **저장 가능** | 다국어 번역 메시지, UI 설정(테마, 언어), 공개된 참조 데이터 |
| **저장 금지** | 인증 토큰(JWT), 비밀번호, 개인정보(이름, 연락처), API 키 |

서버에서 클라이언트로 전송하는 데이터에서도 내부용 정보를 걸러내야 합니다.
예를 들어, `_server.` 접두사를 가진 서버 내부 메시지는 블랙리스트 필터링으로 클라이언트에 노출하지 않습니다.

<div className="info-box">
  <strong>블랙리스트 필터링 예시</strong><br/>
  서버의 전체 메시지 중 <code>_server.</code>으로 시작하는 키(<code>_server.db.error</code>, <code>_server.audit.login</code> 등)는 클라이언트에 전송하지 않습니다.
  나머지 메시지만 REST API를 통해 제공합니다.
</div>

---

## 정리

| 개념 | 설명 |
|------|------|
| SWR | "가진 것을 먼저 보여주고, 뒤에서 새 것을 확인하는" 캐시 전략 |
| localStorage | 브라우저에 내장된 영구 저장소. SWR 캐시에 적합 |
| Cache Hit | 캐시 해시와 서버 해시 일치. 서버 요청 0회 |
| Stale | 해시 불일치. 캐시로 즉시 표시 + 백그라운드 갱신 |
| Cold Start | 캐시 없는 최초 상태. 서버에서 1회 요청 |
| 해시 비교 | 데이터 변경 여부를 정확히 판단. 불필요한 갱신 방지 |
| 보안 필터링 | 서버 내부 메시지를 블랙리스트로 클라이언트 미노출 |

이 패턴은 자주 변하지 않는 참조 데이터를 효율적으로 캐싱하기 위해 설계되었습니다.
캐시 히트 시 네트워크 요청이 0회이므로 사용자 경험과 서버 부하 모두에서 이점이 있습니다.
단, 항상 최신이어야 하는 데이터(결제 금액, 실시간 정보 등)에는 적합하지 않습니다.
**"잠깐 이전 데이터가 보여도 괜찮은가?"**가 이 패턴 적용 여부의 핵심 판단 기준입니다.

---

## 관련 글

- [Spring Boot에서 i18next로 다국어 구현하기](/blog/spring-boot-i18next-architecture) — 이 캐싱 패턴을 Spring Boot + Thymeleaf 환경의 다국어 아키텍처에 실제 적용한 전체 구현을 다룹니다. 서버 사이드 설계부터 클라이언트 초기화 스크립트까지 포함합니다.
