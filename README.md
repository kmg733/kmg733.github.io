# Manuel's Blog

[English](./README_EN.md)

https://kmg733.github.io

Next.js 16 + TypeScript + Tailwind CSS로 구축한 개인 기술 블로그.

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Framework** | Next.js 16 (App Router, Static Export) |
| **Language** | TypeScript 5, React 19 |
| **Styling** | Tailwind CSS 4, @tailwindcss/typography |
| **Content** | MDX (next-mdx-remote), gray-matter, remark-gfm, rehype-slug |
| **Testing** | Jest 30, Testing Library |
| **CI/CD** | GitHub Actions → GitHub Pages |

## 아키텍처

Clean Architecture 패턴 적용:

```
Presentation (Components, Pages)
    ↓
Application (Services)
    ↓
Domain (Types, Interfaces)
    ↓
Infrastructure (Repositories)
```

### 계층별 역할

| 계층 | 디렉토리 | 역할 |
|------|----------|------|
| **Presentation** | `app/`, `components/` | 페이지, UI 컴포넌트 |
| **Application** | `services/` | 비즈니스 로직 (`PostService`, `ProjectService`) |
| **Domain** | `types/`, `interfaces/` | 타입 정의, 인터페이스 계약 |
| **Infrastructure** | `repositories/` | 데이터 접근 (`FilePostRepository`, `StaticProjectRepository`) |

### 주요 패턴

- **Repository 패턴** - `IPostRepository`, `IProjectRepository` 인터페이스로 데이터 접근 추상화
- **DI Container** - `lib/container.ts`에서 의존성 조립
- **Custom Hooks** - `useSearch` (검색), `useKeyboardShortcut` (단축키), `useFocusTrap` (모달 포커스)
- **Context API** - `GlossaryProvider`로 용어사전 상태 관리

## 프로젝트 구조

```
├── content/
│   ├── posts/              # 블로그 포스트 (.md, .mdx)
│   └── TAXONOMY.md         # 분류 체계 가이드
├── src/
│   ├── app/                # 페이지 (blog, projects, about)
│   ├── components/         # UI 컴포넌트
│   │   ├── glossary/       #   용어사전 (Provider, Section, Term)
│   │   ├── SearchModal     #   전문 검색 (Cmd+K)
│   │   ├── TableOfContents #   목차 (스크롤 추적)
│   │   ├── BlogFilter      #   카테고리/검색 필터
│   │   ├── ImageLightbox   #   이미지 확대 뷰어
│   │   └── ThemeToggle     #   다크/라이트 토글
│   ├── services/           # 비즈니스 로직
│   ├── repositories/       # 데이터 접근 계층
│   ├── interfaces/         # 인터페이스 정의
│   ├── types/              # 타입 정의
│   ├── hooks/              # 커스텀 훅
│   ├── lib/                # 유틸리티 (TOC, glossary, DI container)
│   └── utils/              # 헬퍼 (search)
├── __tests__/              # 테스트 (19개 파일)
└── .github/workflows/      # CI/CD (develop push → 자동 배포)
```

## 블로그 글 작성

`content/posts/`에 `.md` 또는 `.mdx` 파일 추가:

```markdown
---
title: "포스트 제목"
date: "2026-01-15"
description: "포스트 설명"
category: "개발"
subcategory: "JavaScript"
tags: ["guide", "intermediate"]
glossary:
  - term: "클로저"
    brief: "함수와 렉시컬 환경의 조합"
    detail: "외부 함수의 변수에 접근할 수 있는 내부 함수"
---

본문 (<Term id="클로저" />으로 용어사전 참조)
```

분류 체계 상세: [`content/TAXONOMY.md`](./content/TAXONOMY.md)

### 이미지 규칙

- 위치: `public/images/posts/{post-slug}/`
- 테마별 이미지: `-dark` / `-light` 접미사 쌍으로 생성
- 테마 무관: 접미사 없이

## 개발

```bash
npm install          # 의존성 설치
npm run dev          # 개발 서버 (localhost:3000)
npm run build        # 빌드
npm test             # 테스트
npm run test:coverage # 커버리지
```
