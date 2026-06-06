const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const ModelsGenerator = require('./generator/models-generator.js');

const pathIndex = process.argv.indexOf('--path');
let pathValue;

if (pathIndex > -1) {
  pathValue = process.argv[pathIndex + 1];
}

// __dirname is already available in CommonJS, no need to define it
const inputYamlPath = path.join(__dirname, '..', pathValue);

const file = fs.readFileSync(inputYamlPath, 'utf-8');
const yaml = YAML.parse(file);

const modelsGen = new ModelsGenerator(
  yaml.components.schemas,
  path.join(__dirname, '..', 'generated', 'api', 'models'),
);

modelsGen.cleanFolder();
modelsGen.generate();
