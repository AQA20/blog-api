import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

export default class S3Service {
  // Set up AWS credentials as private property
  #credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  };

  // Create S3 client instance private property
  #s3Client = new S3Client(this.#credentials);

  async uploadFile(bufferData, mimetype) {
    try {
      // Create unique name (Because if the image name was exist before it will be overbidden by the new one)
      const uploadName = `${moment().valueOf()}_${uuidv4()}`;
      // Define parameters for PutObjectCommand
      const params = {
        Bucket: process.env.AWS_FILE_BUCKET, // Bucket name
        Key: uploadName, // File name
        Body: bufferData, // File Buffer data
        ContentType: mimetype, // File type
      };

      // Create PutObjectCommand instance
      const putObjectCommand = new PutObjectCommand(params);

      await this.#s3Client.send(putObjectCommand);
      return uploadName;
    } catch (error) {
      console.error('Error uploading file to S3', error);
      throw error;
    }
  }


  getFile(fileName) {
    return `${process.env.CLOUDFRONT_BASE_URL}/${fileName}`;
  }

  async deleteFile(fileName) {
    try {
      const params = {
        Bucket: process.env.AWS_FILE_BUCKET,
        Key: fileName,
      };

      // Create DeleteObjectCommand instance
      const deleteObjectCommand = new DeleteObjectCommand(params);
      return await this.#s3Client.send(deleteObjectCommand);
    } catch (error) {
      console.error('Error deleting a file from S3', error);
      throw error;
    }
  }
}
