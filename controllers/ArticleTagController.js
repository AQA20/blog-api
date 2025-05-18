import ArticleTag from '../models/ArticleTag.js';
import resHandler from '../services/ResHandler.js';

export default class ArticleTagController {
  static async createArticleTag(req, res) {
    const tagId = req.params.tagId;
    const articleId = req.params.articleId;
    const [articleTag] = await ArticleTag.findOrCreate({
      where: {
        tagId,
        articleId,
      },
      paranoid: false,
    });
    if (articleTag?.deletedAt) {
      await Tag.restore({ where: { id: tagId } });
      await articleTag.restore();
    }
    return resHandler(201, articleTag, res);
  }
  static async updateArticleTag(req, res) {
    const id = req.params.id;
    const tagId = req.body?.tagId;
    const articleId = req.body?.articleId;
    await ArticleTag.update({ tagId, articleId }, { where: { id } });
    return resHandler(201, 'Tag updated successfully!', res);
  }
}
