class Generator {
  imports = [];
  lines = [];

  constructor(name, definition) {
    this.name = name;
    this.definition = definition;
  }

  createDescription(defPart, tab = '') {
    if (defPart.description) {
      this.lines.push(`${tab}/**`);
      this.lines.push(`${tab} * ${defPart.description}`);
      this.lines.push(`${tab} */`);
    }
  }

  strToCamelCase(input) {
    return input
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  toKebabCase(str) {
    return str
      .replace(
        /[a-z][A-Z]/g,
        (match) => `${match[0]}-${match[1].toLowerCase()}`,
      )
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replaceAll(' ', '-')
      .toLowerCase()
      .replace(/^-+/, '');
  }

  extend(defPart) {
    return !!defPart.allOf;
  }

  getPropRefName(ref) {
    return ref.slice(ref.lastIndexOf('/') + 1);
  }

  getPropertiesArray() {
    return !!this.definition.allOf
      ? this.definition.allOf[1]?.properties || []
      : this.definition.properties;
  }

  isRequired(propName) {
    return (
      this.definition.required && this.definition.required.includes(propName)
    );
  }

  addMissingAnnotation(propName) {
    return this.isRequired(propName, this.definition.required) ? '' : '?';
  }

  pushIfMissing(a, item) {
    if (!a.includes(item)) a.push(item);
  }

  getType(type) {
    switch (type) {
      case 'integer':
      case 'float':
        return 'number';
      default:
        return type;
    }
  }
}

module.exports = Generator;
