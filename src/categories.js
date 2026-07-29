// Classement automatique d'un article selon son libellé.
// Utilisé par TesseractScanner.jsx pour ranger les articles scannés.
// Pour ajouter un mot-clé, il suffit de l'insérer dans la liste concernée,
// séparé par une barre verticale « | ».

export const classerArticle = (a) => {
  const u = (a || '').toUpperCase()
  if (/VIANDE|POULET|BOEUF|PORC|POISSON|SAUMON|JAMBON/.test(u)) return 'Viandes/Poissons'
  if (/MANGUE|POMME|BANANE|CERISE|KIWI|ORANGE|FRAISE|FRUIT/.test(u)) return 'Fruits'
  if (/SALADE|TOMATE|CAROTTE|OIGNON|POIVRON|COURGETTE|LEGUME/.test(u)) return 'Légumes'
  if (/LAIT|BEURRE|YAOURT|FROMAGE|CREME|OEUF/.test(u)) return 'Laitiers/Œufs'
  if (/PAIN|BAGUETTE|CROISSANT|BRIOCHE/.test(u)) return 'Boulangerie'
  if (/EAU|JUS|SODA|BIERE|VIN|BOISSON/.test(u)) return 'Boissons'
  if (/GATEAU|CHOCOLAT|BONBON|BISCUIT/.test(u)) return 'Sucreries'
  return 'Épicerie'
}
