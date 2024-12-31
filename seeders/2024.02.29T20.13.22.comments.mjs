import { readFileAsync } from '../utils/fsUtils.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { handleAsyncError } from '../utils/handleErrors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fullPath = path.join(__dirname, '/samples/comments.json');

export const up = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  let commentSamples = await readFileAsync(fullPath);
  commentSamples = JSON.parse(commentSamples);
  await sequelize.transaction(async (transaction) => {
    // Fetch articles
    const articles = await queryInterface.select(null, 'Articles', {
      attributes: ['id', 'authorId'],
      order: [['id', 'ASC']],
    });

    // Prepare comment data
    const commentsData = articles.map((article, index) => ({
      content: commentSamples.comments[index], // Sample comment
      userId: article.authorId,
      articleId: article.id,
      status: 'Approved',
    }));

    // Insert comments in bulk
    await queryInterface.bulkInsert('Comments', commentsData);
  });
});
export const down = handleAsyncError(async ({ context: { sequelize } }) => {
  // Delete all comments from db
  await sequelize.getQueryInterface().bulkDelete('Comments', null, {});
});
