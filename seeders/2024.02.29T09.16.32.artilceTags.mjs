import { handleAsyncError } from '../utils/handleErrors.js';

export const up = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  await sequelize.transaction(async (transaction) => {
    const articles = await queryInterface.select(null, 'Articles', {
      attributes: ['id'],
      order: [['id', 'ASC']],
    });
    const tags = await queryInterface.select(null, 'Tags', {
      attributes: ['id'],
      order: [['id', 'ASC']],
    });

    // Make sure there are enough tags for the articles
    if (tags.length < articles.length) {
      throw new Error(
        `Tags have ${tags.length} items which is less than the items in articles ${articles.length},
          please add ${articles.length - tags.length} more images or more`,
      );
    }

    const articleTags = articles.map((article, index) => {
      const articleTag = {};
      articleTag.tagId = tags[index].id;
      articleTag.articleId = article.id;
      return articleTag;
    });
    await queryInterface.bulkInsert('ArticleTags', articleTags);
  });
});
export const down = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.bulkDelete('ArticleTags', null, {});
});
