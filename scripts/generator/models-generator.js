const utils = require('../utils.js'); // Go up one directory
const ModelGenerator = require('./model-generator.js');
const Writer = require('./writer.js');
const { toKebabCase } = utils;

class ModelsGenerator extends Writer {
  constructor(models, path) {
    super(models, path);
  }

  generate() {
    Object.entries(this.models).forEach(([name, definition]) => {
      const generator = new ModelGenerator(name, definition, this.models);
      const content = generator.generate();
      const fileName = toKebabCase(name);
      this.writeFile(fileName, content);
    });
  }
}

module.exports = ModelsGenerator;
