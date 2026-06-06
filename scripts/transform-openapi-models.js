const fs = require('fs');
const path = require('path');
const utils = require('./utils.js');

const { toKebabCase } = utils;

const modelsDir = path.join(__dirname, '..', 'generated', 'api', 'models');

const isObjectAnEnum = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  return /export enum \w+/g.test(content);
};

fs.readdirSync(modelsDir).forEach((file) => {
  if (path.extname(file) === '.ts') {
    const filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    content = content
    .replace(
        /export interface (\w+)/,
        (match, className) => `export class ${className}`,
    )
    .replace(
        /(\s+)(\w+)(\??): (\w+(?:<\w+>)?|\w+\[\])?;/g,
        (match, spaces, propName, optional, propType) => {
          let decorators = [
            `${spaces}@${optional ? 'IsOptional' : 'IsDefined'}()`,
            propType === 'string' && `${spaces}@IsString()`,
            propType === 'number' && `${spaces}@IsNumber()`,
            propType === 'boolean' && `${spaces}@IsBoolean()`,
          ]
          .filter(Boolean)
          .join('');

          if (propType && propType.startsWith('Array<')) {
            const typeName = propType.slice(6, -1);
            const typeFilePath = path.join(
                modelsDir,
                `${toKebabCase(typeName)}.ts`,
            );
            decorators += `${spaces}@ValidateNested({ each: true })`;
            decorators += `${spaces}@Type(() => ${typeName})`;

            if (fs.existsSync(typeFilePath)) {
              if (isObjectAnEnum(typeFilePath)) {
                decorators += `${spaces}@IsEnum(${typeName}, { each: true })`;
              }
            }
          }

          // Check requires enumValidators => for date
          if (propType === 'date') {
            decorators += `${spaces}@IsDate()`;
            decorators += `${spaces}@Type(() => Date)`;
            propType = 'Date';
          }

          // Check requires enumValidators => for objects & Arrays
          if (!['string', 'number', 'boolean', 'Date'].includes(propType)) {
            const typeFilePath = path.join(
                modelsDir,
                `${toKebabCase(propType)}.ts`,
            );

            if (fs.existsSync(typeFilePath)) {
              if (isObjectAnEnum(typeFilePath)) {
                decorators += `${spaces}@IsEnum(${propType})`;
              } else {
                decorators += `${spaces}@ValidateNested({ each: true })`;
                decorators += `${spaces}@Type(() => ${propType})`;
              }
            }
          }

          return `${decorators}${spaces}${propName}${optional}: ${propType};\n`;
        },
    )
    .replaceAll(`/* tslint:disable */`, '')
    .replaceAll(`/* eslint-disable */`, '');

    const usedDecorators = [
      'IsDefined',
      'IsString',
      'IsNumber',
      'IsBoolean',
      'IsOptional',
      'IsEnum',
      'IsDate',
      'ValidateNested',
    ].filter((decorator) => content.includes(`@${decorator}`));

    const usedTransformers = ['Type'].filter((transformer) =>
        content.includes(`@${transformer}`),
    );

    let imports = '/* tslint:disable */\n/* eslint-disable */\n\n';

    if (usedDecorators.length) {
      imports += `import { ${usedDecorators.join(
          ', ',
      )} } from 'class-validator';\n`;
    }

    if (usedTransformers.length) {
      imports += `import { ${usedTransformers.join(
          ', ',
      )} } from 'class-transformer';\n`;
    }

    content = imports + content;

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Processed: ${file}`);
  }
});
