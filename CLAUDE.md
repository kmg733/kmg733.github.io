# Blog Project Guide

Next.js 기반 개인 블로그 프로젝트 (`kmg733.github.io`)

## 기술 스택

- **Framework**: Next.js 16 (App Router, SSG)
- **Language**: TypeScript
- **MDX**: next-mdx-remote v6 (RSC)
- **Code Highlighting**: rehype-pretty-code + Shiki
- **Styling**: Tailwind CSS + globals.css

## 블로그 포스트 작성 규칙

### 파일 구조

```
content/posts/{slug}.md          ← 포스트 본문 (MDX)
public/images/posts/{slug}/      ← 포스트 이미지 디렉토리
public/images/thumbnails/        ← 카테고리 썸네일
```

### Frontmatter 필수 필드

```yaml
---
title: "포스트 제목"
date: "YYYY-MM-DD"
category: "카테고리명"
description: "SEO 설명"
thumbnail: "/images/thumbnails/{category}-{theme}.{ext}"
glossary:
  - id: "term-id"
    term: "용어"
    description: "설명"
---
```

### 다이어그램/이미지 규칙

> **다이어그램은 반드시 사전 렌더링된 PNG 이미지를 사용한다.**
> Mermaid 런타임 렌더링(클라이언트 JS)은 사용하지 않는다.

#### 이미지 생성 워크플로우

1. **Mermaid MCP 서버**로 다이어그램 렌더링
2. **light/dark 쌍**으로 PNG 저장
3. MD 파일에서 `<figure>` 패턴으로 삽입

#### Mermaid MCP 렌더링 설정

| 항목 | Light 버전 | Dark 버전 |
|------|-----------|----------|
| **theme** | `default` | `dark` |
| **background** | `white` | `#1e1e2e` |
| **format** | `png` | `png` |
| **scale** | `2` | `2` |
| **width** | `900` (기본) | `900` (기본) |

#### Mermaid 작성 주의사항

- 줄바꿈: `\n` 대신 `<br/>` 사용
- 괄호: `()` 직접 사용 가능 (HTML 엔티티 불필요)
- 노드 스타일: `style` 지시어로 light/dark 각각 색상 지정
- dark 버전 노드 색상: 어두운 톤 + `color:#e0e0e0` (밝은 텍스트)

#### 이미지 네이밍 컨벤션

```
{설명}-light.png    ← 라이트 모드용
{설명}-dark.png     ← 다크 모드용
```

- 테마별 이미지: 항상 `-dark` / `-light` 접미사 쌍으로 생성
- 접미사 없는 파일: 테마 무관 이미지 (스크린샷 등)
- 한쪽만 접미사 붙이는 것 금지

#### 이미지 삽입 패턴 (필수)

```html
<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img className="theme-light" src="/images/posts/{slug}/{name}-light.png" alt="설명" />
      <img className="theme-dark" src="/images/posts/{slug}/{name}-dark.png" alt="설명" />
    </div>
  </div>
  <figcaption>캡션 텍스트</figcaption>
</figure>
```

#### 다크/라이트 전환 원리

- CSS `display` 토글 방식 (`.theme-light` / `.theme-dark` 클래스)
- `.dark` 클래스가 루트 HTML에 있으면 다크 모드 활성화
- 구현 위치: `src/app/globals.css` (`.prose figure` 스타일 영역)

### MDX 컴포넌트

| 컴포넌트 | 용도 | 사용법 |
|---------|------|--------|
| `Term` | 용어 툴팁 표시 | `<Term id="term-id">표시 텍스트</Term>` |
| `CodeBlock` | 코드 하이라이팅 (자동) | ` ```lang ` 코드블록 |

### 금지 사항

- ❌ Mermaid 런타임 렌더링 (클라이언트 JS 의존성)
- ❌ `blockJS: false` 옵션 (next-mdx-remote 보안 우회)
- ❌ `<img>` 태그에 한쪽 테마만 제공
- ❌ 이미지 없이 텍스트만으로 다이어그램 표현

## 빌드 및 배포

```bash
npm run dev          # 개발 서버
npx next build       # 프로덕션 빌드 (SSG)
```

## 브랜치 전략

- **develop**: 기본 브랜치 (PR 타겟)
- **feature/***: 기능 개발 브랜치
- **main**: 배포 브랜치
