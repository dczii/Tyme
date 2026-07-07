---
name: tyme-seo
description: Tyme's SEO/GEO system — src/lib/seo.ts as the single source of truth for features/FAQ copy and JSON-LD, plus metadata, robots, sitemap, and llms.txt. Use when editing landing-page copy, meta tags, Open Graph images, structured data, FAQ questions/answers, canonical URLs, or anything findability-related.
---

# Tyme SEO / GEO

## The one rule: seo.ts is the single source of truth

[src/lib/seo.ts](src/lib/seo.ts) exports:
- `SITE_URL` — ⚠️ currently the **placeholder `https://tyme.app`**. It feeds canonical, Open Graph, sitemap, robots, and every JSON-LD url. Replace it once when the real domain exists; nothing else needs touching.
- `productFeatures[]` — icon name (string, mapped to lucide components in FeatureShowcase), `title`, `description` (card copy), and `feature` (full sentence for the schema featureList).
- `faqItems[]` — question/answer pairs.
- `structuredData[]` — three JSON-LD schemas (SoftwareApplication with featureList + free Offer, WebSite, FAQPage) built FROM the two arrays above.

Both the **visible landing sections** (FeatureShowcase, FaqShowcase) and the **JSON-LD** render from these same arrays, so on-page copy and structured data can never drift — which Google FAQ rich results and AI answer engines require. **Never hardcode feature/FAQ copy in components; edit seo.ts.** Adding a FAQ item? Also add a matching entry to `FAQ_META` in FaqShowcase (it falls back gracefully, but the tag/icon will be generic).

## Where things render

- JSON-LD: `<script type="application/ld+json">` tags in the root [layout.tsx](src/app/layout.tsx) body, via `dangerouslySetInnerHTML` over `structuredData`.
- Meta: the `metadata` export in layout.tsx — title/description tuned to "time tracking app for freelancers & virtual assistants", `metadataBase: new URL(SITE_URL)`, canonical `/`, OG + Twitter cards with `/og-image.png` (in `public/`, sourced from `assets/logo_512.png`), SVG favicon with `?v=1` cache-buster, `themeColor #0c0806`.
- FAQ answers must remain **fully rendered in the SSR HTML** (they are — `<dd>` always visible in FaqCard). Never hide answers behind interaction or JS-only rendering; that breaks the rich-results mirror.

## Robots & sitemap (Next metadata routes)

- [src/app/robots.ts](src/app/robots.ts): allow `/`, **disallow `/calendar`, `/reports`, `/settings`** (auth-gated app shares the marketing metadata — keep it out of the index). Points at `${SITE_URL}/sitemap.xml`.
- [src/app/sitemap.ts](src/app/sitemap.ts): single entry for `/` (weekly, priority 1). Add entries here if public pages are ever added.

## GEO (AI answer engines)

[public/llms.txt](public/llms.txt) is a hand-written plain-text product summary (what/features/audience/pricing/FAQ) served at `/llms.txt`. When features or FAQ change in seo.ts, **update llms.txt to match** — it is not generated.

## Landing-page HTML hygiene

- `SectionComment` in [page.tsx](src/app/page.tsx) injects real HTML comments (`<div hidden dangerouslySetInnerHTML>`) so section labels survive to View-Source — JSX comments don't.
- Headings, steps, and cards on `/` are plain server-rendered markup; animations only layer opacity/transform on top (see tyme-landing-animations rule 3).
- Keyword targets baked into copy: "time tracking app", "freelancers", "virtual assistants", "billable hours", "Clockify alternative". Keep new copy in that register.
