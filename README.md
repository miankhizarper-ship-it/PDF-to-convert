# ORBITAL//CYBER

An immersive developer portfolio that fuses two design concepts into one system:
**Cybernetic** (neon accents, glitch typography, high-tech HUD interfaces) and
**Orbital** (3D wireframe spheres, orbital rings, floating particles, scroll-driven
motion). Built as a production Next.js application — not a static mockup.

> **This repository ships with clearly-labelled sample content.** Names, employers,
> clients, metrics and project links are placeholders so nothing is invented on your
> behalf. Everything editable lives in `src/data/*`; every placeholder is flagged with
> a `SAMPLE` chip in the UI until you replace it.

---

## Design system

| Token        | Value     | Use                                   |
| ------------ | --------- | ------------------------------------- |
| `void`       | `#08090C` | Page background                       |
| `panel`      | `#111318` | Secondary surfaces                    |
| `acid`       | `#D9FF63` | Neon lime — primary accent            |
| `volt`       | `#39FF88` | Electric green — success / live state |
| `iris`       | `#A855F7` | Electric purple — depth accent        |
| `frost`      | `#F5F5F5` | Main text                             |
| `ash`        | `#A1A1AA` | Muted text                            |

Typography: **Space Grotesk Variable** (display), **Inter Variable** (body),
**JetBrains Mono Variable** (HUD/technical). Fonts are self-hosted through
`@fontsource-variable/*` — no Google Fonts request at build or runtime.

## Tech stack

- **Next.js 16** (App Router, Turbopack) — routing, SSR/SSG, serverless API routes
- **React 19 + TypeScript** (strict, `noUncheckedIndexedAccess`)
- **Tailwind CSS v4** — CSS-first theme tokens in `src/app/globals.css`
- **Three.js + React Three Fiber** — the orbital hero (custom GLSL, no stock assets)
- **GSAP + ScrollTrigger** — reveals, SVG path drawing, page and loader choreography
- **lucide-react** — icons (brand marks are hand-drawn SVGs; lucide v1 dropped them)
- **MongoDB (Atlas) driver** — contact submissions
- **zustand** — discrete UI state (calm mode, palette, menu); per-frame data lives in a rAF bus instead
- **Vercel-ready** — zero-config deployment

## Quick start

```bash
npm install
cp .env.example .env.local   # then edit the values
npm run dev                  # http://localhost:3000
```

Production:

```bash
npm run build
npm run start
```

### Environment variables

| Variable                       | Required | Description                                                              |
| ------------------------------ | -------- | ------------------------------------------------------------------------ |
| `MONGODB_URI`                  | prod*    | Atlas SRV connection string (server-side only).                           |
| `MONGODB_DB`                   | –        | Database name (default `portfolio`).                                      |
| `MONGODB_COLLECTION`           | –        | Collection name (default `messages`).                                     |
| `CONTACT_FORM_SECRET`          | yes      | HMAC secret signing the anti-spam form token.                             |
| `NEXT_PUBLIC_SITE_URL`         | yes      | Public origin for canonical URLs, sitemap, OG tags.                       |
| `CONTACT_ALLOW_LOG_ONLY`       | –        | `"true"` accepts messages without a DB and logs them (dev does this by default; production refuses unless opted in). |
| `CONTACT_RATE_LIMIT_MAX`       | –        | Successful messages per window per IP (default `5`).                      |
| `CONTACT_RATE_LIMIT_WINDOW_MS` | –        | Rate-limit window (default `600000` = 10 min).                            |

\* Without `MONGODB_URI`, `POST /api/contact` returns **503 in production** rather
than pretending a message was stored. Set `CONTACT_ALLOW_LOG_ONLY=true` to log
instead; the UI then shows a visible "not persisted" notice.

### MongoDB Atlas setup

1. Atlas → *Database Access* → create a user with **read/write** on one database.
2. *Network Access* → allow your deployment's IPs (or `0.0.0.0/0` for serverless).
3. *Database → Connect → Drivers* → copy the SRV string into `MONGODB_URI`.
4. First successful insert creates `portfolio.messages`; indexes on `createdAt` and
   `email` are created automatically (failure to create them never blocks writes).

## Routes

