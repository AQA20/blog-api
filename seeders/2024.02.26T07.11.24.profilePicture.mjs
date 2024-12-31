import S3Service from '../services/S3Client.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { handleAsyncError } from '../utils/handleErrors.js';
import { readFileAsync } from '../utils/fsUtils.js';
import { Buffer } from 'buffer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fullPath = path.join(__dirname, '/images/profile-picture.jpeg');

const s3Service = new S3Service();

export const up = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  // read the file data
  const data = await readFileAsync(fullPath, null);
  // Create mimetype
  const mimetype = `image/${path.extname(fullPath).replace('.', '')}`;
  const fileUrl = await s3Service.uploadFile(Buffer.from(data), mimetype);

  // Select random user let it be the first one
  const [user] = await queryInterface.select(null, 'Users', {
    attributes: ['id'],
  });
  await queryInterface.insert(null, 'Images', {
    imageableId: user.id,
    imageableType: 'USER',
    name: fileUrl,
  });
});

export const down = handleAsyncError(async ({ context: { sequelize } }) => {
  const queryInterface = sequelize.getQueryInterface();
  // Select the first user
  const [user] = await queryInterface.select(null, 'Users', {
    attributes: ['id'],
  });
  const [image] = await queryInterface.select(null, 'Images', {
    where: { imageableId: user.id },
    attributes: ['name'],
  });
  await s3Service.deleteFile(image.name);
  await queryInterface.bulkDelete('Images', { imageableType: 'USER' }, null);
});
