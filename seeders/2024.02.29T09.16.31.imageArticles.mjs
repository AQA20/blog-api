import { readDirAsync } from '../utils/fsUtils.js';
import { fileURLToPath } from 'url';
import path from 'path';
import S3Service from '../services/S3Client.js';
import { handleAsyncError } from '../utils/handleErrors.js';
import { readFileAsync } from '../utils/fsUtils.js';
import { Buffer } from 'buffer';
import Image from '../models/Image.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesDir = path.join(__dirname, '/images');

const s3Service = new S3Service();

const getImageRemoteUrls = handleAsyncError(async () => {
  // Read images directory
  const imgFiles = await readDirAsync(imagesDir);
  // Get uploaded image urls
  const images = await Promise.all(
    imgFiles.map(async (image) => {
      // Ignore profile picture image as it
      // has been uploaded before in the profilePicture seed
      if (image !== 'profile-picture.jpeg') {
        // Get the image full path
        const imgPath = path.join(imagesDir, image);
        // read the file data
        const data = await readFileAsync(imgPath, null);
        // create mimetype using the imgPath and remove the .
        const mimetype = `image/${path.extname(imgPath).replace('.', '')}`;
        // Upload image to aws s3
        const name = await s3Service.uploadFile(Buffer.from(data), mimetype);
        return name;
      }
    }),
  );
  return images.filter((image) => image);
});

export const up = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  const names = await getImageRemoteUrls();
  await sequelize.transaction(async (transaction) => {
    const articles = await queryInterface.select(null, 'Articles', {
      attributes: ['id'],
      order: [['id', 'ASC']],
    });

    // Make sure there are enough images for the articles
    if (names.length < articles.length) {
      throw new Error(
        `Images have ${names.length} items which is less than the items in articles ${articles.length},
            please add ${articles.length - names.length} more images or more`,
      );
    }

    const newImages = articles.map((article, index) => {
      // Extract the image url
      const name = names[index];
      // Insert new image raw in images table
      return {
        imageableId: article.id,
        imageableType: Image.ARTICLE,
        name,
      };
    });

    await queryInterface.bulkInsert('Images', newImages, {
      where: { imageableType: Image.ARTICLE },
    });

    const createdImages = await queryInterface.select(null, 'Images', {
      where: { imageableType: Image.ARTICLE },
    });

    await Promise.all(
      articles.map(async (article, index) => {
        // Assign featured image of the article
        await sequelize.query(
          `UPDATE Articles SET thumbnailId = ${createdImages[index].id} WHERE id = ${article.id}`,
        );
      }),
    );
  });
});

export const down = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  await sequelize.transaction(async (transaction) => {
    // Fetch all Article images
    const articleImages = await queryInterface.select(null, 'Images', {
      where: { imageableType: Image.ARTICLE },
      attributes: ['name'],
    });

    const s3Service = new S3Service();
    // Delete each image from s3
    await Promise.all(
      articleImages.map(
        async (image) => await s3Service.deleteFile(image.name),
      ),
    );
    // Bulk Delete article images from database
    await queryInterface.bulkDelete('Images', {
      imageableType: Image.ARTICLE,
    });
  });
});
