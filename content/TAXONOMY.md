# 블로그 분류 체계 (Taxonomy)

블로그 글 작성 시 참고하는 분류 체계입니다.

## Frontmatter 구조

```yaml
---
title: "글 제목"
date: "2026-01-15"
description: "글 설명"
category: "개발"           # 대분류 (필수)
subcategory: "Next.js"     # 소분류 (선택)
tags: ["tutorial"]         # 글 성격 태그 (선택)
---
```

## Category (대분류)

Obsidian `3_공부` 폴더 구조 기반입니다.

| Category | 설명 | 예시 |
|----------|------|------|
| `개발` | 프로그래밍, 기술 관련 | 코드, 아키텍처, 도구 |
| `주식` | 투자, 재테크 관련 | 분석, 전략, 회고 |
| `책` | 독서 기록 | 리뷰, 요약, 인사이트 |
| `일상` | 일상 기록 | 여행, 회고 |

## Subcategory (소분류)

Category별 하위 분류입니다.

### 개발

| Subcategory | 설명 |
|-------------|------|
| `Java` | Java, JVM 관련 |
| `JavaScript` | JS, Node.js 관련 |
| `TypeScript` | TypeScript 관련 |
| `Next.js` | Next.js 프레임워크 |
| `Spring Boot` | Spring 생태계 |
| `OpenSearch` | 검색엔진, Elasticsearch |
| `데이터베이스` | DB, SQL, NoSQL |
| `아키텍처` | 설계, 패턴, 클린 아키텍처 |
| `운영` | DevOps, 배포, 인프라 |
| `테스트` | TDD, 테스트 전략 |

### 주식

| Subcategory | 설명 |
|-------------|------|
| `분석` | 종목 분석, 시장 분석 |
| `전략` | 투자 전략, 포트폴리오 |
| `회고` | 투자 회고, 반성 |

### 책

| Subcategory | 설명 |
|-------------|------|
| `개발서적` | 기술 서적 |
| `경제경영` | 비즈니스, 재테크 서적 |
| `자기계발` | 자기계발 서적 |

## Tags (글 성격)

글의 유형과 특성을 나타냅니다. **선택 사항**입니다.

### 유형 태그

| Tag | 설명 | 사용 예시 |
|-----|------|----------|
| `tutorial` | 단계별 가이드 | "Next.js 블로그 만들기" |
| `til` | Today I Learned, 짧은 학습 기록 | "오늘 배운 Git 명령어" |
| `troubleshooting` | 문제 해결 과정 | "CORS 에러 해결" |
| `review` | 리뷰, 후기 | "클린 아키텍처 책 리뷰" |
| `guide` | 개념 설명, 가이드 | "REST API 설계 가이드" |
| `comparison` | 비교 분석 | "React vs Vue 비교" |
| `retrospective` | 회고 | "2024년 개발 회고" |

### 난이도 태그

| Tag | 설명 |
|-----|------|
| `beginner` | 입문자용 |
| `intermediate` | 중급자용 |
| `advanced` | 고급자용 |

### 시리즈 태그

| Tag | 설명 |
|-----|------|
| `series` | 시리즈물 |
| `part-1`, `part-2`, ... | 시리즈 순서 |

## 작성 예시

### 튜토리얼

```yaml
---
title: "Next.js 블로그 만들기 - 1편"
date: "2026-01-15"
description: "Next.js로 정적 블로그를 만드는 방법"
category: "개발"
subcategory: "Next.js"
tags: ["tutorial", "beginner", "series", "part-1"]
---
```

### TIL (짧은 학습 기록)

```yaml
---
title: "TypeScript 제네릭 타입 추론"
date: "2026-01-15"
description: "제네릭에서 타입 추론이 동작하는 방식"
category: "개발"
subcategory: "TypeScript"
tags: ["til"]
---
```

### 문제 해결

```yaml
---
title: "Next.js 빌드 시 hydration 에러 해결"
date: "2026-01-15"
description: "서버/클라이언트 불일치로 인한 hydration 에러 해결 방법"
category: "개발"
subcategory: "Next.js"
tags: ["troubleshooting"]
---
```

### 책 리뷰

```yaml
---
title: "클린 아키텍처 리뷰"
date: "2026-01-15"
description: "로버트 마틴의 클린 아키텍처를 읽고"
category: "책"
subcategory: "개발서적"
tags: ["review"]
---
```

## 주의사항

1. **category는 필수**, subcategory와 tags는 선택
2. subcategory는 category에 맞는 것만 사용
3. tags는 필요한 것만 1~3개 정도 사용
4. 새로운 subcategory 추가 시 이 문서 업데이트
