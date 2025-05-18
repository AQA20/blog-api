import yaml from 'js-yaml';
import fs from 'fs';

const loadYaml = (file) => yaml.load(fs.readFileSync(file, 'utf8'));

// Load individual YAML files
const base = loadYaml('./swagger-docs/base.yml')
const articles = loadYaml('./swagger-docs/articles-doc.yml');

// Combine all paths
const combinedPaths = {
  ...articles.paths,
};

// Combine into a single OpenAPI spec
const combinedSpec = {
  ...base,
  paths: combinedPaths,
};

export default combinedSpec;
