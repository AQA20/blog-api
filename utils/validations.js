// Validation helpers

export const validateWordsLength = (value, min, max) => {
  const wordCount = value.trim().split(/\s+/).length;
  if (wordCount < min || wordCount > max) {
    return false;
  }
  return true;
};

export const validateImageFile = (file, allowedTypes) => {
  if (
    file.mimetype.startsWith('image/') &&
    allowedTypes.includes(file.mimetype.replace('image/', ''))
  ) {
    return true;
  }
  return false;
};
