import fs from 'fs';

export const readFileAsync = async (fullPath, encode = 'utf-8') => {
  try {
    const data = await fs.promises.readFile(fullPath, encode);
    return data;
  } catch (error) {
    console.error(`Error reading file: ${error}`);
    throw error;
  }
};

export const readDirAsync = async (dirPath) => {
  try {
    const directoryEntries = await fs.promises.readdir(dirPath);
    return directoryEntries;
  } catch (error) {
    console.error(`Error reading directory: ${error}`);
    throw error;
  }
};
