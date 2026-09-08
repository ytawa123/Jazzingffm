// GENERATED compatibility selector for direct static article pages.
(function() {
  const slug = "mustermann-jazzing1";
  const articles = window.JAZZING_ARTICLES || [];
  const index = articles.findIndex(function(article) {
    return article.slug === slug;
  });

  if (index > 0 && window.location.pathname !== "/" && window.location.pathname !== "/index.html") {
    const article = articles.splice(index, 1)[0];
    articles.unshift(article);
  }
})();
