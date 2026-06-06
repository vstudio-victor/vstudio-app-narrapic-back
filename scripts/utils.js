function toCamelCase(str) {
  // Vérification si la chaîne est une valeur valide avant de continuer
  if (typeof str !== 'string') {
    console.error('Invalid input to toCamelCase:', str);
    return ''; // Retourne une chaîne vide si l'entrée est invalide
  }
  return str
    .replace(/[-_](.)/g, (_match, group1) => group1.toUpperCase()) // Gère les tirets et underscores en les transformant en majuscule
    .replace(/^[A-Z]/, (match) => match.toLowerCase())
    .replaceAll(' ', ''); // Retirer les espaces
}

function toPascalCase(str) {
  // Vérification si la chaîne est une valeur valide avant de continuer
  if (typeof str !== 'string') {
    console.error('Invalid input to toPascalCase:', str);
    return ''; // Retourne une chaîne vide si l'entrée est invalide
  }
  return str
    .replace(/[-_](.)/g, (_match, group1) => group1.toUpperCase()) // Gère les tirets et underscores en les transformant en majuscule
    .replace(/^[a-z]/, (match) => match.toUpperCase()) // Transforme la première lettre en majuscule
    .replaceAll(' ', ''); // Retirer les espaces
}

function toKebabCase(str) {
  return str
    .replace(/[a-z][A-Z]/g, (match) => `${match[0]}-${match[1].toLowerCase()}`) // Gère les transitions de majuscules vers minuscules
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // Gère les transitions de majuscules vers minuscules (partie 2)
    .replaceAll(' ', '-') // Remplace les espaces par des tirets
    .toLowerCase() // Met tout en minuscules
    .replace(/^-+/, ''); // Supprime les tirets au début
}

module.exports = { toCamelCase, toPascalCase, toKebabCase };
