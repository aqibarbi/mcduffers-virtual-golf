# McDuffers Virtual Golf: Website Redesign (practice project)

> **Unofficial practice redesign** of the [McDuffers Virtual Golf](https://mcdufferschq.com/) website (Mayville, NY). Not affiliated with or made for the business. Built to practice HTML, CSS and vanilla JavaScript.

Same content and pages as the original, new layout and styling. Plain HTML, CSS and vanilla JavaScript. No framework, no build step, no dependencies.

## Credits

Business name, text, logos, photos, phone number and booking/waiver links belong to McDuffers Virtual Golf. Original site: <https://mcdufferschq.com/>. This repository contains only the redesigned front end.

## Pages

`index.html`, `features.html`, `about.html`, `faq.html`, `waiver-safety-rules.html`, `location.html`, `gallery.html`, `testimonials.html`, `book-now.html`, `contact.html`, `sitemap.html`, `404.html`

## Project structure

```
.
├── *.html              # the 12 pages (root, so URLs stay /faq, /about ...)
├── assets/
│   ├── css/style.css   # all styles
│   ├── js/main.js      # drawer, submenu, slider, lightbox, dialogs, forms, reveal
│   ├── fonts/          # self-hosted variable fonts (woff2)
│   ├── img/            # images (AVIF first, WebP second, JPG fallback), logos, icons, og-image.jpg
│   └── docs/           # waiver PDFs (created by scripts/localize-assets.mjs)
├── scripts/            # localize-assets.mjs: one-off download of CDN files
├── favicon.ico, apple-touch-icon.png   # stay in root, browsers look for them there
├── _headers            # Netlify: security + cache headers, noindex
├── _redirects          # Netlify: old mcdufferschq.com URLs -> new pages
└── robots.txt, sitemap.xml
```

The header, nav and footer are repeated in every page. If you change a nav link, change it in all 12 files (VS Code: Find in Files, `Ctrl+Shift+H`).

## Improvements pass (audit -> fix)

| Found | Fix |
| --- | --- |
| **Bug:** Book Now plan cards never scrolled to the scheduler. `assets/js/main.js` returned early on pages without a slider, so that handler never ran. | Each feature is its own `init*()` function with its own guards. Chosen plan also gets `aria-current` + a ring. |
| No favicon, canonical, Open Graph / Twitter tags or structured data. Home title was just the brand name. | Per-page canonical + OG + Twitter card, favicon set, `assets/img/og-image.jpg`, JSON-LD (`SportsActivityLocation` on home, `BreadcrumbList` on inner pages), keyword title on home. |
| No `robots.txt`, `sitemap.xml`, redirects or headers. | Added all four (`_headers`, `_redirects`). Old `/about/faq` and `/about/rules-guidelines` 301 to the new pages. |
| Page weight: 1.6 MB on first load of the home page (4 PNG circles ~150 KB each, 400 KB JPG slides, no responsive images). | AVIF + WebP + JPG `<picture>` with 800 / 1200 / 1600 px `srcset`, PNG -> WebP, hero image preloaded, fonts preloaded. Home first load measured at ~0.7 MB (-56%). |
| Mobile drawer let keyboard focus escape into the page behind it. | Page content is `inert` while the drawer is open, focus moves into the drawer, Escape returns it to the toggle. |
| Without JS all four slides stacked on top of each other. | `html:not(.js)` shows slide 1 only. |
| Gallery lightbox: one photo at a time, no navigation. | Prev / next buttons, arrow keys, `1 / 2` counter. |
| Unselected rating stars failed 3:1 non-text contrast (WCAG 1.4.11). | Raised to a 3:1 colour. |
| Phone number and directions missing from the footer; no fast path to call or book on phones. | Footer phone + "Get directions". Mobile-only bottom bar (Call / Book online) appears after the hero. |
| Hard-coded copyright year, missing full stop. | Year set by JS (static fallback in HTML), text fixed. |
| Internal navigations were full cold loads. | Speculation Rules `prefetch` (Chromium, moderate eagerness). Ignored elsewhere. |
| Content popped in with no motion. | Subtle scroll reveal. Off when JS is off or `prefers-reduced-motion` is set, so nothing is ever hidden. |

## UI pass

CSS only. HTML and content are unchanged. All of it sits in the "UI pass" block near the end of `assets/css/style.css`.

| Where | Change |
| --- | --- |
| Inner page headers | Faint dimpled golf ball on the right. That half of the header was empty. |
| About and Book Now tiles | Lime arrow chip in the corner so they read as links. Book Now plan cards get a down arrow because they scroll to the scheduler. |
| Features | The Virtual Caddie row is tall, so its image is top-aligned. It used to float in the middle. |
| Real Life Courses | Flag marker before each course name. |
| Testimonials | Quote mark on each card. |
| Header (desktop) | Gets slimmer after scrolling. Page layout does not move. |
| Contact | Details card stays under the header while the form scrolls. |
| FAQ | Answers open and close with a height animation. Chromium only, other browsers snap open as before. |

Left out on purpose: numbers on the Features rows. The features are not steps, so numbering them would say something the content does not.

All motion is off under `prefers-reduced-motion`, and the new decoration is hidden in print.

Tested in Chromium at 1440, 768, 390 and 300 px: no horizontal overflow, no console errors, no failed local requests, plus checks for the slider, drawer, dock, lightbox, Book Now scroll and form error fallback. The UI pass was re-checked the same way (110 checks over the 12 pages), plus header slim/restore, FAQ animation, sticky contact card and the Book Now scroll. Lighthouse, Safari and Firefox were not run.

Optional extras you can remove without touching anything else: the bottom bar (`<nav class="dock">` in each page + the `.dock` CSS), the reveal (`data-reveal` attributes + `.reveal-on` CSS), the header golf ball (`.page-head::after`) and the tile arrow chips (`.tile::after`).

## Before it is public / known gaps

- **Placeholder URL.** Canonical, Open Graph, JSON-LD, `sitemap.xml` and `robots.txt` use `https://mcduffers-virtual-golf.netlify.app`. In VS Code use Find in Files and replace that string with your real deploy URL.
- **Gallery photos and the two waiver PDFs still load from the old site's CDN** (`cdn.cmsmax.cloud`, `media.cmsmax.cloud`). They break if the original site removes them. Run `node scripts/localize-assets.mjs` once (Node 18+). It saves the 2 photos as `.webp` in the project root and the 2 PDFs in `docs/`, then points `gallery.html` and `waiver-safety-rules.html` at the local copies. Commit the new files afterwards.
- **`_headers` sets `X-Robots-Tag: noindex`** so the practice copy stays out of search results. Remove that line only if the site is ever used for real.
- The CSP in `_headers` is a safe subset (no `script-src`) on purpose, so Acuity and Google Maps keep working. A strict CSP needs testing against both embeds.
- The original Privacy Policy page and cookie banner are not recreated. The original "Lessons" nav link pointed to an external site that no longer opens, so it is left out.

## Booking

The Book Now page embeds the original Acuity Scheduling widget in an iframe. The two plan cards (Weekday, Weekend) load that category inside the iframe, then scroll to it. Prices and times come from Acuity, not from this repo.

## Forms

Contact and testimonial forms use [Netlify Forms](https://docs.netlify.com/forms/setup/) (`data-netlify="true"` with a honeypot field). Submissions work only when the site is hosted on Netlify. Anywhere else the form shows "Could not send. Call 716-269-9003 instead."

## Deploy

Static site, so any static host works: publish the project root. `_headers` and `_redirects` are Netlify features.

- **Netlify:** connect the repo, build command empty, publish directory `.`
- **GitHub Pages:** serve from the `main` branch root (ignores `_headers` / `_redirects`)

## Screenshots for the portfolio

Scroll each page to the bottom before a full-page capture. Sections below the fold stay faded until they scroll into view (the reveal), so a capture taken straight after load shows them half transparent.

## Local preview

Open `index.html` in a browser, or use the Live Server extension in VS Code. Use a local server (not `file://`) to test `404.html` and the speculation rules.
