# Manuel's Blog

[한국어](./README.md)

https://kmg733.github.io

A personal technical blog built with Next.js 16, TypeScript, and Tailwind CSS. Clean Architecture based, with 30 test files covering 344+ tests.

## Tech Stack

| Area | Technology |
|------|-----------|
| **Framework** | Next.js 16 (App Router, Static Export) |
| **Language** | TypeScript 5, React 19 |
| **Styling** | Tailwind CSS 4, @tailwindcss/typography |
| **Content** | MDX (next-mdx-remote), gray-matter, remark-gfm, rehype-slug |
| **Testing** | Jest 30, Testing Library |
| **CI/CD** | GitHub Actions → GitHub Pages |

## Architecture

Clean Architecture pattern:

```
Presentation (Components, Pages)
    ↓
Application (Services)
    ↓
Domain (Types, Interfaces)
    ↓
Infrastructure (Repositories)
```

### Layer Responsibilities

| Layer | Directory | Role |
|-------|-----------|------|
| **Presentation** | `app/`, `components/` | Pages, UI components |
| **Application** | `services/` | Business logic (`PostService`, `ProjectService`) |
| **Domain** | `types/`, `interfaces/` | Type definitions, interface contracts |
| **Infrastructure** | `repositories/` | Data access (`FilePostRepository`, `StaticProjectRepository`) |

### Key Patterns

- **Repository pattern** - Data access abstraction via `IPostRepository`, `IProjectRepository`
- **DI Container** - Dependency assembly in `lib/container.ts`
- **Custom Hooks** - `useSearch` (search), `useKeyboardShortcut` (shortcuts), `useFocusTrap` (modal focus), `useCategoryFilter` (category filter), `useScrollPosition` (scroll position), `useInView` (viewport detection)
- **Context API** - `GlossaryProvider` for glossary state management
- **Related Posts** - Hybrid system: manual specification (`relatedSlugs`) + tag-based auto-recommendation

## Project Structure

```
├── content/
│   ├── posts/              # Blog posts (.md, .mdx)
│   └── TAXONOMY.md         # Taxonomy guide
├── src/
│   ├── app/                # Pages (blog, projects, about)
│   ├── components/         # UI components
│   │   ├── glossary/       #   Glossary (Provider, Section, Term)
│   │   ├── SearchModal     #   Full-text search (Cmd+K)
│   │   ├── TableOfContents #   TOC with scroll tracking
│   │   ├── BlogFilter      #   Category/search filter
│   │   ├── RelatedPosts    #   Related posts (manual+auto hybrid)
│   │   ├── PostThumbnail   #   Category thumbnails (dark/light)
│   │   ├── PostNavigation  #   Series prev/next navigation
│   │   ├── CategoryTree    #   Category tree (sidebar)
│   │   ├── ScrollReveal    #   Scroll-based reveal animations
│   │   ├── ImageLightbox   #   Image zoom viewer
│   │   └── ThemeToggle     #   Dark/Light toggle
│   ├── services/           # Business logic
│   ├── repositories/       # Data access layer
│   ├── interfaces/         # Interface definitions
│   ├── types/              # Type definitions
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities (TOC, glossary, DI container)
│   └── utils/              # Helpers (search)
├── __tests__/              # Tests (30 files, 344+ tests)
└── .github/workflows/      # CI/CD (develop push → auto deploy)
```

## Writing Posts

Add `.md` or `.mdx` files to `content/posts/`:

```markdown
---
title: "Post Title"
date: "2026-01-15"
description: "Post description"
category: "개발"
subcategory: "JavaScript"
tags: ["guide", "intermediate"]
thumbnail: "/images/posts/my-post/thumbnail-dark.png"
series: "Series Name"
seriesOrder: 1
relatedSlugs: ["other-post-slug"]
glossary:
  - term: "Closure"
    brief: "A combination of a function and its lexical environment"
    detail: "An inner function that has access to outer function variables"
---

Content (<Term id="Closure" /> to reference glossary)
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Post title |
| `date` | Yes | Publish date (YYYY-MM-DD) |
| `description` | Yes | Post description |
| `category` | Yes | Category (e.g., "개발", "일상") |
| `subcategory` | No | Subcategory (e.g., "JavaScript", "React") |
| `tags` | Yes | Tag array |
| `thumbnail` | No | Custom thumbnail image path |
| `series` | No | Series name (enables prev/next navigation) |
| `seriesOrder` | No | Order within series |
| `relatedSlugs` | No | Manually specified related post slugs |
| `glossary` | No | Glossary entry array |

### Related Posts

Hybrid recommendation system:

1. Posts manually specified via `relatedSlugs` are shown first (no subcategory restriction)
2. Remaining slots are filled with tag-based auto-recommendations from the same `subcategory`
3. Manually specified posts are excluded from auto-recommendations to prevent duplicates

Full taxonomy: [`content/TAXONOMY.md`](./content/TAXONOMY.md)

### Image Rules

- Location: `public/images/posts/{post-slug}/`
- Theme-aware images: create with `-dark` / `-light` suffix pair
- Theme-independent: no suffix

## Development

```bash
npm install          # Install dependencies
npm run dev          # Dev server (localhost:3000)
npm run build        # Build
npm test             # Tests
npm run test:coverage # Coverage
```
