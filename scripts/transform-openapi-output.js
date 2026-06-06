const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const utils = require('./utils.js');

const { toCamelCase, toKebabCase, toPascalCase } = utils;

// __dirname is already available in CommonJS
const inputYamlPath = path.join(
  __dirname,
  '..',
  'ressources',
  'yaml',
  'pdf-generator-api.yaml',
);
// Output Folder
const outputDir = path.join(__dirname, '..', 'generated', 'api', 'api');

// Helper function to get all files with a specific extension in a directory
function getFilesByExtension(dir, extension) {
  return fs.readdirSync(dir).filter((file) => file.endsWith(extension));
}

// Step 1: Remove all files ending with 'Api.ts'
function removeApiFiles() {
  const apiFilePath = path.join(outputDir, 'api.ts');
  const apiIndexPath = path.join(outputDir, 'index.ts');
  const configurationPath = path.join(outputDir, 'configuration.ts');
  [apiFilePath, apiIndexPath, configurationPath].forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
  getFilesByExtension(outputDir, '.service.ts').forEach((file) => {
    fs.unlinkSync(path.join(outputDir, file));
  });
}

function getBodyDetails(method, components, modelImports) {
  const requestBody = method.requestBody;
  const requestBodyType = requestBody?.content
    ? Object.keys(requestBody.content)[0]
    : null;

  if (requestBodyType === 'application/json') {
    const schemaRef = requestBody?.content['application/json'].schema?.$ref;
    if (schemaRef) {
      const bodyModelName = schemaRef.split('/').pop();
      const bodyDescription =
        components.schemas[bodyModelName]?.description || '';
      modelImports.add(bodyModelName);
      return {
        name: toCamelCase(bodyModelName),
        description: bodyDescription,
        type: bodyModelName,
      };
    }
    return {
      name: 'body',
      description: 'No description available',
      type: 'any',
    };
  }
  return null;
}

function getParameterDetails(param, components, modelImports) {
  if (param.$ref) {
    // Syntax is:
    // - $ref: '#/components/parameters/parameterName'
    const parameterName = param.$ref.split('/').pop();
    const compoParam = components.parameters[parameterName];

    if (compoParam) {
      const { name, description, schema } = compoParam;
      return {
        name: toCamelCase(name),
        description,
        type: getParamType(schema),
      };
    }
  } else if (param.in && param.content) {
    /* Syntax is :
      - in: query
        name: search
        content:
          application/json:
        schema:
          $ref: '#/components/schemas/SchemaName'*/
    const SchemaName = param.content['application/json'].schema.$ref
      .split('/')
      .pop();
    modelImports.add(SchemaName);
    const compoParam = components.schemas[SchemaName];
    if (compoParam) {
      return {
        name: param.name,
        description: '',
        type: SchemaName,
      };
    }
  }
  /* Syntax is :
      - name: parameterName
        in: query
        schema:
          type: type */
  let { name, description, schema } = param;
  return {
    name: toCamelCase(name),
    description,
    type: getParamType(schema),
  };
}

// Mise à jour de la fonction pour extraire le type des paramètres
function getParamType(schema) {
  if (!schema) {
    return 'any';
  }

  let paramType = schema.type || 'any';

  switch (paramType) {
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      const itemsType = schema.items?.type || 'any';
      return `${itemsType}[]`; // Tableau de type spécifique
    case 'object':
      return 'Record<string, any>'; // Objet générique
    default:
      return paramType;
  }
}

