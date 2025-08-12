import Image from '../models/Image.js';
import resHandler from '../services/ResHandler.js';
import ImageService from '../services/ImageService.js';
import S3Service from '../services/S3Client.js';
import ApiError from '../services/ApiError.js';

export default class ImageController {
  static #imageService = new ImageService();
  static #s3client = new S3Service();

  // Get image url
  static async getImageUrl(req, res) {
    // Find image by its primary key
    const image = await Image.findByPk(req.params.id);
    if (!image) {
      throw new ApiError('Invalid image id', 404);
    }
    // Retrieve image url from amazon s3
    const url = ImageController.#s3client.getFile(image.name);
    // Return response
    return res.status(200).send(url);
  }

  // Upload image to amazon s3 and return image url and name
  static async uploadImage(req, res) {
    const file = req.file;
    // Upload image to S3 and get the file name
    const fileName = await ImageController.#s3client.uploadFile(
      file.buffer,
      file.mimetype,
    );
    // Retrieve image url from amazon s3
    const url = ImageController.#s3client.getFile(fileName);
    return resHandler(201, { url, name: fileName }, res);
  }

  // Create imageable and upload it to amazon s3
  static async uploadImageable(req, res) {
    const file = req.file;
    const imageableId = req.params.imageableId;
    const type = req.query.type;
    const capture = req.query?.capture;
    const image = await ImageController.#imageService.createImageable(
      imageableId,
      type,
      { file, capture },
    );
    return resHandler(201, image, res);
  }

  static async updateUserImg(req, res) {
    const file = req.file;
    const userId = req.user.id;

    // Delete old profile picture
    ImageController.#imageService.deleteImageableAndFile(userId, Image.USER);

    // Create a new user profile picture
    const newImage = await ImageController.#imageService.createImageable(
      userId,
      Image.USER,
      { file },
    );
    return resHandler(201, newImage, res);
  }

  static async deleteImage(req, res) {
    const imageableId = req.params.id;
    const imageableType = req.query.type;
    if (!imageableId) {
      throw new ApiError('Imageable Id parameter is required', 400);
    }
    if (!imageableType) {
      throw new ApiError('Type query is required', 400);
    }
    let message;
    if (imageableType === 'ARTICLE') {
      message = ImageController.#imageService.deleteImageable(
        imageableId,
        imageableType,
      );
    } else if (imageableType === 'USER') {
      message = 'Use the /image/user PUT endpoint to update the user image';
    }

    return resHandler(200, message, res);
  }
  static async deleteImagePermenanetally(req, res) {
    const name = req.params.name;
    const type = req.query.type;
    if (!name) {
      throw new ApiError('Name parameter is required', 400);
    }
    if (!type) {
      throw new ApiError('Type query is required', 400);
    }
    await ImageController.#s3client.deleteFile(name);
    await Image.destroy({ where: { name, imageableType: type }, force: true });
    return resHandler(204, '', res);
  }

  static async getImage(req, res) {
    const name = req.params.name;
    return this.s3Service.getFile(name);
  }
}
