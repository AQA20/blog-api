import db from '../config/databaseConnection.js';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import View from '../models/View.js';
import Share from '../models/Share.js';

export default class Metrics {
  /**
   * Updates or creates a unique metric for a specific article based on IP address or UUID.
   * This method ensures that metrics are tracked uniquely per user and per article within a 24-hour period.
   *
   * It uses a transaction to guarantee that the database operations are atomic: either both the
   * check and creation succeed, or neither do, ensuring data consistency.
   *
   * @param {object} model - The Sequelize model for the metric (e.g., View or Share).
   * @param {object} data - The data for the metric, including uuid, ipAddress, and articleId.
   * @returns {Promise<string>} A promise that resolves to the unique UUID of the metric,
   * either newly created or existing.
   * @throws {Error} If the ipAddress or articleId is not provided.
   */
  static async updateMetric(model, data) {
    const { uuid, ipAddress, articleId } = data;
    // Validate input parameters
    if (!ipAddress) {
      throw new Error('IpAddress is required');
    }
    if (!articleId) {
      throw new Error('Property articleId is required');
    }

    // Calculate the timestamp for 24 hours ago
    const twentyFourHoursAgo = new Date(new Date() - 24 * 60 * 60 * 1000);

    // Use transaction so if something went wrong it rolls back all database
    // operations, note we're automatically pass transactions to all queries in
    // server/config/databaseConnection.js so we don't need to manually pass it
    // to each query.
    return db.sequelize.transaction(async (t) => {
      // Check if the metric for this article and user (IP or UUID) already exists in the last 24 hours
      const existingMetric = await model.findOne({
        where: {
          articleId,
          [Op.or]: [{ ipAddress }, { uuid: uuid || '' }],
          createdAt: { [Op.gte]: twentyFourHoursAgo }, // Only consider metrics from the last 24 hours
        },
        transaction: t, // Ensure it's part of the transaction
      });

      if (existingMetric) {
        return existingMetric.uuid; // Return existing UUID if found
      }

      // If no existing metric, create a new one using "upsert" logic
      const uniqueId = uuidv4(); // Generate a new UUID

      try {
        /**
         * The `upsert` method is used to ensure atomicity and prevent race
         * conditions or deadlocks. It combines both insert and update
         * operations into a single query, ensuring that if the record exists,
         * it’s updated, and if not, a new one is inserted. This prevents issues
         * caused by concurrent requests trying to insert the same record and
         * simplifies the code by eliminating the need for extra queries or
         * transaction management, improving both performance and reliability.
         */
        await model.upsert(
          {
            articleId,
            ipAddress,
            uuid: uniqueId,
            createdAt: new Date(), // Ensure the timestamp is included
            updatedAt: new Date(), // Ensure the updatedAt timestamp is included
          },
          {
            transaction: t, // Ensure this is part of the transaction
          },
        );

        return uniqueId; // Return the newly created UUID
      } catch (error) {
        console.error('Error inserting/updating metric:', error);
        throw error;
      }
    });
  }

  /**
   * Deletes metrics for a specific article from both Views and Shares models.
   * This method is used to clean up metrics associated with an article, typically when an article is deleted.
   *
   * @param {string} articleId - The ID of the article whose metrics are to be deleted.
   * @param {object} transaction - Sequelize transaction object to ensure atomicity.
   * @throws {Error} If the articleId is not provided.
   */
  static async deleteMetrics(articleId, transaction) {
    if (!articleId) {
      throw new Error('Property articleId is required');
    }

    // Delete metrics associated with the article in both Views and Shares
    await View.destroy({
      where: { articleId },
      transaction,
    });
    await Share.destroy({
      where: { articleId },
      transaction,
    });
  }
}
