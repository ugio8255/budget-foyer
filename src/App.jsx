import React, { useState, useEffect } from 'react'

// ─── Palette & tokens ───────────────────────────────────────────────────────
const C = {
  bg:       '#FAF7F2',
  card:     '#FFFFFF',
  ink:      '#1C1A16',
  muted:    '#8C8370',
  border:   '#E8E2D9',
  accent:   '#D97B3A',
  accentBg: '#FDF0E6',
  green:    '#3A8C5C',
  greenBg:  '#E8F5EE',
  red:      '#C0392B',
  redBg:    '#FDECEA',
  orange:   '#E07B2A',
  blue:     '#2563EB',
  blueBg:   '#EBF2FF',
  shadow:   '0 2px 12px rgba(0,0,0,0.07)',
}

const fonts = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
`

const globalStyle = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; font-family: 'DM Sans', sans-serif; }
  input, select, textarea, button { font-family: inherit; }
  button { cursor: pointer; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
`

// ─── Helpers ──────────────────────────────────────────────────────────────────
const classerArticle = (article) => {
  const a = article.toUpperCase()
  if (/VIANDE|POULET|BOEUF|PORC|POISSON|SAUMON|JAMBON|DINDE|VEAU|AGNEAU|LAPIN|THON|CABILLAUD/.test(a)) return 'Viandes/Poissons'
  if (/SALADE|TOMATE|CAROTTE|OIGNON|POIVRON|COURGETTE|LEGUME|BROCOLI|EPINARD|HARICOT|POIREAU|AUBERGINE|CHAMPIGNON/.test(a)) return 'Légumes'
  if (/MANGUE|POMME|BANANE|CERISE|KIWI|ORANGE|FRAISE|FRUIT|ANANAS|MELON|PECHE|POIRE|RAISIN|ABRICOT|PRUNE/.test(a)) return 'Fruits'
  if (/LAIT|BEURRE|YAOURT|FROMAGE|CREME|OEUF/.test(a)) return 'Laitiers/Œufs'
  if (/PAIN|BAGUETTE|CROISSANT|BRIOCHE|VIENNOIS/.test(a)) return 'Boulangerie'
  if (/EAU|JUS|SODA|BIERE|VIN|BOISSON|LIMONADE|SIROP/.test(a)) return 'Boissons'
  if (/GATEAU|CHOCOLAT|BONBON|BISCUIT|TARTE|CONFITURE|MIEL/.test(a)) return 'Sucreries'
  return 'Épicerie'
}

const nettoyer = (texte) => {
  return texte
    .split('\n')
    .map(l => l.replace(/[^\x20-\x7E\xA0-\xFF\n]/g, ' ').trim())
    .filter(l => l.length > 1)
    .join('\n')
}

const extraireMois = (date) => {
  const p = date.split('/')
  if (p.length < 2) return null
  const a = p.length === 3 ? (p[2].length === 2 ? '20' + p[2] : p[2]) : '2025'
  return new Date(a, p[1] - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const CATEGORIES_ICONES = {
  'Viandes/Poissons': '🥩',
  'Fruits':           '🍎',
  'Légumes':          '🥦',
  'Laitiers/Œufs':   '🥛',
  'Boulangerie':      '🥖',
  'Boissons':         '🧃',
  'Sucreries':        '🍫',
  'Épicerie':         '🛒',
  'Alimentation':     '🍽️',
  'Loisirs':          '🎭',
  'Transport':        '🚌',
  'Maison':           '🏠',
  'À classer':        '📋',
}

// ─── Composants UI ────────────────────────────────────────────────────────────

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
      boxShadow: C.shadow, padding: 20, ...style
    }}>
      {children}
    </div>
  )
}

function Btn({ children, onClick, variant = 'primary', style = {}, disabled = false }) {
  const styles = {
    primary: { background: C.accent, color: '#fff' },
    secondary: { background: C.bg, color: C.ink, border: `1px solid ${C.border}` },
    ghost: { background: 'transparent', color: C.blue },
    danger: { background: C.redBg, color: C.red, border: `1px solid ${C.red}33` },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '12px 18px', borderRadius: 12, fontWeight: 600, fontSize: 16,
        border: 'none', transition: 'opacity .15s, transform .1s',
        opacity: disabled ? 0.5 : 1,
        ...styles[variant], ...style
      }}
    >
      {children}
    </button>
  )
}

function Badge({ children, color = C.muted }) {
  return (
    <span style={{
      background: color + '22', color, fontSize: 12, fontWeight: 600,
      padding: '2px 8px', borderRadius: 20, display: 'inline-block'
    }}>
      {children}
    </span>
  )
}

