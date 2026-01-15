---
title: "Hello World - 첫 번째 블로그 포스트"
date: "2026-01-13"
description: "Next.js와 TypeScript로 만든 블로그의 첫 번째 포스트입니다."
category: "개발"
subcategory: "Next.js"
tags: ["tutorial", "beginner"]
---

<figure>
  <div className="figure-content">
    <div className="image-frame">
      <img src="/images/posts/hello-world/hello-world.png" alt="Hello World!" />
    </div>
    <figcaption>그림 1. 첫 번째 블로그 포스트</figcaption>
  </div>
</figure>

## Hello World!

이 글은 저의 첫 번째 블로그 포스트입니다.

코딩을 하다보니 특정 정보들에 대해서 기록해두고, 다른 사람과 공유하고 싶다고 생각했던적이 많았습니다.
그래서 개발정보 블로그 운영을 하겠다고 다짐했었지만, 회사일이 바쁘다는 핑계로 지금까지 블로그 운영을 미루어 왔습니다.
그리고 오늘! 마침내 바이브 코딩을 적극 활용해 `Next.js` 기반으로 블로그를 만들어 첫글을 게시하였습니다. 
이번 첫번째 글에서는 블로그를 `gh-pages`로 운영하려는 이유와 현재 블로그에 사용한 기술 스택에 대해 적어보겠습니다.

## gh-pages로 블로그를 운영하는 이유

gh-pages로 블로그를 운영하는 이유는 3가지가 있습니다.
  1. 블로그 디자인의 자율성
  2. 글 작성시마다 git commit 생성
  3. markdown 이용가능

첫번째 이유는, 디자인의 자율성입니다.
취업준비를 할때 Naver 블로그를 운영해봤습니다만, 디자인이 매우 제한적이고 제가 원하는 형태대로 사용하기에는 어려운 환경이었습니다.
티스토리 벨로그 등 여러가지 찾아보았지만 디자인에 제약이 없고, 처음부터 원하는 대로 만들 수 있는 `gh-pages`가 좋겠다고 생각하였습니다.

두번째 이유는, 글을 작성하거나 블로그를 꾸밀때마다 `git commit` 메시지가 생성된다는 점입니다.
회사에서는 `GitHub`대신 `GitLab`을 사용하고 있어서, 개인 프로젝트를 수행하지 않는 이상 `Github`의 잔디가 채워질 일이 없습니다. ㅠㅠ
블로그 글을 작성하면 `git commit`이 생성되니 저로써는 `gh-pages`를 블로그로 안쓸 이유가 없었습니다.

마지막 세번째 이유는, markdown 이용이 가능하다는 점입니다.
평소 개발하면서 공부하거나 기록할만한 것들을 `Obsidian`을 이용해 markdown 파일로 기록해 왔습니다.
블로그에서 글을 작성할때 markdown을 지원하면 `Obsidian`에 작성해 놓은 내용을 그대로 블로그에 사용할 수 있기 때문입니다.

## 블로그 구현

블로그를 구현한 방법에 대해서는 다른글에서 자세하게 작성해보겠습니다.
이번 글에서는 사용한 기술 스텍에 대해서만 간략하게 서술하겠습니다.

### 기술 스택

| 분류 | 기술 | 용도 |
|-----|-----|------|
| 프레임워크 | Next.js | React 기반 풀스택 프레임워크 |
| UI 라이브러리 | React | 컴포넌트 기반 UI 구축 |
| 언어 | TypeScript | 타입 안정성 보장 |
| 스타일링 | Tailwind CSS | 유틸리티 기반 CSS |
| 배포 | GitHub Pages | 정적 사이트 호스팅 |

### 주요 라이브러리

| 라이브러리 | 용도 |
|-----------|------|
| `next-mdx-remote` | 마크다운/MDX를 HTML로 렌더링 |
| `gray-matter` | 마크다운 frontmatter(메타데이터) 파싱 |
| `remark-gfm` | GitHub Flavored Markdown 지원 (테이블, 취소선 등) |
| `rehype-slug` | 헤딩에 ID 자동 추가 (목차 링크용) |
| `reading-time` | 글 읽기 시간 자동 계산 |
| `@tailwindcss/typography` | prose 클래스 기반 타이포그래피 스타일 |

### 개발 도구

| 도구 | 용도 |
|-----|------|
| Jest | 단위 테스트 |
| ESLint | 코드 린팅 |
| ts-jest | TypeScript 테스트 지원 |

### 마크다운 렌더링 흐름

현재 블로그는 `Next.js` 프레임워크를 기반으로, `gray-matter`로 마크다운 파일의 메타데이터를 파싱하고, `next-mdx-remote`로 본문을 HTML로 렌더링합니다.
우측에는 자동으로 생성된 목차(TOC)가 표시되어 긴 글에서도 원하는 섹션으로 쉽게 이동할 수 있습니다.

```
content/posts/hello-world.md (마크다운 파일)
              ↓
      gray-matter (frontmatter 파싱)
              ↓
      extractHeadings (h2, h3 추출 → 목차 생성)
              ↓
      next-mdx-remote (MDX → HTML 변환)
        ├── remark-gfm (테이블, 취소선 지원)
        └── rehype-slug (헤딩에 ID 추가)
              ↓
      @tailwindcss/typography (prose 스타일 적용)
              ↓
      브라우저 렌더링 (본문 + 우측 목차)
```

### 주요 기능

| 기능 | 설명 |
|-----|------|
| 목차 자동 생성 | h2, h3 헤딩을 추출하여 우측에 목차 표시 |
| 스크롤 추적 | 현재 읽고 있는 섹션이 목차에서 하이라이트 |
| 클릭 시 이동 | 목차 항목 클릭 시 해당 섹션으로 스크롤 |
| 읽기 시간 | 글 길이에 따른 예상 읽기 시간 자동 계산 |
| 다크모드 | 시스템 설정에 따른 자동 테마 전환 |

## 마무리

이렇게 마크다운을 활용할 수 있는 나만의 블로그를 구축해보았습니다.
앞으로 개발하면서 배운 내용들을 이 블로그에 기록하면서, 댓글, 검색 등 블로그 기능도 추가해 나갈 예정입니다.