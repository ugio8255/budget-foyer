// ─────────────────────────────────────────────────────────────────
// Analyse du texte d'un ticket de caisse collé depuis Google Lens
// (Android) ou Live Text (iPhone).
//
// Ce fichier ne contient aucun affichage : uniquement la logique.
// Il est testable seul (voir tests/parseTicket.test.js).
// ─────────────────────────────────────────────────────────────────

import { classerArticle } from './categories.js'
import { ressembleAUnCode, ressembleAUnProduit } from './texte.js'

// Nettoyage : on garde les lettres accentuées (é è ê à ç ù œ…),
// le tiret et l'apostrophe, indispensables aux noms de produits.
export const nettoyer = (t) =>
  (t || '').split('\n')
    .map(l => l.replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\s{2,}/g, ' ').trim())
    .filter(l => l.length > 1)
    .join('\n')

// Lignes à ignorer : totaux, moyens de paiement, mentions légales.
export const LIGNE_A_IGNORER = /TOTAL|SOUS[- ]TOTAL|TVA|MONTANT|RENDU|ESP[EÈ]CES?|CARTE|\bCB\b|CH[EÈ]QUE|TICKET|CAISSE|MERCI|AU REVOIR|RCS|SIRET|SIREN|\bTELS?\b|\bTÉL\b|FACTURE|FIDELITE|FIDÉLITÉ|REMISE|ARRONDI|NET [AÀ] PAYER|DONT TVA/i

/**
 * Analyse le texte d'un ticket.
 * Renvoie { commercant, date, articles: [{ id, nom, prix, categorie }] }
 */
export function analyserTicket(texte) {
  const lignes = nettoyer(texte).split('\n').filter(Boolean)
  const articles = []
  let commercant = ''
  let date = ''

  // Le commerçant est en général sur l'une des premières lignes.
  for (const ligne of lignes.slice(0, 6)) {
    if (ressembleAUnProduit(ligne) && !LIGNE_A_IGNORER.test(ligne) && !ressembleAUnCode(ligne)) {
      commercant = ligne.replace(/\s+\d{1,3}[.,]\d{2}\s*€?$/, '').trim().slice(0, 40)
      break
    }
  }

  // Première date trouvée dans le ticket.
  for (const ligne of lignes) {
    const m = ligne.match(/(\d{2})[/.-](\d{2})[/.-](\d{2,4})/)
    if (m) { date = `${m[1]}/${m[2]}/${m[3]}`; break }
  }
  if (!date) date = new Date().toLocaleDateString('fr-FR')

  // Extraction des articles : « libellé …… prix »
  for (const ligne of lignes) {
    if (LIGNE_A_IGNORER.test(ligne)) continue

    const m = ligne.match(/^(.+?)[\s.·]+(\d{1,3}[.,]\d{2})\s*€?$/)
    if (!m) continue

    const nom = m[1]
      .replace(/^[^A-Za-zÀ-ÖØ-öø-ÿ0-9]+/, '')   // puces et symboles en début
      .replace(/\s+/g, ' ')
      .trim()
    const prix = parseFloat(m[2].replace(',', '.'))

    if (!(prix > 0.05 && prix < 999)) continue
    if (ressembleAUnCode(nom)) continue
    if (!ressembleAUnProduit(nom)) continue

    articles.push({
      id: `${Date.now()}-${articles.length}-${Math.random().toString(36).slice(2, 8)}`,
      nom,
      prix,
      categorie: classerArticle(nom),
    })
  }

  return { commercant: commercant || 'Ticket', date, articles }
}
