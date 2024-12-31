import Image from '../models/Image.js';
import S3Service from './S3Client.js';

export default class ImageService {
  #s3Service = new S3Service();

  /**
   * Retrieves the URL of an image from S3 based on its ID.
   *
   * This function searches the provided `images` array to find the image object
   * that matches the provided `imageId`, then uses the image's name to fetch
   * the corresponding image from an S3 service.
   *
   * @param {Array} images - An array of image objects, each containing an `id` and a `name`.
   * @param {number} imageId - The ID of the image to retrieve.
   * @returns {string} - The URL of the image fetched from S3.
   *
   * @throws {Error} - If no image with the given `imageId` is found in the `images` array.
   *
   * @example
   * const imageUrl = imgService.getImageUrl(article.Images, article.thumbnailId);
   * console.log(imageUrl); // URL of the image fetched from S3
   */
  getImageUrl(images, imageId) {
    // Find the thumbnail (featured) image that matches the provided imageId
    const thumbnailImg = images.find((image) => image.id === imageId);

    // If the image is not found, throw an error
    if (!thumbnailImg) {
      throw new Error(`Image with ID ${imageId} not found`);
    }

    // Fetch and return the article's featured image from S3 using the image's name
    return this.#s3Service.getFile(thumbnailImg.name);
  }

  /**
   * Retrieves the URLs of multiple images from S3.
   *
   * This function takes an array of image objects, fetches the URL of each image
   * from S3 based on its name, and appends the URL to the image object as a new
   * property (`imgUrl`). The function then returns the modified array of images.
   *
   * @param {Array} images - An array of image objects, each containing at least a `name` property.
   * @returns {Array} - The same array of image objects, but each object now includes an `imgUrl` property
   *                    with the URL of the image fetched from S3.
   *
   * @example
   * const imagesWithUrls = imgService.getImageUrls(article.Images);
   * console.log(imagesWithUrls); // Array of image objects with `imgUrl` appended
   */
  getImageUrls(images) {
    // Map through the images array and fetch each image's URL from S3
    const imagesWithUrls = images.map((image) => {
      // Fetch each image URL from S3 using the image's name
      const imgUrl = this.#s3Service.getFile(image.name);

      // Append the fetched URL to the image object as `imgUrl`
      image.setDataValue('imgUrl', imgUrl);

      // Return the updated image object with the `imgUrl` property
      return image;
    });

    // Return the modified array of images, each with an `imgUrl` property
    return imagesWithUrls;
  }

