# JazzingFfm article content

`content/articles/*.json` is now the single source of truth for article content.

The public website remains static. `scripts/build_site.py` converts these JSON files into the files the existing site already uses:

- `data/articles.js` for the SPA/homepage/listings
- `articles/<slug>.js` compatibility selectors for direct article URLs
- `/interviews/<slug>/index.html` or `/features/<slug>/index.html` for SEO-friendly static pages

The generator deliberately does **not** modify the existing gallery, lightbox, routing, transition, typography or localization JavaScript.

Gallery originals remain under `images/<slug>/`. The build creates optimized WebP copies under `images/web/<slug>/` (maximum 2200 px on the long edge) and publishes those smaller copies to the website. Keep listing the original JPEG paths in the article JSON; the generator maps them to the WebP copies automatically.

## Adding an article

Create one JSON file in `content/articles/`, add its original `.jpg`, `.JPG`, `.jpeg` or `.JPEG` images under `images/<slug>/`, and push the branch. GitHub Actions optimizes the images, runs the generator and commits the generated website files back to the same branch automatically.

For a local build, run these commands in order:

```bash
bash scripts/optimize_gallery_images.sh
python scripts/build_site.py
```

Required top-level fields:

- `slug`
- `version`
- `category` (`interviews` or `highlights`; highlights render under `/features/`)
- `categoryLabel.en/de`
- `title.en/de`
- `cardTitle.en/de`
- `cardSubtitle.en/de`
- `date.iso/en/de`
- `images`
- `caption.en/de`
- `excerpt.en/de`
- `imageLabel.en/de`
- `body.en/de` (trusted article HTML)
- `bio.en/de`
- `seo.description`
- `seo.headline`

Articles are sorted newest-first by `date.iso`, so the newest article automatically becomes the homepage lead article.

## Existing test articles

The two pre-migration Mustermann static HTML pages are intentionally treated as legacy pages and are not rewritten on the first generator run. Their runtime content is already supplied by the new central registry. Newly added articles are fully generator-managed from the start.