function BandeauAlerte({ pct, reste, plafond }) {
  if (pct < 80) return null
  const over = pct >= 100
  return (
    <div style={{
      background: over ? C.redBg : '#FFF8E6',
      border: `1px solid ${over ? C.red : C.orange}44`,
      borderRadius: 12, padding: '10px 16px', display: 'flex',
      alignItems: 'center', gap: 10, marginBottom: 16
    }}>
      <span style={{ fontSize: 22 }}>{over ? '🚨' : '⚠️'}</span>
      <span style={{ color: over ? C.red : C.orange, fontWeight: 600, fontSize: 15 }}>
        {over
          ? `Plafond dépassé de ${Math.abs(reste).toFixed(0)} €`
          : `Attention — il reste ${reste.toFixed(0)} € (${100 - pct}%)`}
      </span>
    </div>
  )
}

function BarreProgression({ pct }) {
  const couleur = pct >= 100 ? C.red : pct >= 80 ? C.orange : C.green
  return (
    <div style={{ background: C.border, height: 10, borderRadius: 5, overflow: 'hidden' }}>
      <div style={{
        width: Math.min(pct, 100) + '%', height: '100%',
        background: couleur, borderRadius: 5,
        transition: 'width .4s ease, background .3s',
      }} />
    </div>
  )
}

// ─── Onglet Ticket ────────────────────────────────────────────────────────────

