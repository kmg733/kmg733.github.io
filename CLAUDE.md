# Blog Project Guide

Next.js 기반 개인 블로그 프로젝트 (`kmg733.github.io`)

## 기술 스택

- **Framework**: Next.js 16 (App Router) — 정적 내보내기(`output: "export"`)로 GitHub Pages 배포
- **UI**: React 19, Tailwind CSS (+ `@tailwindcss/typography`) + `globals.css`
- **Language**: TypeScript
- **MDX**: next-mdx-remote v6 (RSC)
- **코드 하이라이팅**: rehype-pretty-code + Shiki
- **마크다운 확장**: remark-gfm, rehype-slug, github-slugger (TOC/앵커 slug)
- **기타**: feed(RSS/Atom), @giscus/react(댓글), reading-time
- **테스트**: Jest + Testing Library

## 블로그 포스트 작성 규칙

### 파일 구조

```
content/posts/{slug}.md          # 포스트 본문 (MDX)
public/images/posts/{slug}/      # 포스트 이미지 (light/dark 쌍)
src/app/                         # App Router 페이지 + RSS(feed.xml)/Atom(atom.xml)
src/components/                  # UI 컴포넌트 (glossary/Term, CodeBlock, TableOfContents …)
src/{lib,repositories,services,types}/   # 데이터 로딩 · 도메인 계층
```

### Frontmatter 스키마

```yaml
---
# 필수
title: "포스트 제목"
date: "YYYY-MM-DD"
category: "카테고리명"                 # 예: "개발"
description: "SEO/목록용 설명"
tags: ["guide", "intermediate"]        # 문자열 배열

# 선택
subcategory: "Java"                    # 카테고리 하위 분류
series: "java-memory"                  # 시리즈 slug
seriesOrder: 1                         # 시리즈 내 순서
seriesTitle: "JVM 메모리"               # 글머리 연재 목록에 보이는 이름 (모든 편 동일)
relatedSlugs: ["other-slug"]           # 관련 글 수동 지정
comments: true                         # giscus 댓글 노출 여부

# 용어 툴팁 (선택)
glossary:
  - id: "term-id"                      # 앵커/툴팁 식별자
    term: "용어 표시명"
    brief: "툴팁에 뜨는 한 줄 설명"
    detail: "하단 용어 섹션의 상세 설명"
---
```

> - `readingTime`은 본문에서 자동 계산되므로 frontmatter에 넣지 않는다.
> - glossary 항목은 `description`이 아니라 **`brief`(툴팁) + `detail`(상세)** 두 필드를 쓴다.

### 다이어그램/이미지 규칙

> **다이어그램은 반드시 사전 렌더링된 PNG 이미지를 사용한다.**
> Mermaid 런타임 렌더링(클라이언트 JS)은 사용하지 않는다.

#### 쓰는 이미지와 쓰지 않는 이미지

- 본문 이미지는 정보를 담는 것만 쓴다: 다이어그램, 실제 스크린샷, 측정 결과 차트.
- 정보를 담지 않는 장식 이미지(글머리 대표 이미지, 카테고리 로고 등)와 AI 생성 이미지는 쓰지 않는다.
- 목록 썸네일은 제목 카드(`src/components/PostTitleCard.tsx`)가 frontmatter의 `title`·`subcategory`·`series`로 자동 생성한다. 썸네일 이미지를 따로 만들지 않는다.
- 새 하위 카테고리(`subcategory`)를 만들면 `src/lib/post-card-theme.ts`에 그 카테고리의 색을 추가한다. 빠뜨리면 테스트가 실패한다.

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

### MDX에서 쓸 수 있는 것

MDX에 등록된 컴포넌트는 `Term`과 코드블록용 `CodeBlock`(`pre` 매핑)뿐이다(`src/app/blog/[slug]/page.tsx`의 `components={{ Term, pre: CodeBlock }}`). 나머지 시각 요소는 `globals.css`가 스타일링하는 HTML + `className` 패턴으로 작성한다.

| 요소 | 형태 | 용도 |
|------|------|------|
| `Term` | `<Term id="term-id">표시 텍스트</Term>` | 용어 툴팁 (frontmatter glossary와 연동) |
| 코드블록 | ` ```lang ` | `CodeBlock`으로 자동 하이라이팅 |
| 이미지/다이어그램 | `<figure><div className="figure-content"><div className="image-frame">…</div></div></figure>` | 위 "이미지 삽입 패턴" 참고 |
| 정보 강조 | `<div className="info-box">…</div>` | 부연·팁 박스 |
| 주의 강조 | `<div className="warning-box">…</div>` | 경고·함정 박스 |
| 각주 | `문장.[^id]` + 글 끝 `[^id]: 출처, 확인 날짜` | 수치·직접 인용의 출처 (remark-gfm, 라벨은 `src/lib/mdx-options.ts`) |

> `figure`·`info-box`·`warning-box`는 컴포넌트가 아니라 `globals.css` 클래스 스타일이다. MDX 안에서 `className`으로 쓴다.

### 금지 사항

- ❌ Mermaid 런타임 렌더링 (클라이언트 JS 의존성)
- ❌ `blockJS: false` 옵션 (next-mdx-remote 보안 우회)
- ❌ `<img>` 태그에 한쪽 테마만 제공
- ❌ 이미지 없이 텍스트만으로 다이어그램 표현
- ❌ 정보를 담지 않는 장식 이미지·AI 생성 이미지 (썸네일 이미지 포함)

## 빌드 · 테스트 · 배포

```bash
npm run dev            # 개발 서버 (webpack)
npm run build          # 프로덕션 정적 빌드 (output: "export" → out/)
npm test               # Jest 테스트
npm run test:coverage  # 커버리지
npm run lint           # ESLint
```

- **정적 내보내기**: `next.config.ts`의 `output: "export"` → `out/` 생성. `transpilePackages: ["github-slugger", "feed"]`.
- **배포**: `.github/workflows/deploy.yml`로 GitHub Pages 자동 배포.
- **품질 게이트**: 변경 후 `npx next build` + `npm test`로 정적 생성·테스트 통과를 확인한다.

## 브랜치 전략

- **develop**: 기본 브랜치 (PR 타겟)
- **feature/***: 기능 개발 브랜치
- **main**: 배포 브랜치
