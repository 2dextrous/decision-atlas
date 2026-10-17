# Decision Atlas

A public placement-prep site: supply chain decisions explained from a two-minute gist to interview depth, laid out as a transit map. Static Astro 7 site, deployed on Vercel from `main` of github.com/2dextrous/decision-atlas.

## Commands
- `npm run dev`: dev server on http://localhost:4321 (also in `.claude/launch.json` as `decision-atlas`).
- `npm run build`: static build to `dist/`. Must pass before every commit. It fails on purpose when a stop names an unknown line or connected stop.

## Public site: ask first
Every push to `main` redeploys the live site. Ask the owner before pushing. Never publish content as "reviewed": only the owner changes a stop's `status` to `reviewed` after checking it.

## Structure
- `src/data/atlas.ts`: zones (Start here, Plan, Design, Run, Protect, Execute in SAP), lines and stops. Stop slugs are unique; a stop on two lines is an interchange and keeps its primary line's URL.
- `src/content/stations/<slug>.mdx`: one written stop. Frontmatter schema is in `src/content.config.ts`. Body = three `<Level>` blocks (gist, how it works, deep dive) then `<InterviewKit>`. Copy `safety-stock.mdx` as the template.
- `src/components/content/`: Level, KeyIdea, Example, Trap, Terms, SayIt, Q, InterviewKit.
- `src/components/labs/` + `src/scripts/labs/`: interactive labs. Keep maths in a pure `*-math.ts` file (no DOM) so it can be checked from Node, and check it against the source numbers before shipping.
- `src/styles/global.css`: tokens for light, sepia and dark, reader preferences (`data-theme`, `data-size`, `data-font`, `data-spacing`, `data-width`, `data-depth`, `data-focus`, `data-motion` on `<html>`). `src/styles/station.css`: stop pages.

## Content rules
- The structure and wording are this site's own. Do not mirror Lyric's Decision Mesh categories or decision names, and do not name Lyric on the site. Never copy text from Prof. Deepak Nirmal's site.
- Write from the owner's notes (FTE Material docx, the ChatGPT transcript, the SAP process map) in plain, natural English. Every stop lists real sources; no invented citations, case studies or vendor claims.
- Vendor mentions stay generic and factual (what a category of tool does), never rankings.
- The SAP module may show the owner's Global Bike (GBI) training document numbers as "From my SAP practice".

## Design rules
- Line colours are validated for colour-vision separation in display order (`--t-*` tokens). Re-run the dataviz palette validator before changing any of them.
- Overpass draws "·" off-centre: use `<span class="sep">` for separators in UI text.
- `[hidden]` always wins (`display: none !important`), so use the `hidden` attribute to hide things.
- Text keeps the reading measure (`--measure`); labs and wide tables may go up to 880px.
- Astro 7 notes: Markdown uses the unified processor (needed for remark-math and rehype-katex); `compressHTML: true` keeps spaces between inline elements; the Rust compiler rejects invalid HTML nesting.