function OngletTicket({ onImport }) {
  const [texte, setTexte] = useState('')
  const [apercu, setApercu] = useState(null)
  const [etape, setEtape] = useState(1) // 1=coller, 2=preview, 3=ok

  const analyser = () => {
    const propre = nettoyer(texte)
    const lignes = propre.split('\n')
    const articles = []
    let commercant = ''
    let dateTicket = ''

    for (const ligne of lignes.slice(0, 5)) {
      const l = ligne.trim()
      if (l.length > 3 && !/[:\d]/.test(l.slice(0, 3)) && !l.startsWith('TEL') && !l.startsWith('#')) {
        commercant = l; break
      }
    }

    for (const ligne of lignes) {
      const m = ligne.match(/(\d{2}[-/]\d{2}[-/]\d{2,4})/)
      if (m) { dateTicket = m[1].replace(/-/g, '/'); break }
    }
    if (!dateTicket) dateTicket = new Date().toLocaleDateString('fr-FR')

    // Détecte si une ligne est un nom d'article (lettres, pas que des chiffres)
    const estNomArticle = (l) => {
      const t = l.trim().replace(/^[‡*+#]\s*/, '')
      return t.length > 2 && /[A-Za-zÀ-ÿ]{2,}/.test(t) &&
        !/TOTAL|CARTE|ESPECE|MONNAIE|RENDU|TVA|MERCI|BIENVENUE|TEL|RCS|SIRET|APE|TICKET|CAISSE|RAY\.|APP\.|PLU|KG|VENDEUR|VOUS|AVEZ|ETE|SERVI|PRIX|SEUIL|ECONOMIE/i.test(t)
    }

    // Détecte si une ligne contient un prix final (dernier token = nombre)
    const extrairePrix = (l) => {
      const tokens = l.trim().split(/\s+/)
      const dernier = tokens[tokens.length - 1].replace(',', '.')
      const prix = parseFloat(dernier)
      if (prix > 0.05 && prix < 999 && /^\d+\.?\d*$/.test(dernier)) return prix
      return null
    }

    // Détecte une ligne purement numérique (poids, prix/kg) — pas un article
    const estLigneNumerique = (l) => /^[\d\s,.*x×÷]+$/.test(l.trim())

    for (let i = 0; i < lignes.length; i++) {
      const ligne = lignes[i].trim()

      // FORMAT 1 : article + prix sur la même ligne
      // Ex: "POULET ROTI   5,99"
      const parts = ligne.split(/\s{2,}|\t/)
      const flat = ligne.split(/\s+/)
      let traite = false

      for (const arr of [parts, flat]) {
        if (arr.length >= 2) {
          const dernier = arr[arr.length - 1]
          const prix = parseFloat(dernier.replace(',', '.'))
          if (prix > 0.05 && prix < 999 && /^\d/.test(dernier)) {
            const article = arr.slice(0, -1).join(' ').trim().replace(/^[‡*+#]\s*/, '')
            if (
              article.length > 2 &&
              estNomArticle(article) &&
              !estLigneNumerique(article) &&
              !articles.find(a => a.article === article)
            ) {
              articles.push({
                id: Date.now() + Math.random(),
                date: dateTicket,
                montant: prix,
                article,
                commercant: commercant || 'Ticket',
                categorie: classerArticle(article),
                source: '🧾'
              })
              traite = true
              break
            }
          }
        }
      }

      if (traite) continue

      // FORMAT 2 : nom sur une ligne, prix sur la ligne suivante
      // Ex: "‡MANGUE EXTRA\n0,600   14,95   8,97"
      if (estNomArticle(ligne) && !estLigneNumerique(ligne)) {
        // Cherche le prix dans les 2 lignes suivantes
        for (let j = i + 1; j <= i + 2 && j < lignes.length; j++) {
          const suivante = lignes[j].trim()
          if (estNomArticle(suivante) && !estLigneNumerique(suivante)) break // nouvelle article
          const prix = extrairePrix(suivante)
          if (prix !== null) {
            const article = ligne.replace(/^[‡*+#]\s*/, '').trim()
            if (!articles.find(a => a.article === article)) {
              articles.push({
                id: Date.now() + Math.random(),
                date: dateTicket,
                montant: prix,
                article,
                commercant: commercant || 'Ticket',
                categorie: classerArticle(article),
                source: '🧾'
              })
            }
            break
          }
        }
      }
    }

    if (articles.length > 0) {
      setApercu({ articles, commercant, dateTicket })
      setEtape(2)
    } else {
      setApercu({ articles: [], commercant, dateTicket })
      setEtape(2)
    }
  }

  const confirmer = () => {
    onImport(apercu.articles)
    setTexte('')
    setApercu(null)
    setEtape(3)
    setTimeout(() => setEtape(1), 2500)
  }

  const reset = () => { setTexte(''); setApercu(null); setEtape(1) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ textAlign: 'center', paddingBottom: 4 }}>
        <h2 style={{ fontFamily: 'Lora', fontSize: 24, color: C.ink }}>Scanner un ticket</h2>
        <p style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>Photo avec Google Lens → Copier le texte → Coller ici</p>
      </div>

      {etape === 3 ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <p style={{ fontWeight: 600, color: C.green, fontSize: 18 }}>Ticket importé !</p>
        </Card>
      ) : etape === 1 ? (
        <Card>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {['1. Photo', '2. Copier', '3. Coller'].map((s, i) => (
              <div key={i} style={{
                flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 10,
                background: i === 2 ? C.accentBg : C.bg,
                border: `1px solid ${i === 2 ? C.accent : C.border}`,
                fontSize: 13, fontWeight: i === 2 ? 600 : 400,
                color: i === 2 ? C.accent : C.muted
              }}>{s}</div>
            ))}
          </div>
          <textarea
            value={texte}
            onChange={e => setTexte(e.target.value)}
            placeholder="Colle ici le texte du ticket…"
            rows={9}
            style={{
              width: '100%', padding: 14, fontSize: 14, borderRadius: 12,
              border: `1.5px solid ${texte ? C.accent : C.border}`,
              background: C.bg, outline: 'none', resize: 'vertical',
              color: C.ink, lineHeight: 1.6, transition: 'border .2s'
            }}
          />
          <Btn
            onClick={analyser}
            disabled={!texte.trim()}
            style={{ width: '100%', marginTop: 12, fontSize: 17, padding: '14px' }}
          >
            📋 Analyser
          </Btn>
        </Card>
      ) : (
        <Card>
          {apercu.articles.length === 0 ? (
            <>
              <div style={{ textAlign: 'center', padding: '16px 0', color: C.muted }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Aucun article détecté</p>
                <p style={{ fontSize: 13 }}>Le format du ticket n'a pas pu être lu. Essaie de recopier les lignes manuellement (article + prix sur chaque ligne).</p>
              </div>
              <Btn onClick={reset} style={{ width: '100%', marginTop: 12 }}>← Réessayer</Btn>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 16 }}>{apercu.commercant || 'Ticket'}</p>
                  <p style={{ color: C.muted, fontSize: 13 }}>{apercu.dateTicket} · {apercu.articles.length} articles</p>
                </div>
                <span style={{ fontFamily: 'Lora', fontSize: 22, fontWeight: 700, color: C.accent }}>
                  {apercu.articles.reduce((s, a) => s + a.montant, 0).toFixed(2)} €
                </span>
              </div>
              <div style={{ maxHeight: 260, overflowY: 'auto', borderRadius: 10, border: `1px solid ${C.border}` }}>
                {apercu.articles.map((a, i) => (
                  <div key={a.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 14px', borderBottom: i < apercu.articles.length - 1 ? `1px solid ${C.border}` : 'none',
                    background: i % 2 === 0 ? C.bg : C.card
                  }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{a.article}</span>
                      <br />
                      <span style={{ fontSize: 12, color: C.muted }}>{CATEGORIES_ICONES[a.categorie] || '📦'} {a.categorie}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: C.ink, fontSize: 15 }}>{a.montant.toFixed(2)} €</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <Btn onClick={reset} variant="secondary" style={{ flex: 1 }}>← Modifier</Btn>
                <Btn onClick={confirmer} style={{ flex: 2 }}>✅ Importer</Btn>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  )
}

// ─── Onglet Résumé ────────────────────────────────────────────────────────────

function OngletResume({ depenses, plafond, setPlafond, moisFiltre, setMoisFiltre, moisDisponibles }) {
  const depensesFiltrees = moisFiltre
    ? depenses.filter(d => extraireMois(d.date) === moisFiltre)
    : depenses

  const total = depensesFiltrees.reduce((s, d) => s + d.montant, 0)
  const pct = Math.round((total / plafond) * 100)
  const reste = plafond - total

  const categories = ['Alimentation','Viandes/Poissons','Fruits','Légumes','Laitiers/Œufs','Boulangerie','Boissons','Sucreries','Épicerie','Loisirs','Transport','Maison','À classer']
  const totauxParCat = categories
    .map(c => ({
      nom: c,
      total: depensesFiltrees.filter(d => d.categorie === c).reduce((s, d) => s + d.montant, 0),
      nombre: depensesFiltrees.filter(d => d.categorie === c).length
    }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total)

  const [editPlafond, setEditPlafond] = useState(false)
  const [tmpPlafond, setTmpPlafond] = useState(plafond)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sélecteur mois */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 20 }}>📅</span>
        <select
          value={moisFiltre}
          onChange={e => setMoisFiltre(e.target.value)}
          style={{
            flex: 1, padding: '10px 14px', fontSize: 16, fontWeight: 600,
            border: `1.5px solid ${C.border}`, borderRadius: 12, background: C.card, color: C.ink
          }}
        >
          <option value="">Tous les mois</option>
          {moisDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {depensesFiltrees.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p style={{ color: C.muted, fontSize: 16 }}>Aucune dépense pour cette période</p>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Commence par scanner un ticket !</p>
        </Card>
      ) : (
        <>
          <BandeauAlerte pct={pct} reste={reste} plafond={plafond} />

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
              <div>
                <p style={{ color: C.muted, fontSize: 13, fontWeight: 500 }}>Total dépensé</p>
                <p style={{ fontFamily: 'Lora', fontSize: 38, fontWeight: 700, color: C.ink, lineHeight: 1 }}>
                  {total.toFixed(2)}<span style={{ fontSize: 20 }}> €</span>
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                {editPlafond ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="number"
                      value={tmpPlafond}
                      onChange={e => setTmpPlafond(Number(e.target.value))}
                      style={{ width: 80, padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${C.accent}`, fontSize: 16 }}
                    />
                    <Btn onClick={() => { setPlafond(tmpPlafond); setEditPlafond(false) }} style={{ padding: '6px 12px', fontSize: 14 }}>OK</Btn>
                  </div>
                ) : (
                  <button
                    onClick={() => { setTmpPlafond(plafond); setEditPlafond(true) }}
                    style={{ background: 'none', border: 'none', textAlign: 'right' }}
                  >
                    <p style={{ color: C.muted, fontSize: 13 }}>Plafond</p>
                    <p style={{ fontFamily: 'Lora', fontSize: 22, fontWeight: 600, color: C.muted }}>
                      {plafond} € <span style={{ fontSize: 14 }}>✏️</span>
                    </p>
                  </button>
                )}
              </div>
            </div>
            <BarreProgression pct={pct} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <Badge color={pct >= 100 ? C.red : pct >= 80 ? C.orange : C.green}>
                {pct}% utilisé
              </Badge>
              <Badge color={reste >= 0 ? C.green : C.red}>
                {reste >= 0 ? `Reste ${reste.toFixed(0)} €` : `Dépassé de ${Math.abs(reste).toFixed(0)} €`}
              </Badge>
            </div>
          </Card>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontFamily: 'Lora', fontSize: 18, fontWeight: 600 }}>📊 Par catégorie</h3>
            </div>
            {totauxParCat.map((c, i) => (
              <div key={c.nom} style={{
                padding: '12px 20px',
                borderBottom: i < totauxParCat.length - 1 ? `1px solid ${C.border}` : 'none',
                background: i % 2 === 0 ? C.card : C.bg
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>
                    {CATEGORIES_ICONES[c.nom] || '📦'} {c.nom}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>
                    {c.total < 1 ? c.total.toFixed(2) : c.total.toFixed(0)} €
                    <span style={{ color: C.muted, fontWeight: 400, fontSize: 13 }}> ({Math.round(c.total / total * 100)}%)</span>
                  </span>
                </div>
                <div style={{ background: C.border, height: 6, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: Math.round(c.total / total * 100) + '%',
                    height: '100%', background: C.accent, borderRadius: 3
                  }} />
                </div>
                <p style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{c.nombre} article{c.nombre > 1 ? 's' : ''}</p>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  )
}

// ─── Onglet Liste ─────────────────────────────────────────────────────────────

function OngletListe({ depenses, supprimer, moisFiltre, moisDisponibles, setMoisFiltre }) {
  const depensesFiltrees = moisFiltre
    ? depenses.filter(d => extraireMois(d.date) === moisFiltre)
    : depenses

  const grouped = depensesFiltrees.reduce((acc, d) => {
    const key = d.date
    if (!acc[key]) acc[key] = []
    acc[key].push(d)
    return acc
  }, {})

  const jours = Object.keys(grouped).sort((a, b) => {
    const parse = d => { const p = d.split('/'); return new Date(p[2], p[1]-1, p[0]) }
    return parse(b) - parse(a)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 20 }}>📅</span>
        <select
          value={moisFiltre}
          onChange={e => setMoisFiltre(e.target.value)}
          style={{
            flex: 1, padding: '10px 14px', fontSize: 16, fontWeight: 600,
            border: `1.5px solid ${C.border}`, borderRadius: 12, background: C.card, color: C.ink
          }}
        >
          <option value="">Tous les mois</option>
          {moisDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {depensesFiltrees.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗒️</div>
          <p style={{ color: C.muted, fontSize: 16 }}>Aucune dépense</p>
        </Card>
      ) : jours.map(jour => (
        <div key={jour}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 8, paddingLeft: 4 }}>{jour}</p>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {grouped[jour].map((d, i) => (
              <div key={d.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px',
                borderBottom: i < grouped[jour].length - 1 ? `1px solid ${C.border}` : 'none',
                background: i % 2 === 0 ? C.card : C.bg
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.source} {d.article}
                  </p>
                  <p style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
                    {d.commercant} · {CATEGORIES_ICONES[d.categorie] || '📦'} {d.categorie}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: /Revenu|Remboursement/.test(d.categorie) ? C.green : C.ink }}>{/Revenu|Remboursement/.test(d.categorie) ? '+' : ''}{d.montant.toFixed(2)} €</span>
                  <button
                    onClick={() => supprimer(d.id)}
                    style={{
                      background: 'none', border: 'none', color: C.border,
                      fontSize: 18, lineHeight: 1, padding: 4, borderRadius: 6,
                      transition: 'color .15s'
                    }}
                    onMouseEnter={e => e.target.style.color = C.red}
                    onMouseLeave={e => e.target.style.color = C.border}
                  >✕</button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      ))}
    </div>
  )
}

// ─── Onglet Relevé PDF ───────────────────────────────────────────────────────

function OngletReleve({ onImport }) {
  const [etape, setEtape] = useState(1)
  const [apercu, setApercu] = useState(null)
  const [erreur, setErreur] = useState('')

  const classerOperation = (libelle) => {
    const l = libelle.toUpperCase()

    // ── Dictionnaire personnalisé ──────────────────────────────────────────
    // Boucherie / Poissonnerie
    if (/VIANDE A PART|BOUCHERIE/.test(l)) return 'Boucherie'
    if (/AU BON PORT|POISSONNIER|POISSONNERIE/.test(l)) return 'Poissonnerie'
    // Primeurs / Marchés
    if (/POMI CHATEAU|SC.PRIM|LAMARC|MIYAM|\bEPI\b|CHAMP DES REVE|RACINES|GOURMET HAUSSM|EATALY|RAP EPICERIE|PRIMEUR|FRESHMILE/.test(l)) return 'Alimentation'
    // Boulangeries
    if (/ATELIER P1|BOULANG|PATISS|PAIN|BRIOCHE/.test(l)) return 'Boulangerie'
    // Transport / Mobilité
    if (/BATOBUS|YEGO|MONTUELLE|FRESHMILE|RATP|SNCF|NAVIGO|TAXI|UBER|VELIB|BUS|METRO|TRAM/.test(l)) return 'Transport'
    // Fleuriste
    if (/FLEURS O NATUR|FLEURISTE|FLEURS/.test(l)) return 'Fleuriste'
    // Bricolage / Loisirs
    if (/BRICO LOISIR|BRICORAMA|LEROY|CASTORAMA|BRICO/.test(l)) return 'Bricolage'
    // Pharmacie / Santé
    if (/SELARL PHARMAC|PHARMACIE|MEDECIN|DOCTEUR|CLINIQUE|HOPITAL/.test(l)) return 'Santé'
    // Restaurants
    if (/LA TABLE D.HAM|AU BON PORT|RESTAURANT|BRASSERIE|BISTROT|PIZZA|BURGER|SUSHI|TRAITEUR|HERME|LADUREE/.test(l)) return 'Restaurant'
    // Alimentation générale
    if (/SUPERMARCHE|MONOPRIX|CARREFOUR|LIDL|ALDI|FRANPRIX|CASINO|INTERMARCHE|LECLERC|PICARD|EPICERIE|NATURALIA/.test(l)) return 'Alimentation'
    // Maison / Energie
    if (/EDF|GDF|ENGIE|ELECTRICITE|GAZ|VEOLIA|LOYER|CHARGES|AMAZON|FNAC|DARTY|IKEA/.test(l)) return 'Maison'
    // Abonnements téléphone / internet
    if (/FREE MOBILE|FREE TELECOM|FREEBOX|ORANGE|SFR|BOUYGUES|TELECOM/.test(l)) return 'Abonnement'
    // Assurances / Mutuelles
    if (/MUTUELLE|ASSURANCE|PREVOYANCE|CNP|KAPASS/.test(l)) return 'Assurance'
    // Paiements en ligne / divers
    if (/PAYPAL/.test(l)) return 'Paiement en ligne'
    // FDJ / Jeux
    if (/\bFDJ\b|EURO MILLION|PMU|LOTO/.test(l)) return 'Loisirs'
    // Revenus
    if (/HUMANIS|AGIRC|ARRCO|MALAKOFF HUMANIS/.test(l)) return 'Revenu AGIRC'
    if (/CNAVTS|ASSURANCE RETRAITE|CNAV/.test(l)) return 'Revenu CNAV'
    if (/VIREMENT DE CPAM|CPAM/.test(l)) return 'Remboursement'
    // Virements envoyés
    if (/VIREMENT INSTANTANE|VIREMENT →/.test(l)) return 'Virement envoyé'
    // Loisirs
    if (/SPORT|GYM|PISCINE|CINEMA|MUSEE|THEATRE/.test(l)) return 'Loisirs'
    // Cotisations
    if (/COTISATION|ABONNEMENT/.test(l)) return 'Abonnement'
    return 'À classer'
  }

  const analyserTexte = (texte) => {
    const lignes = texte.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    const operations = []

    const estDate = (s) => /^\d{2}\/\d{2}$/.test(s)
    const estMontant = (s) => /^\d+[,.]\d{2}$/.test(s)
    const IGNORER = /^CARTE NUMERO|^ARRCO|^AGIRC|^MALAKOFF|^REFERENCE|^MANDAT|^IDENT|^REF :|^ATP|^252|^019|^IBAN|^BIC/i
    const CREDITS = /^$/i  // Plus d'exclusion automatique — on classe tout

    const nettoyerLib = (s) => s
      .replace(/ACHAT CB\s*/ig, '')
      .replace(/PRELEVEMENT DE\s*/ig, '')
      .replace(/VIREMENT INSTANTANE A\s*/ig, 'Virement ')
      .replace(/\d{2}\.\d{2}\.\d{2,4}/g, '')
      .replace(/\s+/g, ' ').trim()

    const faireDate = (jm) => {
      const [j, m] = jm.split('/')
      const an = new Date().getFullYear()
      const annee = parseInt(m) > new Date().getMonth() + 1 ? an - 1 : an
      return j + '/' + m + '/' + annee
    }

    const ajouterOp = (jm, lib, mont) => {
      if (!jm || !lib || !mont) return
      const montant = parseFloat(mont.replace(',', '.'))
      if (montant <= 0 || montant > 10000) return
      let libelle = nettoyerLib(lib)
      if (libelle.length < 2) return
      if (IGNORER.test(libelle) || CREDITS.test(libelle)) return
      operations.push({
        id: Date.now() + Math.random(),
        date: faireDate(jm),
        montant,
        article: libelle,
        commercant: 'Banque Postale',
        categorie: classerOperation(libelle),
        source: '\uD83C\uDFE6'
      })
    }

    // Détecte le FORMAT 3 COLONNES (PDF Expert) :
    // Section "Date" puis toutes les dates, section "Opérations" puis tous les libellés, section "Débit" puis tous les montants
    const idxDate = lignes.findIndex(l => l === 'Date')
    const idxOps = lignes.findIndex(l => /^Op.rations$|^Operations$/.test(l))
    const idxDebit = lignes.findIndex(l => /D.bit|Cr.dit/.test(l))

    if (idxDate !== -1 && idxOps !== -1 && idxDebit !== -1) {
      // Extraire les 3 colonnes
      const dates = lignes.slice(idxDate + 1, idxOps).filter(l => estDate(l))
      const libsBruts = lignes.slice(idxOps + 1, idxDebit)
      const monts = lignes.slice(idxDebit + 1).filter(l => estMontant(l))

      // Nettoyer les libellés : supprimer CARTE NUMERO et lignes parasites, garder un libellé par opération
      const libs = []
      for (const l of libsBruts) {
        if (IGNORER.test(l)) continue
        if (estDate(l)) continue
        if (l.length < 2) continue
        // Si la ligne contient plusieurs opérations fusionnées (CARTE NUMERO au milieu), split
        const parts = l.split(/CARTE NUMERO \d+/i).map(p => p.trim()).filter(p => p.length > 2)
        for (const p of parts) {
          if (!IGNORER.test(p)) libs.push(p)
        }
      }

      const n = Math.min(dates.length, libs.length, monts.length)
      for (let i = 0; i < n; i++) {
        ajouterOp(dates[i], libs[i], monts[i])
      }
      return operations
    }

    // FORMAT LIGNE PAR LIGNE : "31/07 ACHAT CB MIYAM 3,75" ou date+libellé+montant séparés
    let i = 0
    while (i < lignes.length) {
      const ligne = lignes[i]

      // Ligne complète avec date + libellé + montant
      const m1 = ligne.match(/^(\d{2}\/\d{2})\s+(.+?)\s+(\d+[,.]\d{2})$/)
      if (m1) {
        ajouterOp(m1[1], m1[2], m1[3])
        i++; continue
      }

      // Date seule → cherche libellé et montant sur lignes suivantes
      if (estDate(ligne)) {
        let lib = '', mont = null, j = i + 1
        while (j < lignes.length && j < i + 6) {
          const l = lignes[j]
          if (estDate(l)) break
          if (IGNORER.test(l)) { j++; continue }
          if (estMontant(l) && !mont) { mont = l; j++; break }
          if (!lib && l.length > 2 && !CREDITS.test(l)) lib = l
          j++
        }
        ajouterOp(ligne, lib, mont)
        i = j; continue
      }

      i++
    }
    return operations
  }


  const gererUpload = (e) => {
    const fichier = e.target.files[0]
    if (!fichier) return
    setErreur('')

    if (fichier.type === 'application/pdf') {
      setErreur('PDF détecté — colle le texte copié depuis le PDF ci-dessous')
      setEtape('texte')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const texte = ev.target.result
      const ops = analyserTexte(texte)
      if (ops.length > 0) {
        setApercu(ops)
        setEtape(2)
      } else {
        setErreur('Aucune opération détectée. Essaie de coller le texte manuellement.')
        setEtape('texte')
      }
    }
    reader.readAsText(fichier)
  }

  const [texteColle, setTexteColle] = useState('')

  const analyserColle = () => {
    const ops = analyserTexte(texteColle)
    if (ops.length > 0) {
      setApercu(ops)
      setEtape(2)
    } else {
      setErreur('Aucune opération reconnue. Vérifie que le texte contient bien des dates (01/04, 31/03…) et des montants.')
    }
  }

  const confirmer = () => {
    onImport(apercu)
    setApercu(null)
    setTexteColle('')
    setEtape(3)
    setTimeout(() => setEtape(1), 2500)
  }

  const supprimerOp = (id) => setApercu(apercu.filter(op => op.id !== id))

  const reset = () => { setApercu(null); setEtape(1); setErreur('') }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ textAlign: 'center', paddingBottom: 4 }}>
        <h2 style={{ fontFamily: 'Lora', fontSize: 24, color: C.ink }}>Relevé Banque Postale</h2>
        <p style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>Importe tes opérations depuis ton relevé PDF</p>
      </div>

      {etape === 3 ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <p style={{ fontWeight: 600, color: C.green, fontSize: 18 }}>Relevé importé !</p>
        </Card>

      ) : etape === 2 ? (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16 }}>Banque Postale</p>
              <p style={{ color: C.muted, fontSize: 13 }}>{apercu.length} opérations détectées</p>
            </div>
            <span style={{ fontFamily: 'Lora', fontSize: 22, fontWeight: 700, color: C.accent }}>
              {apercu.reduce((s, a) => s + a.montant, 0).toFixed(2)} €
            </span>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto', borderRadius: 10, border: `1px solid ${C.border}` }}>
            {apercu.map((op, i) => (
              <div key={op.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 14px',
                borderBottom: i < apercu.length - 1 ? `1px solid ${C.border}` : 'none',
                background: i % 2 === 0 ? C.bg : C.card
              }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{op.article}</span><br />
                  <span style={{ fontSize: 12, color: C.muted }}>{op.date} · {CATEGORIES_ICONES[op.categorie] || '📦'} {op.categorie}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{op.montant.toFixed(2)} €</span>
                  <button onClick={() => supprimerOp(op.id)} style={{ background: 'none', border: 'none', color: C.border, fontSize: 18, cursor: 'pointer', padding: 4 }}
                    onMouseEnter={e => e.target.style.color = C.red}
                    onMouseLeave={e => e.target.style.color = C.border}>✕</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <Btn onClick={reset} variant="secondary" style={{ flex: 1 }}>← Modifier</Btn>
            <Btn onClick={confirmer} style={{ flex: 2 }}>✅ Importer tout</Btn>
          </div>
        </Card>

      ) : (
        <Card>
          <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 12, color: C.ink }}>
            Comment importer ton relevé :
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {[
              { n: '1', txt: 'Ouvre ton relevé PDF sur ton Mac' },
              { n: '2', txt: 'Cmd+A pour tout sélectionner, Cmd+C pour copier' },
              { n: '3', txt: 'Colle le texte ci-dessous' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', background: C.accent,
                  color: '#fff', fontWeight: 700, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>{s.n}</div>
                <span style={{ fontSize: 14, color: C.ink, paddingTop: 4 }}>{s.txt}</span>
              </div>
            ))}
          </div>

          <textarea
            value={texteColle}
            onChange={e => setTexteColle(e.target.value)}
            placeholder="Colle ici le texte du relevé PDF…"
            rows={8}
            style={{
              width: '100%', padding: 14, fontSize: 13, borderRadius: 12,
              border: `1.5px solid ${texteColle ? C.accent : C.border}`,
              background: C.bg, color: C.ink, resize: 'vertical', outline: 'none',
              lineHeight: 1.6, boxSizing: 'border-box'
            }}
          />
          {erreur && (
            <p style={{ color: C.red, fontSize: 13, marginTop: 8, fontWeight: 500 }}>⚠️ {erreur}</p>
          )}
          <Btn
            onClick={analyserColle}
            disabled={!texteColle.trim()}
            style={{ width: '100%', marginTop: 12, fontSize: 17, padding: '14px' }}
          >
            🏦 Analyser le relevé
          </Btn>
        </Card>
      )}
    </div>
  )
}

// ─── App principale ───────────────────────────────────────────────────────────

export default function App() {
  const [depenses, setDepenses] = useState(() => {
    try {
      const s = localStorage.getItem('budget-foyer-depenses')
      return s ? JSON.parse(s) : []
    } catch { return [] }
  })
  const [plafond, setPlafond] = useState(() => {
    return Number(localStorage.getItem('budget-foyer-plafond') || 1500)
  })
  const [onglet, setOnglet] = useState('resume')
  const [moisFiltre, setMoisFiltre] = useState(() => {
    const d = new Date()
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  })

  const sauver = (d) => {
    localStorage.setItem('budget-foyer-depenses', JSON.stringify(d))
    setDepenses(d)
  }

  useEffect(() => {
    localStorage.setItem('budget-foyer-plafond', plafond)
  }, [plafond])

  const supprimer = (id) => sauver(depenses.filter(d => d.id !== id))

  const onImport = (articles) => {
    if (articles.length > 0) {
      // Anti-doublons : ignore si même article + montant + date existe déjà
      const nouveaux = articles.filter(a =>
        !depenses.find(d => d.article === a.article && d.montant === a.montant && d.date === a.date)
      )
      if (nouveaux.length > 0) sauver([...nouveaux, ...depenses])
    }
  }

  const moisDisponibles = [...new Set(
    depenses.map(d => extraireMois(d.date)).filter(Boolean)
  )].sort().reverse()

  const ONGLETS = [
    { id: 'resume',  label: 'Résumé',  icon: '📊' },
    { id: 'ticket',  label: 'Ticket',  icon: '🧾' },
    { id: 'releve',  label: 'Relevé',  icon: '🏦' },
    { id: 'liste',   label: 'Liste',   icon: '🗒️' },
  ]

  return (
    <>
      <style>{fonts + globalStyle}</style>
      <div style={{ minHeight: '100dvh', background: C.bg, paddingBottom: 90 }}>
        {/* Header */}
        <div style={{
          background: C.card, borderBottom: `1px solid ${C.border}`,
          padding: '18px 20px 14px', position: 'sticky', top: 0, zIndex: 10,
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
        }}>
          <h1 style={{ fontFamily: 'Lora', fontSize: 26, fontWeight: 700, color: C.ink }}>
            💰 Budget Foyer
          </h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>
            {depenses.length} article{depenses.length !== 1 ? 's' : ''} enregistré{depenses.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Contenu */}
        <div style={{ padding: '20px 16px', maxWidth: 560, margin: '0 auto' }}>
          {onglet === 'resume' && (
            <OngletResume
              depenses={depenses}
              plafond={plafond}
              setPlafond={setPlafond}
              moisFiltre={moisFiltre}
              setMoisFiltre={setMoisFiltre}
              moisDisponibles={moisDisponibles}
            />
          )}
          {onglet === 'ticket' && <OngletTicket onImport={onImport} />}
          {onglet === 'releve' && <OngletReleve onImport={onImport} />}
          {onglet === 'liste' && (
            <OngletListe
              depenses={depenses}
              supprimer={supprimer}
              moisFiltre={moisFiltre}
              setMoisFiltre={setMoisFiltre}
              moisDisponibles={moisDisponibles}
            />
          )}
        </div>
      </div>

      {/* Navigation bas — style app mobile */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: C.card, borderTop: `1px solid ${C.border}`,
        display: 'flex', boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
        zIndex: 20, paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        {ONGLETS.map(o => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            style={{
              flex: 1, padding: '12px 8px 10px', background: 'none', border: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              transition: 'background .15s', borderRadius: 0
            }}
          >
            <span style={{ fontSize: 22 }}>{o.icon}</span>
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: onglet === o.id ? C.accent : C.muted,
              borderBottom: onglet === o.id ? `2px solid ${C.accent}` : '2px solid transparent',
              paddingBottom: 2
            }}>
              {o.label}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}