// Classement automatique d'un article selon son libellé.
// Utilisé par TicketColle.jsx pour ranger les articles d'un ticket.
// Pour ajouter un mot-clé, il suffit de l'insérer dans la liste concernée,
// séparé par une barre verticale « | ».

import { ressembleAUnProduit } from './texte.js'

export const classerArticle = (a) => {
  const u = (a || '').toUpperCase()

  // Garde-fou : si le libellé est trop abîmé pour être un vrai nom de
  // produit, on préfère « À classer » à un rangement inventé.
  if (!ressembleAUnProduit(a)) return 'À classer'

  if (/VIANDE|POULET|BOEUF|PORC|POISSON|SAUMON|JAMBON/.test(u)) return 'Viandes/Poissons'
  if (/MANGUE|POMME|BANANE|CERISE|KIWI|ORANGE|FRAISE|FRUIT/.test(u)) return 'Fruits'
  if (/SALADE|TOMATE|CAROTTE|OIGNON|POIVRON|COURGETTE|LEGUME/.test(u)) return 'Légumes'
  if (/LAIT|BEURRE|YAOURT|FROMAGE|CREME|OEUF/.test(u)) return 'Laitiers/Œufs'
  if (/PAIN|BAGUETTE|CROISSANT|BRIOCHE/.test(u)) return 'Boulangerie'
  if (/EAU|JUS|SODA|BIERE|VIN|BOISSON/.test(u)) return 'Boissons'
  if (/GATEAU|CHOCOLAT|BONBON|BISCUIT/.test(u)) return 'Sucreries'
  return 'Épicerie'
}
