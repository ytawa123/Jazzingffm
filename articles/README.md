# Adding a new JazzingFfm article

The site now keeps layout, styling, application logic and article content separate.

## Add an article

1. Copy an existing file in this folder, for example `leo-mori.js`.
2. Rename it to the new slug, for example `markus-harm.js`.
3. Edit the article fields, translations, body text and image paths in that file.
4. Put its photos in `images/<slug>/`.
5. Add one `<script src="articles/<slug>.js"></script>` line in `index.html`, immediately before `js/app.js`. Article order in those script tags is also the listing/latest-article order.

You normally do **not** need to touch `css/style.css` or `js/app.js` when publishing a new article.
