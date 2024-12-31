const createSlug = (text) => {
  // Remove [':', ',', ';'] from the article title
  return text.replace(/[:,;]/g, '').replace(/\s+/g, '-');
};

export default createSlug;
