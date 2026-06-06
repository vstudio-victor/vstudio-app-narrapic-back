const Generator = require('./generator.js');

class ModelGenerator extends Generator {
  constructor(name, definition, models) {
    super(name, definition);
    this.models = models;
  }

  generate() {
    if (this.definition.enum) {
      this.generateEnum();
    } else {
      switch (this.definition.type) {
        case 'object':
        case undefined:
          this.generateClass();
          break;
        default:
          this.createDescription(this.definition);
          this.lines.push(
            `export type ${this.name} = ${this.getType(this.definition.type)};`,
          );
      }
    }

    return [
      `/* tslint:disable */`,
      `/* eslint-disable */`,
      ``,
      ...this.imports,
      ...this.lines,
    ].join('\n');
  }

  generateEnum() {
    this.lines.push(`export enum ${this.name} {`);

    this.definition.enum.forEach((value) => {
      this.lines.push(`  ${this.strToCamelCase(value)} = '${value}',`);
    });
    this.lines.push(`}`);
    this.lines.push(``);
  }

  generateClass() {
    const extend = this.extend(this.definition);
    this.createDescription(this.definition);
    this.lines.push(
      `export class ${this.name} ${
        extend
          ? `extends ${this.getPropRefName(this.definition.allOf[0].$ref)} `
          : ''
      }{`,
    );

    if (extend) {
      this.imports.push(
        `import { ${this.getPropRefName(
          this.definition.allOf[0].$ref,
        )} } from './${this.toKebabCase(
          this.getPropRefName(this.definition.allOf[0].$ref),
        )}';`,
      );
    }

    const validators = [];
    const transformers = [];
    const importClasses = [];

    this.generateProperties(
      this.getPropertiesArray(),
      validators,
      importClasses,
      transformers,
    );

    if (validators.length > 0) {
      this.imports.unshift(
        `import { ${validators.join(', ')} } from 'class-validator';`,
      );
    }

    if (transformers.length > 0) {
      this.imports.unshift(
        `import { ${transformers.join(', ')} } from 'class-transformer';`,
      );
    }

    if (importClasses.length > 0) {
      this.imports.push(
        ...importClasses.map(
          ({ type, path }) => `import { ${type} } from './${path}';`,
        ),
      );
    }

    this.imports.push(``);

    this.lines.push(`}`);
    this.lines.push(``);
  }

  generateProperties(properties, validators, importClasses, transformers) {
    Object.entries(properties).forEach(([propName, property]) => {
      this.createDescription(property, '  ');
      if (this.isRequired(propName)) {
        this.pushIfMissing(validators, 'IsDefined');
        this.lines.push(`  @IsDefined()`);
      } else {
        this.pushIfMissing(validators, 'IsOptional');
        this.lines.push(`  @IsOptional()`);
      }

      if (property.$ref) {
        this.generateFromRef(
          property,
          propName,
          validators,
          importClasses,
          transformers,
        );
      } else {
        if (property.type) {
          this.generateFromPropertyType(
            property,
            propName,
            validators,
            transformers,
            importClasses,
          );
        } else {
          this.generateWithoutType(propName);
        }
      }

      this.lines.push(``);
    });
  }

  generateFromRef(property, propName, validators, importClasses, transformers) {
    const type = this.getPropRefName(property.$ref);
    this.generateObject(
      propName,
      type,
      validators,
      importClasses,
      transformers,
    );
  }

  generateFromPropertyType(
    property,
    propName,
    validators,
    transformers,
    importClasses,
  ) {
    switch (property.type) {
      case 'string':
        this.generateString(propName, property, validators, transformers);
        break;
      case 'number':
        this.generateNumber(propName, validators);
        break;
      case 'boolean':
        this.generateBool(propName, validators);
        break;
      case 'integer':
        this.generateInt(propName, validators);
        break;
      case 'array':
        this.generateArray(
          propName,
          property,
          validators,
          importClasses,
          transformers,
        );
        break;
      default:
        console.log(
          `WARNING !!! : ${propName} of type ${property.type} not implemented`,
        );
    }
  }

  generateWithoutType(propName) {
    this.lines.push(
      `  ${propName}${this.addMissingAnnotation(propName)}: any;`,
    );
    console.log(`WARNING !!! : ${this.name} > ${propName} type undefined`);
  }

  generateObject(
    propName,
    type,
    validators,
    importClasses,
    transformers,
    isArray = false,
  ) {
    if (!importClasses.map(({ type }) => type).includes(type))
      importClasses.push({ type, path: this.toKebabCase(type) });

    const classNames = [type];

    if (this.isEnum(type)) {
      this.pushIfMissing(validators, 'IsEnum');
      this.lines.push(`  @IsEnum(${type})`);
    } else if (type === this.getTrueType(type)) {
      this.pushIfMissing(transformers, 'Type');
      this.pushIfMissing(validators, 'ValidateNested');
      this.lines.push(`  @ValidateNested(${isArray ? '{ each: true }' : ''})`);
      this.lines.push(
        `  @Type(() => ${type}${this.discriminator(
          type,
          importClasses,
          classNames,
        )})`,
      );
    }
    this.lines.push(
      `  ${propName}${this.addMissingAnnotation(
        propName,
      )}: ${this.getClassNames(classNames)}${isArray ? '[]' : ''};`,
    );
  }

