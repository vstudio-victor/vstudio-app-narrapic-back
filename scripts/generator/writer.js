const fs = require('fs');
const path = require('path');

class Writer {
  constructor(models, pathDir) {
    this.models = models;
    this.path = pathDir;
  }

  cleanFolder() {
    if (fs.existsSync(this.path)) {
      fs.rmSync(this.path, { recursive: true });
    }
    fs.mkdirSync(this.path, { recursive: true });
  }

  writeFile(fileName, content) {
    const outputFilePath = path.join(this.path, fileName + '.ts');
    fs.writeFile(outputFilePath, content, 'utf8', (writeErr) => {
      if (writeErr) {
        console.error(`Failed writing file for ${fileName}:`, writeErr);
        return;
      }
    });
  }
}

module.exports = Writer;
