const getQuery = (value, valueName) => {
  // Check if value is not a number
  if (isNaN(value)) {
    return { [valueName]: value };
  }
  return { id: parseInt(value) };
};

export default getQuery;
