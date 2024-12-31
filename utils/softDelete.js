import ApiError from '../services/ApiError.js';

/**
 * Soft deletes a model instance from the database within an optional transaction.
 *
 * This function performs a soft delete, meaning it checks whether the record exists,
 * and whether it has related data in other models before deleting it. If related data exists,
 * the deletion is prevented, and the function returns `false`. If no related data exists, the record is deleted.
 *
 * @param {number} id - The ID of the model instance to be deleted.
 * @param {Model} model - The Sequelize model of the instance to delete.
 * @param {Array} relationModels - An array of related models to check for any relationships that may prevent deletion.
 * @param {object} [transaction] - Optional Sequelize transaction to ensure atomic operations.
 * @returns {boolean} - Returns `true` if deletion was successful, `false` if deletion is prevented due to related data.
 * @throws {ApiError} - Throws an error if the model instance is not found in the database.
 *
 * @example
 * const result = await softDelete(1, Article, [{ model: Comment }, { model: Tag }], transaction);
 * if (result) {
 *   console.log('Article deleted successfully');
 * } else {
 *   console.log('Article not deleted due to related data');
 * }
 */
const softDelete = async (id, model, relationModels, transaction = null) => {
  // Fetch the model from the database using the provided ID
  const modelData = await model.findOne({
    where: { id },
    attributes: ['id'], // Only retrieve the ID to minimize the data fetched
    include: relationModels.map((relationModel) => ({
      // Include related models' data, specifying that only the 'id' attribute is needed
      model: relationModel.model,
      attributes: ['id'],
    })),
    transaction, // Tie the query to the transaction if provided
  });

  // If no model data is found, throw an ApiError with a 404 status
  if (!modelData) {
    throw new ApiError(`${model} wasn't found`, 404);
  }

  // Check if any of the related models have associated data
  const hasRelatedData = relationModels.some(
    (relationModel) => modelData[relationModel.name]?.length > 1,
  );

  // If there is related data, return false to indicate deletion was not successful
  if (hasRelatedData) {
    return false;
  }

  // If there is no related data, proceed with deleting the model instance
  await modelData.destroy({ transaction }); // Tie the delete operation to the transaction if provided

  // Return true to indicate that the deletion was successful
  return true;
};

export default softDelete;
