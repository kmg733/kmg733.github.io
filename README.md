# Portfolio & Blog

Next.js + TypeScript로 만든 개인 포트폴리오 및 블로그 사이트입니다.

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blog**: Markdown/MDX
- **Deployment**: GitHub Pages

## 프로젝트 구조

```
├── content/
│   └── posts/           # 블로그 포스트 (.md, .mdx)
├── src/
│   ├── app/
│   │   ├── blog/        # 블로그 페이지
│   │   ├── projects/    # 프로젝트 페이지
│   │   ├── about/       # About 페이지
│   │   └── layout.tsx   # 공통 레이아웃
│   ├── data/
│   │   └── projects.ts  # 포트폴리오 데이터
│   └── lib/
│       └── posts.ts     # 블로그 유틸리티
└── .github/
    └── workflows/
        └── deploy.yml   # GitHub Pages 배포
```

## 개발 시작

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 블로그 글 작성

`content/posts/` 디렉토리에 `.md` 또는 `.mdx` 파일을 추가합니다.

```markdown
---
title: "포스트 제목"
date: "2025-01-12"
description: "포스트 설명"
tags: ["tag1", "tag2"]
---

본문 내용
```

## 배포

`main` 또는 `develop` 브랜치에 푸시하면 GitHub Actions를 통해 자동 배포됩니다.

### GitHub Pages 설정

1. Repository Settings → Pages
2. Source: "GitHub Actions" 선택
