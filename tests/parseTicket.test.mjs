// Tests de l'analyseur de tickets.
// Lancer avec :  node tests/parseTicket.test.mjs
// Aucun outil à installer : c'est le testeur intégré à Node.

import test from 'node:test'
import assert from 'node:assert/strict'
import { analyserTicket } from '../src/parseTicket.js'
import { classerArticle } from '../src/categories.js'

// ─── Cas 1 : un ticket normal, tel que Google Lens le restitue ────
const TICKET_PROPRE = `
CARREFOUR MARKET
12 RUE DE LA PAIX
TEL 01 23 45 67 89
19/05/2026 14:57

POMMES GALA          3,49
LAIT DEMI-ÉCRÉMÉ     1,15
BAGUETTE TRADITION   1,10
BLANC DE POULET      6,80
CRÈME FRAÎCHE        2,35

TOTAL                14,89
CARTE BANCAIRE       14,89
MERCI DE VOTRE VISITE
`

test('un ticket lisible : tous les articles sont extraits', () => {
  const r = analyserTicket(TICKET_PROPRE)
  assert.equal(r.articles.length, 5, 'il doit y avoir exactement 5 articles')
  assert.deepEqual(r.articles.map(a => a.nom), [
    'POMMES GALA', 'LAIT DEMI-ÉCRÉMÉ', 'BAGUETTE TRADITION',
    'BLANC DE POULET', 'CRÈME FRAÎCHE',
  ])
})

test('les accents sont préservés', () => {
  const r = analyserTicket(TICKET_PROPRE)
  assert.ok(r.articles.some(a => a.nom.includes('É')), 'É doit survivre')
  assert.ok(r.articles.some(a => a.nom.includes('È')), 'È doit survivre')
  assert.ok(r.articles.some(a => a.nom.includes('Î')), 'Î doit survivre')
})

test('le total et le moyen de paiement ne sont pas pris pour des articles', () => {
  const r = analyserTicket(TICKET_PROPRE)
  const noms = r.articles.map(a => a.nom).join(' ')
  assert.ok(!/TOTAL/i.test(noms), 'TOTAL ne doit pas apparaître')
  assert.ok(!/CARTE/i.test(noms), 'CARTE BANCAIRE ne doit pas apparaître')
})

test('la date et le commerçant sont reconnus', () => {
  const r = analyserTicket(TICKET_PROPRE)
  assert.equal(r.date, '19/05/2026')
  assert.equal(r.commercant, 'CARREFOUR MARKET')
})

test('la somme des articles correspond au total du ticket', () => {
  const r = analyserTicket(TICKET_PROPRE)
  const somme = r.articles.reduce((s, a) => s + a.prix, 0)
  assert.equal(Number(somme.toFixed(2)), 14.89)
})

test('le classement automatique range correctement', () => {
  const r = analyserTicket(TICKET_PROPRE)
  const parNom = Object.fromEntries(r.articles.map(a => [a.nom, a.categorie]))
  assert.equal(parNom['POMMES GALA'], 'Fruits')
  assert.equal(parNom['LAIT DEMI-ÉCRÉMÉ'], 'Laitiers/Œufs')
  assert.equal(parNom['BAGUETTE TRADITION'], 'Boulangerie')
  assert.equal(parNom['BLANC DE POULET'], 'Viandes/Poissons')
})

// ─── Cas 2 : le texte abîmé de la capture d'écran ─────────────────
// C'est ce que produisait l'ancien scanner automatique.
const TICKET_ABIME = `
6b6r2    19052026   8,52
D 600              14,95
3x 10               3,9
O450                4,95
O925    2 2         2,31
O 215              14,95
TUA    5 2U         1,07
`

test('le texte illisible est rejeté au lieu d\'inventer des articles', () => {
  const r = analyserTicket(TICKET_ABIME)
  assert.equal(r.articles.length, 0,
    'aucune de ces lignes ne ressemble à un vrai produit : ' +
    JSON.stringify(r.articles.map(a => a.nom)))
})

// ─── Cas 3 : le garde-fou du classement ───────────────────────────
test('un libellé abîmé repart en « À classer », pas en « Épicerie »', () => {
  assert.equal(classerArticle('O450'), 'À classer')
  assert.equal(classerArticle('TUA 5 2U'), 'À classer')
  assert.equal(classerArticle('6b6r2'), 'À classer')
  assert.equal(classerArticle(''), 'À classer')
})

test('un produit inconnu mais lisible va bien en « Épicerie »', () => {
  assert.equal(classerArticle('SEL FIN DE GUERANDE'), 'Épicerie')
})

// ─── Cas 4 : robustesse ───────────────────────────────────────────
test('un texte vide ne fait pas planter l\'app', () => {
  const r = analyserTicket('')
  assert.equal(r.articles.length, 0)
  assert.equal(r.commercant, 'Ticket')
})

test('les prix aberrants sont écartés', () => {
  const r = analyserTicket('ARTICLE DOUTEUX  9999,00\nPAIN COMPLET  2,40')
  assert.equal(r.articles.length, 1)
  assert.equal(r.articles[0].nom, 'PAIN COMPLET')
})
