# Decision Atlas

Supply chain decisions explained for placements, from a two-minute gist to interview depth.

Topics sit on lines like a transit map, grouped by how far ahead each decision looks: **Plan**, **Design**, **Run** and **Protect**, plus a starter toolkit and **SAP in practice**. Every stop can be read at three depths (gist, how it works, deep dive) and ends with an interview kit.

## Run it

```
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

Node 22.12 or newer.

## Where things live

| Path | What it holds |
|---|---|
| `src/data/atlas.ts` | The map: zones, lines, stops and prep paths |
| `src/content/stations/*.mdx` | One file per written stop |
| `src/components/content/` | Building blocks for stops: `Level`, `KeyIdea`, `Example`, `Trap`, `Terms`, `SayIt`, `Q`, `InterviewKit` |
| `src/components/labs/` and `src/scripts/labs/` | Interactive labs (the maths is kept separate from the drawing code) |
| `src/styles/global.css` | Design tokens for the light, sepia and dark themes, plus reader preferences |
| `src/styles/station.css` | Stop pages: rail, levels, callouts, interview kit, labs |

## Adding a stop

1. Make sure the stop exists in `src/data/atlas.ts` (its `slug` and line).
2. Create `src/content/stations/<slug>.mdx` with this frontmatter:

```yaml
---
title: Safety stock & reorder points
line: inventory            # must match the line in atlas.ts
summary: One sentence that says what the decision is.
minutes: { gist: 2, how: 7, deep: 12 }
status: draft              # change to reviewed once every claim is checked
reviewed: 2026-10-20       # only with status: reviewed
keywords: [safety stock, reorder point]
connected: [eoq, service-levels]   # other stop slugs
sources:
  - text: "Author, A. (Year). Title. Publisher."
    url: "https://..."
---
```

3. Write the body as three `<Level>` blocks followed by an `<InterviewKit>`. Copy `safety-stock.mdx` as a template. Maths uses `$...$` and `$$...$$`.

The build fails on purpose if a stop names a line or a connected stop that is not on the map.

## Licence

Text and educational content: CC BY-NC 4.0. Code: MIT. See `LICENSE.md`.

Built by [Dhiraj Badshe](https://www.linkedin.com/in/dhiraj-badshe-748326202/).
