import Article from '../models/Article.js';
import Tag from '../models/Tag.js';
import ArticleController from './ArticleController.js';

export default class SitemapController {
  static async getSitemap(req, res) {
    const paginatedArticles = await ArticleController.paginatedArticles(req);
    const baseUrl = process.env.NEXT_JS_URL;
    // Generate page urls
    const pageUrls = [];
    for (let i = 1; i <= paginatedArticles.totalPages; i++) {
      pageUrls.push(`${baseUrl}/?page=${i}`);
    }
    // Retrieve all articles
    const articles = await Article.findAll({
      where: { deletedAt: null },
      attributes: ['slug', 'updatedAt'],
    });
    // Retrieve all tags
    const tags = await Tag.findAll({
      where: { deletedAt: null },
      attributes: ['name'],
    });

    // Generate the sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${`${baseUrl}`}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
      </url>
      ${pageUrls.map(
        (url) => `
            <url>
              <loc>${`${url}`}</loc>
              <lastmod>${new Date().toISOString()}</lastmod>
            </url>
          `,
      )}
      <url>
        <loc>${`${baseUrl}/search`}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
      </url>
      ${articles
        .map((article) => {
          return `
            <url>
              <loc>${`${baseUrl}/${article.slug}`}</loc>
              <lastmod>${new Date(article.updatedAt).toISOString()}</lastmod>
            </url>
          `;
        })
        .join('')}
      <url>
        <loc>${`${baseUrl}/tags`}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
      </url>
      ${tags
        .map((tag) => {
          let tagSlug = tag.name.split(' ').join('-');
          return `
            <url>
              <loc>${`${baseUrl}/tags/${tagSlug}`}</loc>
              <lastmod>${new Date().toISOString()}</lastmod>
            </url>
          `;
        })
        .join('')}
    </urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.send(sitemap);
  }
}
