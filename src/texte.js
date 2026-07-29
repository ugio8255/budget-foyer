// ─────────────────────────────────────────────────────────────────
// Petits outils pour juger si un morceau de texte ressemble à un
// vrai nom de produit ou à du charabia (code-barres, date, numéro
// de caisse, lecture ratée).
//
// Partagé par parseTicket.js et categories.js pour que l'analyse et
// le classement appliquent exactement la même règle.
// ─────────────────────────────────────────────────────────────────

const LETTRE = 'A-Za-zÀ-ÖØ-öø-ÿ'

// Repère une date, une heure, un code-barres ou un numéro de caisse.
export const ressembleAUnCode = (s) => {
  const sansEspaces = (s || '').replace(/\s/g, '')
  if (!sansEspaces) return true
  if (/^\d{5,}$/.test(sansEspaces)) return true              // 19052026, code-barres
  if (/\d{2}[/.-]\d{2}[/.-]\d{2,4}/.test(s)) return true     // une date
  if (/\d{1,2}[:h]\d{2}/.test(s)) return true                // une heure
  const chiffres = (sansEspaces.match(/\d/g) || []).length
  return chiffres > sansEspaces.length / 2                    // majoritairement des chiffres
}

/**
 * Un vrai nom de produit doit réunir trois conditions :
 *   1. au moins 3 lettres au total
 *   2. au moins une voyelle
 *   3. soit être entièrement alphabétique (« EAU », « THÉ »),
 *      soit contenir un mot d'au moins 4 lettres d'affilée
 *      (« COCA COLA 1.5L », « PAIN 6 CÉRÉALES »)
 *
 * La 3e condition est ce qui distingue « EAU » (produit) de
 * « TUA 5 2U » (lecture ratée) : les deux ont des lettres et une
 * voyelle, mais le second mêle chiffres et fragments trop courts.
 */
export const ressembleAUnProduit = (s) => {
  const t = (s || '').trim()
  const lettres = t.match(new RegExp(`[${LETTRE}]`, 'g')) || []
  if (lettres.length < 3) return false
  if (!/[AEIOUYaeiouyÀ-ÖØ-öø-ÿ]/.test(t)) return false

  const toutEnLettres = new RegExp(`^[${LETTRE}'’ -]+$`).test(t)
  if (toutEnLettres) return true

  const motsLongs = t.match(new RegExp(`[${LETTRE}]{4,}`, 'g')) || []
  return motsLongs.length > 0
}