| Route                | Rendering | Content                                                    |
| -------------------- | --------- | ---------------------------------------------------------- |
| `/`                  | Static    | Orbital hero, ticker, featured work, capabilities, CTA      |
| `/about`             | Static    | Bio, animated operator diagram, principles, profile data    |
| `/services`          | Static    | Six service modules + five-stage delivery rail              |
| `/skills`            | Static    | Keyboard-operable capability matrix with animated bars      |
| `/experience`        | Static    | Scroll-drawn timeline + education panel                     |
| `/projects`          | Static    | Filterable archive + stack-frequency panel                  |
| `/projects/[slug]`   | SSG       | Case study: problem → solution → outcome → features → links |
| `/contact`           | Dynamic   | Signed form + availability panel (token per request)        |
| `/api/contact`       | Serverless| Validated, rate-limited contact ingestion                   |
| `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, `og.png` | Static | SEO / PWA |

## The contact API — defence chain

`POST /api/contact` applies, in order of cost:

1. `Content-Type: application/json` + 12 KB body cap → `415` / `413`
2. **HMAC-SHA256 form token** — issued by the server component when `/contact`
   renders; rejects missing/tampered/expired tokens and submissions faster than a
   human could read the form (`400`)
3. **Abuse ceiling** — 4× the success budget per IP per window, counts every
   authenticated attempt → `429` + `Retry-After`
4. **Honeypot** — hidden `website` field; filled requests get a silent `200`
5. **Sanitisation** — NFKC normalisation, control/zero-width stripping, and
   *rejection* of markup (`<script …>`) and SQL/JS injection patterns → `422`
6. **Validation** — shared schema (`src/lib/validation.ts`) with per-field errors
7. **Success budget** — per-IP sliding window of stored messages → `429`
8. **Storage** — MongoDB insert; log-only fallback only when explicitly allowed

The signing secret and connection string never reach the client bundle; the smoke
test asserts this by scanning every file in `.next/static`.

## Animation & accessibility

- Boot loader counts to 100 and splits open into the hero (once per session).
- Hero: R3F scene with custom fresnel/lat-long shaders, orbital rings + satellites,
  1500-particle field; pointer-parallax and scroll-linked rise/scale/fade.
- Canvas renders **only while the hero is in view** (`frameloop: never` otherwise)
  and drops DPR under load (`regress` + `<AdaptiveDpr />`).
- No WebGL? An SVG/CSS orbital fallback renders instead (it also doubles as the
  boot poster). `public/og.png` is generated procedurally by `npm run og`.
- `prefers-reduced-motion` **and** a user-toggled *calm mode* (⌘K → "Toggle calm
  mode") disable all animation, the custom cursor and magnetic buttons.
- Keyboard: skip link, ⌘K command palette with full arrow/Enter/Esc support,
  tablist skills panel, focus-managed mobile menu, visible focus rings everywhere.
- Custom cursor and magnetic buttons are fine-pointer devices only.

## Performance notes

- The three.js/R3F/drei bundle is code-split: it is dynamically imported in the
  browser and never during SSR.
- Project artwork is **procedural SVG** (six seeded variants) — zero image payloads.
- Fonts are variable single-file woff2, subset per family.
- Scroll/pointer values travel through one shared rAF bus (`src/lib/scroll-bus.ts`)
  instead of React state, so nothing re-renders per frame.
- Static pages are prerendered; only `/contact` and `/api/contact` are dynamic.

## Editing your content

Everything personal lives in `src/data/`:

| File             | Contains                                            |
| ---------------- | --------------------------------------------------- |
| `site.ts`        | Name, role, headline, intro, email, socials, status |
| `about.ts`       | Bio paragraphs, principles, facts, focus            |
| `services.ts`    | Six service modules + delivery process              |
| `skills.ts`      | Skill groups, levels, notes, marquee                |
| `experience.ts`  | Timeline entries + education                        |
| `projects.ts`    | Case studies (drives cards, detail pages, sitemap)  |
| `navigation.ts`  | Nav items + command-palette actions                 |

Add a project by copying an object in `projects.ts` and changing the `slug`
(the route is generated from it). Leave `links[].href` empty to render a
"LINK PENDING" chip instead of a dead URL. Set `isSample: false` once an entry
describes real work and its `SAMPLE` chip disappears.

## Scripts

```bash
npm run dev         # dev server on 0.0.0.0:3000
npm run build       # production build (type-checked)
npm run start       # serve the production build
npm run typecheck   # tsc --noEmit
npm run og          # regenerate public/og.png (no dependencies)
npm run smoke       # end-to-end smoke test against a running server
npm run smoke:abuse # …plus the abuse-ceiling rate-limit test
```

### Smoke test

```bash
npm run build
CONTACT_ALLOW_LOG_ONLY=true npm run start &
npm run smoke
```

It verifies every route and status code, SEO/OG/JSON-LD output, the full contact
defence chain (token, tampering, timing, honeypot, sanitisation, validation,
rate limits with `Retry-After`) and that no server secret appears in the client
bundle. Latest run: **51/51 checks passed** (and **50/50** with `--abuse`).

## Deploying to Vercel

1. Push this repository and import it in Vercel (framework: Next.js, detected).
2. Add the environment variables above (Production + Preview).
3. Set `NEXT_PUBLIC_SITE_URL` to the deployment origin.
4. Deploy — all static routes prerender; `/api/contact` runs as a serverless function.

Security headers (CSP, HSTS, nosniff, frame/referrer policies) are applied in
production via `next.config.ts`.

## Structure

```
src/
├── app/                  # routes, layout, template (page transitions), api/contact
├── components/
│   ├── canvas/           # R3F scene, GLSL shaders, WebGL detection, SVG fallback
│   ├── sections/         # hero, cards, case study, timeline, form, CTA…
│   └── ui/               # cursor, loader, nav, palette, buttons, reveals, dividers
├── data/                 # ALL editable content (types + files)
└── lib/                  # gsap, motion, scroll bus, store, security, mongodb, seo
scripts/
├── generate-og.mjs       # dependency-free 1200×630 OG renderer
└── smoke-test.mjs        # end-to-end verification
```