  /**
   * Retrieves an image from the database using either an `imgId` or an `imageableId`.
   * The image is fetched based on the provided `type` (imageable type) and the specified attributes.
   *
   * The function first checks if an `imgId` is provided and, if so, finds the image by its primary key.
   * If `imgId` is not provided, it searches for the image using the `imageableId`.
   *
   * @param {number} imgId - The ID of the image to fetch (optional, either `imgId` or `imageableId` should be provided).
   * @param {number} imageableId - The ID of the imageable entity (e.g., Article, User) (optional if `imgId` is provided).
   * @param {Object} [options={ attributes: ['name'] }] - Optional parameters to define query behavior.
   * @param {string} options.type - The type of the imageable entity (e.g., `Article`, `User`).
   * @param {Array} options.attributes - The attributes to include in the result (default is `['name']`).
   * @returns {Object|null} - The image object matching the criteria, or `null` if no image is found.
   *
   * @throws {Error} - Throws an error if neither `imgId` nor `imageableId` is provided.
   *
   * @example
   * const image = await imageService.#getImageable(null, articleId, { type: 'Article' });
   * console.log(image); // Image associated with the article (based on imageableId)
   *
   * @example
   * const image = await imageService.#getImageable(123, null, { type: 'User', attributes: ['name', 'url'] });
   * console.log(image); // Image with ID 123 for a User
   */
  async #getImageable(
    imgId,
    imageableId,
    options = { attributes: ['name'], paranoid: true },
  ) {
    // Destructure values from options
    const { type, attributes, paranoid } = options;
    let imageableModel;

    // If imgId is provided, find image by its primary key (imgId)
    if (imgId) {
      imageableModel = await Image.findByPk(imgId, {
        where: { imageableType: type },
        attributes,
        paranoid,
      });
    } else if (imageableId) {
      // If imgId is not provided, find image by imageableId
      imageableModel = await Image.findOne({
        where: { imageableId, imageableType: type },
        attributes,
        paranoid,
      });
    } else {
      // Throw an error if neither imgId nor imageableId is provided
      throw new Error('Either imgId or imageableId must be provided');
    }

    return imageableModel;
  }

  /**
   * Validates the required parameters for creating an imageable.
   *
   * @param {number} imageableId - The ID of the imageable entity.
   * @param {string} type - The type of the imageable entity.
   * @param {Object} file - The image file object.
   * @param {Buffer} buffer - The image buffer.
   * @param {string} mimetype - The mimetype of the image buffer.
   * @throws {Error} If any required parameter is missing or invalid.
   */
  #validateParameters(imageableId, type, file, buffer, mimetype) {
    if (!imageableId) throw new Error('The imageableId argument is required.');
    if (!type) throw new Error('The type argument is required.');
    if (!file && !buffer)
      throw new Error('Either the file or buffer option is required.');
    if (buffer && !mimetype)
      throw new Error('The mimetype is required when buffer is provided.');
  }

  /**
   * Retrieves the file data from either the file object or buffer.
   *
   * @param {Object} file - The file object.
   * @param {Buffer} buffer - The image buffer.
   * @param {string} mimetype - The mimetype of the image.
   * @returns {Object} The file data containing `fileBuffer` and `fileMimetype`.
   */
  #getFileData(file, buffer, mimetype) {
    if (file) {
      return { fileBuffer: file.buffer, fileMimetype: file.mimetype };
    }

    // At this point, we are guaranteed that buffer is provided (because of validation)
    return { fileBuffer: buffer, fileMimetype: mimetype };
  }

  /**
   * Creates a new imageable (e.g., article, user) and uploads an image to S3.
   *
   * This function validates the required parameters (`imageableId`, `type`, and `file`),
   * uploads the image to S3, creates a new imageable record, and appends the image URL
   * to the record. It then returns the created imageable model with the image URL attached.
   *
   * @param {number} imageableId - The ID of the imageable entity (e.g., Article, User)
   * @param {string} type - The type of the imageable entity (e.g., 'Article', 'User').
   * @param {Object} options - Options containing the file and other optional properties.
   * @param {Object} options.file - The image file, containing `buffer` and `mimetype`.
   * @param {string} [options.imgLinkProperty='imgUrl'] - The property name to store the image URL (default is 'imgUrl').
   * @param {string} [options.capture=''] - Optional capture information for the image.
   *
   * @returns {Promise<Object>} The created imageable model with the image URL attached.
   *
   * @throws {Error} If any required parameter (`imageableId`, `type`, `file`) is missing.
   *
   * @example
   * const imageable = await imageService.createImageable(123, 'Article', { file: imageFile });
   * console.log(imageable.imgUrl); // The image URL attached to the imageable model
   */
  async createImageable(
    imageableId,
    type,
    { file, buffer, mimetype, imgLinkProperty = 'imgUrl', capture = null },
  ) {
    // Validate required parameters and ensure necessary properties are present
    this.#validateParameters(imageableId, type, file, buffer, mimetype);

    // Determine the file data and upload to S3
    const { fileBuffer, fileMimetype } = this.#getFileData(
      file,
      buffer,
      mimetype,
    );

    // Upload image to S3 and get the file name
    const fileName = await this.#s3Service.uploadFile(fileBuffer, fileMimetype);

    // Create the imageable record in the database
    const imageableModel = await Image.create({
      imageableId,
      imageableType: type,
      capture,
      name: fileName,
    });

    // Attach the image URL from S3 to the model
    const imgUrl = this.#s3Service.getFile(fileName);
    imageableModel.setDataValue(imgLinkProperty, imgUrl);

    return imageableModel;
  }

  /**
   * Retrieves an imageable (e.g., article, user) record from the database and appends
   * the corresponding image URL from S3.
   *
   * This function accepts either an image ID (`imgId`) or an `imageableId` to fetch the
   * imageable record. It then fetches the image URL from S3 and attaches it to the record.
   *
   * @param {number} imgId - The ID of the imageable primary key to associate the image with..
   * @param {number} imageableId - The ID of the imageable entity (e.g., Article, User) (optional, used when fetching by imageableId).
   * @param {Object} options - Options containing `type`, `imgLinkProperty`, and `attributes`.
   * @param {string} options.type - The type of the imageable entity (e.g., 'Article', 'User').
   * @param {string} [options.imgLinkProperty='imgUrl'] - The property name to store the image URL (default is 'imgUrl').
   * @param {Array} [options.attributes=['name']] - The attributes to retrieve for the image (default is `['name']`).
   *
   * @returns {Object} The imageable model with the image URL attached.
   *
   * @throws {Error} If `type` is not provided, or if neither `imgId` nor `imageableId` is provided.
   *
   * @example
   * const imageable = await imageService.getImageableWithImgUrl(123, null, { type: 'Article' });
   * console.log(imageable.imgUrl); // The image URL attached to the imageable model
   */
  async getImageableWithImgUrl(
    imgId,
    imageableId,
    { type, imgLinkProperty = 'imgUrl', attributes = ['name'], paranoid },
  ) {
    // Validate the type and ensure either imgId or imageableId is provided
    if (!type) throw new Error('The type option is required');
    if (!imgId && !imageableId)
      throw new Error('Either imgId or imageableId must be provided');

    // Fetch the imageable model based on imgId or imageableId
    const imageableModel = imgId
      ? await this.#getImageable(imgId, null, { type, attributes, paranoid })
      : await this.#getImageable(null, imageableId, {
          type,
          attributes,
          paranoid,
        });

    // Get the image URL from AWS S3 using the image name
    const imgUrl = this.#s3Service.getFile(imageableModel.name);

    // Attach the image URL to the imageable model
    imageableModel.setDataValue(imgLinkProperty, imgUrl);

    return imageableModel;
  }

  /**
   * Soft deletes an imageable record (e.g., article, user) from the database by its `imageableId` and `imageableType`.
   *
   * This function performs a soft delete by removing the image associated with the given `imageableId`
   * and `imageableType` from the `Image` table. The image is marked as deleted in the database, but it is not
   * physically removed, allowing for recovery or tracking of deleted images.
   *
   * @param {number} imageableId - The ID of the imageable entity (e.g., Article, User) whose image should be deleted.
   * @param {string} imageableType - The type of the imageable entity (e.g., 'Article', 'User').
   *
   * @returns {string} A message indicating the success of the operation.
   *
   * @throws {Error} If either `imageableId` or `imageableType` is missing.
   *
   * @example
   * const result = await imageService.deleteImageable(123, 'Article');
   * console.log(result); // "Image was successfully deleted!"
   */
  async deleteImageable(imageableId, imageableType) {
    // Validate that the required parameters are provided
    if (!imageableId || !imageableType) {
      throw new Error('Both imageableId and imageableType are required');
    }

    // Soft delete the image by destroying the record in the database
    await Image.destroy({ where: { imageableId, imageableType } });

    // Return a success message
    return 'Image was successfully deleted!';
  }

  /**
   * Deletes an imageable record from the database and removes the corresponding file from Amazon S3.
   *
   * This function first retrieves the image record associated with the given `imageableId` and `type`,
   * then deletes the image file from Amazon S3, and finally removes the image record from the database.
   *
   * @param {number} imageableId - The ID of the imageable entity (e.g., Article, User) whose image should be deleted.
   * @param {string} type - The type of the imageable entity (e.g., 'Article', 'User').
   *
   * @returns {string} A message indicating the success of the operation.
   *
   * @throws {Error} If either `imageableId` or `type` is missing, or if the image is not found.
   *
   * @example
   * const result = await imageService.deleteImageableAndFile(123, 'Article');
   * console.log(result); // "Article image was successfully deleted!"
   */
  async deleteImageableAndFile(imageableId, type) {
    // Validate that the required parameters are provided
    if (!imageableId || !type) {
      throw new Error('Both imageableId and type are required');
    }

    // Fetch the imageable record from the database by imageableId and type
    const image = await this.#getImageable(null, imageableId, {
      type,
      attributes: ['id', 'name'],
    });

    // Check if the image exists
    if (!image) {
      throw new Error('Image not found');
    }

    // Delete the image file from Amazon S3
    await this.#s3Service.deleteFile(image.name);

    // Delete the image record from the database
    await image.destroy();

    // Return a success message
    return `${type} image was successfully deleted!`;
  }
}
