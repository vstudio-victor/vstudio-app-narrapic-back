const { replaceInFileSync } = require('replace-in-file');

replaceInFileSync({
  files: './package-lock.json',
  from: /[\t ]*("resolved":)[^\n]*\n/g,
  to: '',
});