function getResponseType(method, modelImports) {
  const responseEntry = Object.entries(method.responses || {}).find(
    ([statusCode, _response]) => {
      const code = parseInt(statusCode, 10);
      return code >= 200 && code <= 299;
    },
  );
  if (!responseEntry) {
    return 'any';
  }
  const [_statusCode, response] = responseEntry;
  const contentType = response.content
    ? Object.keys(response.content)[0]
    : null;

  if (contentType === 'application/json') {
    const schemaRef = response.content['application/json'].schema?.$ref;
    if (schemaRef) {
      const modelName = schemaRef.split('/').pop();
      modelImports.add(modelName);
      return modelName;
    }
    const schema = response.content['application/json'].schema;
    if (schema && schema.type === 'array') {
      const modelName = schema.items.$ref.split('/').pop();
      modelImports.add(modelName);
      return modelName + '[]';
    }
    return schema?.type || 'any';
  } else if (contentType === 'text/plain') {
    return 'string';
  } else if (contentType === 'application/pdf') {
    return 'Buffer';
  }

  return 'any';
}

// Read and Analyze yaml
fs.readFile(inputYamlPath, 'utf8', (err, yamlContent) => {
  if (err) {
    console.error('Failed to read YAML file:', err);
    return;
  }

  try {
    removeApiFiles();
  } catch (e) {
    console.error('Failed to delete generated files:', e);
    return;
  }

  let openApiSpec;
  try {
    openApiSpec = yaml.load(yamlContent);
  } catch (parseErr) {
    console.error('Failed to analyze YAML file:', parseErr);
    return;
  }

  const { paths, components: contractComponents } = openApiSpec;
  if (!paths) {
    console.error('No path found in OpenAPI file.');
    return;
  }

  // Gather operations by tags
  const services = {};

  Object.entries(paths).forEach(([_path, methods]) => {
    const pathParams = methods.parameters || [];
    Object.entries(methods).forEach(([_method, method]) => {
      const tags = method.tags || [];
      tags.forEach((tag) => {
        if (!services[tag]) {
          services[tag] = { operations: [], modelImports: new Set() };
        }

        const methodName = method.operationId;
        const methodDescription = method.summary || '';
        let methodParams = pathParams
          .concat(method.parameters || [])
          .map((param) => {
            const { name, type, description } = getParameterDetails(
              param,
              contractComponents,
              services[tag].modelImports, // Ajout des modèles spécifiques
            );
            return {
              name: name,
              type: type,
              isRequired: !!param.required,
              description: description,
            };
          })
          .concat([
            getBodyDetails(
              method,
              contractComponents,
              services[tag].modelImports,
            ),
          ])
          .filter((param) => !!param)
          .sort((a, b) => b.isRequired - a.isRequired);

        const paramInfoListStr = methodParams
          .map((param) => {
            const optional = param.required ? '' : '?';
            return `${param.name}${optional}: ${param.type}`;
          })
          .join(', ');

        const responseType = getResponseType(
          method,
          services[tag].modelImports, // Ajout des modèles spécifiques
        );

        // Générer la signature de la fonction avec des paramètres séparés
        services[tag].operations.push(`  /**
   * ${methodDescription}
   * @param res The HTTP response to be sent
   * ${methodParams
     .map((param) => `@param ${param.name} ${param.description}`)
     .join('\n   * ')}
   */
  ${methodName}(res: Response<${responseType}>, ${paramInfoListStr}): void;`);
      });
    });
  });

  Object.entries(services).forEach(
    ([serviceName, { operations, modelImports }]) => {
      const importStatements = Array.from(modelImports)
        .map(
          (modelName) =>
            `import { ${modelName} } from '../model/${toCamelCase(
              modelName,
            )}';`,
        )
        .join('\n');

      const outputContent = `/* tslint:disable */
/* eslint-disable */
/**
 * Auto-generated interface for ${serviceName} from OpenAPI spec.
 */

import { Response } from 'express';
${importStatements}

export interface ${toPascalCase(serviceName)}Api {
${operations.join('\n\n')}
}
`;

      const outputFilePath = path.join(
        outputDir,
        `${toKebabCase(serviceName)}-api.ts`,
      );

      fs.writeFile(outputFilePath, outputContent, 'utf8', (writeErr) => {
        if (writeErr) {
          console.error(`Failed writing file for ${serviceName}:`, writeErr);
          return;
        }
        console.log(
          `Interface générée avec succès pour ${serviceName}:`,
          outputFilePath,
        );
      });
    },
  );
});