  getClassNames(classNames) {
    const classes = classNames.join(' | ');
    return classNames.length === 1 ? classes : `( ${classes} )`;
  }

  discriminator(type, importClasses, classNames) {
    const properties = this.getTypeProperties(type);
    const discriminators = [];

    if (properties.discriminator) {
      const discriminatorProperty = Object.entries(properties.properties).find(
        ([propName]) => {
          return propName === properties.discriminator.propertyName;
        },
      )[1];
      const discriminatorType = this.getPropRefName(discriminatorProperty.$ref);

      if (!importClasses.map(({ type }) => type).includes(discriminatorType))
        importClasses.push({
          type: discriminatorType,
          path: this.toKebabCase(discriminatorType),
        });

      discriminators.push(', {');
      discriminators.push('    discriminator: {');
      discriminators.push(
        `      property: '${properties.discriminator.propertyName}',`,
      );
      discriminators.push(`      subTypes: [`);

      Object.entries(properties.discriminator.mapping).forEach(
        ([key, value]) => {
          const className = this.getPropRefName(value);
          if (!importClasses.map(({ type }) => type).includes(value))
            importClasses.push({
              type: className,
              path: this.getPropRefName(this.toKebabCase(value)),
            });
          discriminators.push(
            `        { value: ${className}, name: ${discriminatorType}.${this.strToCamelCase(
              this.getPropRefName(key),
            )} },`,
          );
          classNames.push(className);
        },
      );

      discriminators.push(`      ],`);
      discriminators.push(`    },`);
      discriminators.push(`  }`);
    }
    return discriminators.join('\n');
  }

  generateString(
    propName,
    property,
    validators,
    transformers,
    isArray = false,
  ) {
    switch (property.format) {
      case 'date':
        this.pushIfMissing(transformers, 'Type');
        this.pushIfMissing(validators, 'IsDate');
        this.lines.push(`  @IsDate(${isArray ? '{ each: true }' : ''})`);
        this.lines.push(`  @Type(() => Date)`);
        this.lines.push(
          `  ${propName}${this.addMissingAnnotation(propName)}: Date${
            isArray ? '[]' : ''
          };`,
        );
        break;
      default:
        this.pushIfMissing(validators, 'IsString');
        this.lines.push(`  @IsString(${isArray ? '{ each: true }' : ''})`);
        this.lines.push(
          `  ${propName}${this.addMissingAnnotation(propName)}: string${
            isArray ? '[]' : ''
          };`,
        );
    }
  }

  generateInt(propName, validators, isArray = false) {
    this.pushIfMissing(validators, 'IsInt');
    this.lines.push(`  @IsInt(${isArray ? '{ each: true }' : ''})`);
    this.lines.push(
      `  ${propName}${this.addMissingAnnotation(propName)}: number${
        isArray ? '[]' : ''
      };`,
    );
  }

  generateBool(propName, validators, isArray = false) {
    this.pushIfMissing(validators, 'IsBoolean');
    this.lines.push(`  @IsBoolean(${isArray ? '{ each: true }' : ''})`);
    this.lines.push(
      `  ${propName}${this.addMissingAnnotation(propName)}: boolean${
        isArray ? '[]' : ''
      };`,
    );
  }

  generateNumber(propName, validators, isArray = false) {
    this.pushIfMissing(validators, 'IsNumber');
    this.lines.push(`  @IsNumber(${isArray ? '{ each: true }' : ''})`);
    this.lines.push(
      `  ${propName}${this.addMissingAnnotation(propName)}: number${
        isArray ? '[]' : ''
      };`,
    );
  }

  generateArray(propName, property, validators, importClasses, transformers) {
    if (property.items.type) {
      switch (property.items.type) {
        case 'integer':
          this.generateInt(propName, validators, true);
          break;
        case 'number':
          this.generateNumber(propName, validators, true);
          break;
        case 'boolean':
          this.generateBool(propName, validators, true);
          break;
        case 'string':
          this.generateString(
            propName,
            property,
            validators,
            transformers,
            true,
          );
          break;
        default:
          console.log(
            `WARNING !!! : ${propName} array of type ${property.items.type} not implemented`,
          );
      }
    }

    if (property.items.$ref) {
      const arrayType = this.getPropRefName(property.items.$ref);
      this.generateObject(
        propName,
        arrayType,
        validators,
        importClasses,
        transformers,
        true,
      );
    }
  }

  isEnum(propType) {
    const properties = Object.entries(this.models).find(
      ([name]) => name === propType,
    )[1];

    return !!properties?.enum;
  }

  getTypeProperties(propType) {
    return Object.entries(this.models).find(([name]) => name === propType)[1];
  }

  getTrueType(propType) {
    const properties = this.getTypeProperties(propType);

    return !this.isEnum(propType) &&
      !['object', undefined].find((i) => {
        return i === properties.type;
      })
      ? properties.type
      : propType;
  }
}

module.exports = ModelGenerator;
