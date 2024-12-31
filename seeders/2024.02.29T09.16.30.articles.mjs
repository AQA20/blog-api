import { readFileAsync } from '../utils/fsUtils.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleAsyncError } from '../utils/handleErrors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fullPath = path.join(__dirname, '/samples/articles.json');

export const up = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  // Read articles sample file
  let articleSamples = await readFileAsync(fullPath);
  // Parse json data to js object
  articleSamples = JSON.parse(articleSamples);

  articleSamples = articleSamples.articles;

  await sequelize.transaction(async (transaction) => {
    // Fetch categories from database
    const categories = await queryInterface.select(null, 'Categories', {
      attributes: ['id'],
    });
    // Make sure there are enough categories for the articles
    if (categories.length < articleSamples.length) {
      throw new Error(
        `Categories have ${categories.length} items which is less than the items in articles ${articleSamples.length},
      please add ${articleSamples.length - categories.length} more categories or more`,
      );
    }

    // Retrieve admin role
    const [role] = await queryInterface.select(null, 'Roles', {
      where: { name: 'Admin' },
      attributes: ['id'],
    });

    // Retrieve user id from user_roles
    const [userRole] = await queryInterface.select(null, 'UserRoles', {
      where: { roleId: role.id },
      attributes: ['userId'],
    });

    // Get articles ready for bulk inserting
    const processedArticles = articleSamples.map((article, index) => {
      // Assign required column author_id
      article.authorId = userRole.userId;

      // Add required category_id
      article.categoryId = categories[index].id;

      return article;
    });

    // Bulk insert articles
    await queryInterface.bulkInsert('Articles', processedArticles);
  });
});
export const down = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  // Bulk Delete articles from database
  await queryInterface.bulkDelete('Articles', null, {});
});
