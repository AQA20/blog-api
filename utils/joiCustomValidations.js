const existsInDatabase = async (
  Model,
  id,
  helpers,
  errorMsg,
  options = { paranoid: true },
) => {
  const paranoid = options.paranoid;
  const record = await Model.findByPk(id, { paranoid });
  if (!record) {
    return helpers.error(errorMsg);
  }
  return id;
};

export { existsInDatabase };
