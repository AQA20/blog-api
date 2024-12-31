import { handleAsyncError } from '../utils/handleErrors.js';
import createSlug from '../utils/createArticleSlug.js';

export const up = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  const articles = await queryInterface.select(null, 'Articles', {
    attributes: ['id', 'title'],
  });

  await Promise.all(
    articles.map(async (article) => {
      // Update the slug
      const slug = createSlug(article.title);
      await sequelize.query(
        `UPDATE Articles SET slug = '${slug}' WHERE id = ${article.id}`,
      );
    }),
  );
});
export const down = handleAsyncError(async ({ context: { sequelize } }) => {
  await sequelize.getQueryInterface().bulkUpdate('Articles', { slug: null });
});
