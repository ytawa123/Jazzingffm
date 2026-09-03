# Adding a new JazzingFfm article

The site keeps layout, styling, application logic and article content separate.

## Add an article

1. Copy an existing file in this folder, for example `leo-mori.js`.
2. Rename it to the new slug, for example `markus-harm.js`.
3. Edit the article fields, translations and body text in that file.
4. Create the matching photo folder: `images/<slug>/`.
5. Name the photos consistently: `<slug>-01.jpg`, `<slug>-02.jpg`, `<slug>-03.jpg`, `<slug>-04.jpg`.
6. Put those exact paths in the article's `images` array.
7. Add one `<script src="articles/<slug>.js"></script>` line in `index.html`, immediately before `js/app.js`. Article order in those script tags is also the listing/latest-article order.

Example for Markus Harm:

```text
images/markus-harm/markus-harm-01.jpg
images/markus-harm/markus-harm-02.jpg
images/markus-harm/markus-harm-03.jpg
images/markus-harm/markus-harm-04.jpg
```

Use lowercase `.jpg` filenames so GitHub's case-sensitive paths match reliably.

You normally do **not** need to touch `css/style.css` or `js/app.js` when publishing a new article.

## Sitemap

Do not edit `sitemap.xml` manually. When a new public HTML page is merged, GitHub Pages rebuilds the sitemap and adds its URL automatically. Pages marked `noindex`, such as the Impressum and Datenschutz pages, stay out of the sitemap.
