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
  if (/MANGUE|POMME|BANANE|CERISE|KIWI|ORANGE|FRAISE|FRUIT|ANANAS|MELON|PECHE|POIRE|RAISIN|ABRICOT|PRUNE/.test(a)) return 'Fruits'
  if (/SALADE|TOMATE|CAROTTE|OIGNON|POIVRON|COURGETTE|LEGUME|BROCOLI|EPINARD|HARICOT|POIREAU|AUBERGINE|CHAMPIGNON/.test(a)) return 'Légumes'
  if (/LAIT|BEURRE|YAOURT|FROMAGE|CREME|OEUF/.test(a)) return 'Laitiers/Œufs'
  if (/PAIN|BAGUETTE|CROISSANT|BRIOCHE|VIENNOIS/.test(a)) return 'Boulangerie'
  if (/EAU|JUS|SODA|BIERE|VIN|BOISSON|LIMONADE|SIROP/.test(a)) return 'Boissons'
  if (/GATEAU|CHOCOLAT|BONBON|BISCUIT|TARTE|CONFITURE|MIEL/.test(a)) return 'Sucreries'
  return 'Épicerie'
}

const nettoyer = (texte) => {
  return texte.split('\n').map(l => l.replace(/[^\x20-\x7E\xA0-\xFF\n]/g, ' ').trim()).filter(l => l.length > 1).join('\n')
}

const extraireMois = (date) => {
  const p = date.split('/')
  if (p.length < 2) return null
  const a = p.length === 3 ? (p[2].length === 2 ? '20' + p[2] : p[2]) : '2025'
  return new Date(a, p[1] - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const CATEGORIES_ICONES = {
  'Viandes/Poissons': '🥩', 'Fruits': '🍎', 'Légumes': '🥦', 'Laitiers/Œufs': '🥛',
  'Boulangerie': '🥖', 'Boissons': '🧃', 'Sucreries': '🍫', 'Épicerie': '🛒',
  'Alimentation': '🍽️', 'Loisirs': '🎭', 'Transport': '🚌', 'Maison': '🏠', 'À classer': '📋',
}

// ─── Caisses de retraite ─────────────────────────────────────────────────────
const CAISSES = [
  { nom: 'CNAV', frequence: 'Mensuelle', mois: [] },
  { nom: 'AGIRC-ARRCO', frequence: 'Mensuelle', mois: [] },
  { nom: 'RENTE-AT', frequence: 'Trimestrielle', mois: ['Janvier', 'Avril', 'Juillet', 'Octobre'] },
  { nom: 'IRCANTEC', frequence: 'Annuelle', mois: ['Janvier'] },
  { nom: 'INPS', frequence: 'Semestrielle', mois: ['Janvier', 'Juillet'] },
]

// ─── Composants UI ────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: C.shadow, padding: 20, ...style }}>{children}</div>
}

function Btn({ children, onClick, variant = 'primary', style = {}, disabled = false }) {
  const styles = {
    primary: { background: C.accent, color: '#fff' },
    secondary: { background: C.bg, color: C.ink, border: `1px solid ${C.border}` },
    ghost: { background: 'transparent', color: C.blue },
    danger: { background: C.redBg, color: C.red, border: `1px solid ${C.red}33` },
  }
  return <button onClick={onClick} disabled={disabled} style={{ padding: '12px 18px', borderRadius: 12, fontWeight: 600, fontSize: 16, border: 'none', opacity: disabled ? 0.5 : 1, ...styles[variant], ...style }}>{children}</button>
}

function Badge({ children, color = C.muted }) {
  return <span style={{ background: color + '22', color, fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>{children}</span>
}

function BarreProgression({ pct }) {
  const couleur = pct >= 100 ? C.red : pct >= 80 ? C.orange : C.green
  return <div style={{ background: C.border, height: 10, borderRadius: 5, overflow: 'hidden' }}><div style={{ width: Math.min(pct, 100) + '%', height: '100%', background: couleur, borderRadius: 5 }} /></div>
}

// ─── Onglet Revenus ───────────────────────────────────────────────────────────
function OngletRevenus({ depenses, onImport }) {
  const [montant, setMontant] = useState('')
  const [caisse, setCaisse] = useState('CNAV')
  const [dateRevenu, setDateRevenu] = useState(new Date().toLocaleDateString('fr-FR'))
  const revenus = depenses.filter(d => d.source === '💰')
  const getDiviseur = (f) => { switch (f) { case 'Trimestrielle': return 3; case 'Semestrielle': return 6; case 'Annuelle': return 12; default: return 1 } }
  const totalMensuel = revenus.reduce((s, r) => { const c = CAISSES.find(c => c.nom === r.article); return s + (r.montant / (c ? getDiviseur(c.frequence) : 1)) }, 0)
  const resumeParCaisse = CAISSES.map(c => { const total = revenus.filter(r => r.article === c.nom).reduce((s, r) => s + r.montant, 0); return { ...c, total, mensuel: total / getDiviseur(c.frequence) } }).filter(c => c.total > 0)

  const ajouterRevenu = () => {
    if (!montant) return
    onImport([{ id: Date.now(), date: dateRevenu, montant: parseFloat(montant.replace(',', '.')), article: caisse, commercant: caisse, categorie: 'Revenu', source: '💰' }])
    setMontant('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ fontFamily: 'Lora', fontSize: 22, color: C.ink, textAlign: 'center' }}>💰 Revenus</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card style={{ background: C.greenBg, border: `1px solid ${C.green}44`, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>Mensuel</p>
          <p style={{ fontFamily: 'Lora', fontSize: 32, fontWeight: 700, color: C.green }}>{totalMensuel.toFixed(0)} €</p>
        </Card>
        <Card>
          <select value={caisse} onChange={e => setCaisse(e.target.value)} style={{ padding: 8, fontSize: 14, borderRadius: 8, border: `1px solid ${C.border}`, width: '100%', marginBottom: 6 }}>
            {CAISSES.map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
          </select>
          <input type="number" placeholder="Montant (€)" value={montant} onChange={e => setMontant(e.target.value)} style={{ padding: 8, fontSize: 14, borderRadius: 8, border: `1px solid ${C.border}`, width: '100%', marginBottom: 6 }} />
          <Btn onClick={ajouterRevenu} disabled={!montant} style={{ width: '100%', padding: 8, fontSize: 14 }}>Ajouter</Btn>
        </Card>
      </div>
      {resumeParCaisse.length > 0 && (
        <Card style={{ padding: 12 }}>
          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>📋 Résumé par caisse</p>
          {resumeParCaisse.map((c, i) => (
            <div key={c.nom} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < resumeParCaisse.length - 1 ? `1px solid ${C.border}` : 'none', fontSize: 14 }}>
              <span><b>{c.nom}</b> <span style={{ color: C.muted, fontSize: 12 }}>{c.frequence}</span></span>
              <span style={{ fontWeight: 700, color: C.green }}>{c.mensuel.toFixed(0)} €/mois</span>
            </div>
          ))}
        </Card>
      )}
      {revenus.length > 0 && (
        <details style={{ marginTop: 4 }}>
          <summary style={{ cursor: 'pointer', color: C.muted, fontSize: 14, fontWeight: 600 }}>📜 Historique ({revenus.length} versement{revenus.length > 1 ? 's' : ''})</summary>
          <Card style={{ padding: 12, marginTop: 8 }}>
            {revenus.sort((a, b) => new Date(b.date.split('/').reverse().join('-')) - new Date(a.date.split('/').reverse().join('-'))).map((r, i) => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < revenus.length - 1 ? `1px solid ${C.border}` : 'none', fontSize: 14 }}>
                <div><b>{r.article}</b><br /><span style={{ fontSize: 12, color: C.muted }}>{r.date}</span></div>
                <span style={{ fontWeight: 700, color: C.green }}>+{r.montant.toFixed(2)} €</span>
              </div>
            ))}
          </Card>
        </details>
      )}
      <Card style={{ padding: 12 }}>
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>📅 Calendrier des caisses</p>
        {CAISSES.map(c => (
          <div key={c.nom} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' }}>
            <span>{c.nom}</span>
            <span style={{ color: C.muted }}>{c.frequence}{c.mois.length > 0 ? ' · ' + c.mois.join(', ') : ''}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ─── Onglet Résumé ────────────────────────────────────────────────────────────
function OngletResume({ depenses, plafond, setPlafond, moisFiltre, setMoisFiltre, moisDisponibles }) {
  const depensesFiltrees = moisFiltre ? depenses.filter(d => extraireMois(d.date) === moisFiltre) : depenses
  const depensesReelles = depensesFiltrees.filter(d => d.source !== '💰')
  const revenusFiltres = depensesFiltrees.filter(d => d.source === '💰')
  const totalDepenses = depensesReelles.reduce((s, d) => s + d.montant, 0)
  const getDiviseur = (f) => { switch (f) { case 'Trimestrielle': return 3; case 'Semestrielle': return 6; case 'Annuelle': return 12; default: return 1 } }
  const totalRevenus = revenusFiltres.reduce((s, r) => { const c = CAISSES.find(c => c.nom === r.article); return s + (r.montant / (c ? getDiviseur(c.frequence) : 1)) }, 0)
  const pct = Math.round((totalDepenses / plafond) * 100)
  const reste = plafond - totalDepenses

  const categories = ['Alimentation','Viandes/Poissons','Fruits','Légumes','Laitiers/Œufs','Boulangerie','Boissons','Sucreries','Épicerie','Loisirs','Transport','Maison','À classer']
  const totauxParCat = categories.map(c => ({ nom: c, total: depensesReelles.filter(d => d.categorie === c).reduce((s, d) => s + d.montant, 0), nombre: depensesReelles.filter(d => d.categorie === c).length })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const [editPlafond, setEditPlafond] = useState(false)
  const [tmpPlafond, setTmpPlafond] = useState(plafond)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 20 }}>📅</span>
        <select value={moisFiltre} onChange={e => setMoisFiltre(e.target.value)} style={{ flex: 1, padding: '10px 14px', fontSize: 16, fontWeight: 600, border: `1.5px solid ${C.border}`, borderRadius: 12, background: C.card, color: C.ink }}>
          <option value="">Tous les mois</option>
          {moisDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {totalRevenus > 0 && (
        <Card style={{ background: C.greenBg, border: `1px solid ${C.green}44` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>💰 Revenus du mois</span>
            <span style={{ fontFamily: 'Lora', fontSize: 24, fontWeight: 700, color: C.green }}>+{totalRevenus.toFixed(0)} €</span>
          </div>
        </Card>
      )}

      {totalDepenses > 0 ? (
        <>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
              <div>
                <p style={{ color: C.muted, fontSize: 13 }}>Total dépensé</p>
                <p style={{ fontFamily: 'Lora', fontSize: 38, fontWeight: 700, color: C.ink }}>{totalDepenses.toFixed(0)}<span style={{ fontSize: 20 }}> €</span></p>
              </div>
              <div style={{ textAlign: 'right' }}>
                {editPlafond ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input type="number" value={tmpPlafond} onChange={e => setTmpPlafond(Number(e.target.value))} style={{ width: 80, padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${C.accent}`, fontSize: 16 }} />
                    <Btn onClick={() => { setPlafond(tmpPlafond); setEditPlafond(false) }} style={{ padding: '6px 12px', fontSize: 14 }}>OK</Btn>
                  </div>
                ) : (
                  <button onClick={() => { setTmpPlafond(plafond); setEditPlafond(true) }} style={{ background: 'none', border: 'none', textAlign: 'right' }}>
                    <p style={{ color: C.muted, fontSize: 13 }}>Plafond</p>
                    <p style={{ fontFamily: 'Lora', fontSize: 22, fontWeight: 600, color: C.muted }}>{plafond} € <span style={{ fontSize: 14 }}>✏️</span></p>
                  </button>
                )}
              </div>
            </div>
            <BarreProgression pct={pct} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <Badge color={pct >= 100 ? C.red : pct >= 80 ? C.orange : C.green}>{pct}% utilisé</Badge>
              <Badge color={reste >= 0 ? C.green : C.red}>{reste >= 0 ? `Reste ${reste.toFixed(0)} €` : `Dépassé de ${Math.abs(reste).toFixed(0)} €`}</Badge>
            </div>
          </Card>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontFamily: 'Lora', fontSize: 18, fontWeight: 600 }}>📊 Par catégorie</h3>
            </div>
            {totauxParCat.map((c, i) => (
              <div key={c.nom} style={{ padding: '12px 20px', borderBottom: i < totauxParCat.length - 1 ? `1px solid ${C.border}` : 'none', background: i % 2 === 0 ? C.card : C.bg }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{CATEGORIES_ICONES[c.nom] || '📦'} {c.nom}</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{c.total.toFixed(0)} € <span style={{ color: C.muted, fontWeight: 400, fontSize: 13 }}>({Math.round(c.total / totalDepenses * 100)}%)</span></span>
                </div>
                <div style={{ background: C.border, height: 6, borderRadius: 3, overflow: 'hidden' }}><div style={{ width: Math.round(c.total / totalDepenses * 100) + '%', height: '100%', background: C.accent, borderRadius: 3 }} /></div>
              </div>
            ))}
          </Card>
        </>
      ) : (
        <Card style={{ textAlign: 'center', padding: 48 }}><div style={{ fontSize: 48 }}>📭</div><p style={{ color: C.muted, fontSize: 16 }}>Aucune dépense pour cette période</p></Card>
      )}
    </div>
  )
}

// ─── Onglet Ticket ────────────────────────────────────────────────────────────
function OngletTicket({ onImport }) {
  const [texte, setTexte] = useState('')
  const [apercu, setApercu] = useState(null)
  const [etape, setEtape] = useState(1)

  const analyser = () => {
    const propre = nettoyer(texte)
    const lignes = propre.split('\n')
    const articles = []
    let commercant = '', dateTicket = ''
    for (const ligne of lignes.slice(0, 5)) { const l = ligne.trim(); if (l.length > 3 && !/[:\d]/.test(l.slice(0, 3)) && !l.startsWith('TEL') && !l.startsWith('#')) { commercant = l; break } }
    for (const ligne of lignes) { const m = ligne.match(/(\d{2}[-/]\d{2}[-/]\d{2,4})/); if (m) { dateTicket = m[1].replace(/-/g, '/'); break } }
    if (!dateTicket) dateTicket = new Date().toLocaleDateString('fr-FR')
    for (const ligne of lignes) {
      const flat = ligne.trim().split(/\s+/)
      if (flat.length >= 2) {
        const dernier = flat[flat.length - 1]; const prix = parseFloat(dernier.replace(',', '.'))
        if (prix > 0.05 && prix < 999 && /^\d/.test(dernier)) {
          const article = flat.slice(0, -1).join(' ').trim().replace(/^[‡*+#]\s*/, '')
          if (article.length > 2 && !/TOTAL|CARTE|ESPECE|MERCI|TEL|RCS|SIRET/i.test(article)) {
            articles.push({ id: Date.now() + Math.random(), date: dateTicket, montant: prix, article, commercant: commercant || 'Ticket', categorie: classerArticle(article), source: '🧾' })
          }
        }
      }
    }
    setApercu({ articles, commercant, dateTicket })
    setEtape(articles.length > 0 ? 2 : 2)
  }

  const confirmer = () => { onImport(apercu.articles); setTexte(''); setApercu(null); setEtape(3); setTimeout(() => setEtape(1), 2500) }
  const reset = () => { setTexte(''); setApercu(null); setEtape(1) }

  if (etape === 3) return <Card style={{ textAlign: 'center', padding: 40 }}><div style={{ fontSize: 48 }}>✅</div><p style={{ fontWeight: 600, color: C.green, fontSize: 18 }}>Ticket importé !</p></Card>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ textAlign: 'center' }}><h2 style={{ fontFamily: 'Lora', fontSize: 24 }}>🧾 Scanner un ticket</h2></div>
      {etape === 1 ? (
        <Card>
          <input type="file" id="camera-input" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => {
            const fichier = e.target.files?.[0]
            if (!fichier) return
            alert('Photo prise : ' + fichier.name + '\n\nUtilisez Google Photos pour extraire le texte, puis collez-le ici.')
          }} />
          <Btn onClick={() => document.getElementById('camera-input')?.click()} style={{ width: '100%', marginBottom: 12, fontSize: 16, padding: '14px', background: '#4A90D9', color: '#fff' }}>📷 Photographier un ticket</Btn>
          <div style={{ textAlign: 'center', color: C.muted, marginBottom: 12 }}>— ou collez le texte —</div>
          <textarea value={texte} onChange={e => setTexte(e.target.value)} placeholder="Colle ici le texte du ticket…" rows={9} style={{ width: '100%', padding: 14, fontSize: 14, borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.bg, outline: 'none', resize: 'vertical', color: C.ink, lineHeight: 1.6 }} />
          <Btn onClick={analyser} disabled={!texte.trim()} style={{ width: '100%', marginTop: 12, fontSize: 17, padding: '14px' }}>📋 Analyser</Btn>
        </Card>
      ) : (
        <Card>
          {apercu.articles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: C.muted }}><p style={{ fontWeight: 600 }}>Aucun article détecté</p><Btn onClick={reset} style={{ width: '100%', marginTop: 12 }}>← Réessayer</Btn></div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div><p style={{ fontWeight: 700 }}>{apercu.commercant}</p><p style={{ color: C.muted, fontSize: 13 }}>{apercu.dateTicket} · {apercu.articles.length} articles</p></div>
                <span style={{ fontFamily: 'Lora', fontSize: 22, fontWeight: 700, color: C.accent }}>{apercu.articles.reduce((s, a) => s + a.montant, 0).toFixed(2)} €</span>
              </div>
              <div style={{ maxHeight: 260, overflowY: 'auto', borderRadius: 10, border: `1px solid ${C.border}` }}>
                {apercu.articles.map((a, i) => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', borderBottom: i < apercu.articles.length - 1 ? `1px solid ${C.border}` : 'none', background: i % 2 === 0 ? C.bg : C.card }}>
                    <div><span style={{ fontSize: 14, fontWeight: 500 }}>{a.article}</span><br /><span style={{ fontSize: 12, color: C.muted }}>{CATEGORIES_ICONES[a.categorie] || '📦'} {a.categorie}</span></div>
                    <span style={{ fontWeight: 700 }}>{a.montant.toFixed(2)} €</span>
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

// ─── Onglet Relevé ────────────────────────────────────────────────────────────
function OngletReleve({ onImport }) {
  const [texteColle, setTexteColle] = useState('')
  const [apercu, setApercu] = useState(null)
  const [etape, setEtape] = useState(1)

  const analyserColle = () => {
    const lignes = texteColle.split('\n').map(l => l.trim()).filter(l => l.length > 2)
    const operations = []
    for (let i = 1; i < lignes.length; i++) {
      const colonnes = lignes[i].split(';')
      if (colonnes.length < 3) continue
      const dateOp = colonnes[0]?.trim()
      let libelle = colonnes[1]?.trim().replace(/"/g, '') || ''
      const debit = parseFloat((colonnes[2] || '0').replace(',', '.').replace(/−/g, '-'))
      const credit = parseFloat((colonnes[3] || '0').replace(',', '.').replace(/−/g, '-'))
      if (!dateOp?.match(/^\d{2}\/\d{2}/)) continue
      if (/VIREMENT|VIR SEPA|RETRAITE|PENSION|CNAV|CAF|ALLOCATION|AGIRC|ARRCO|PRESTATIONS|EASYBOURSE/i.test(libelle)) continue
      if (credit > 0 && debit === 0) continue
      if (debit > 0 && credit === 0) continue
      const montant = Math.abs(debit || credit)
      libelle = libelle.replace(/^CARTE \d{2}\/\d{2}\/\d{2} /i, '').replace(/ACHAT CB /i, '').replace(/\d{2}\.\d{2}\.\d{2,4}/g, '').replace(/\s+/g, ' ').trim()
      operations.push({ id: Date.now() + Math.random(), date: dateOp, montant, article: libelle, commercant: libelle.split(' ')[0], categorie: 'À classer', source: '🏦' })
    }
    setApercu(operations)
    setEtape(2)
  }

  const confirmer = () => { onImport(apercu); setApercu(null); setTexteColle(''); setEtape(3); setTimeout(() => setEtape(1), 2500) }
  const reset = () => { setApercu(null); setEtape(1) }

  if (etape === 3) return <Card style={{ textAlign: 'center', padding: 40 }}><div style={{ fontSize: 48 }}>✅</div><p style={{ fontWeight: 600, color: C.green, fontSize: 18 }}>Relevé importé !</p></Card>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ textAlign: 'center' }}><h2 style={{ fontFamily: 'Lora', fontSize: 24 }}>🏦 Relevé Banque Postale</h2></div>
      {etape === 1 ? (
        <Card>
          <textarea value={texteColle} onChange={e => setTexteColle(e.target.value)} placeholder="Colle ici le texte du relevé (CSV avec ;)…" rows={8} style={{ width: '100%', padding: 14, fontSize: 13, borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.bg, color: C.ink, resize: 'vertical', outline: 'none', lineHeight: 1.6 }} />
          <Btn onClick={analyserColle} disabled={!texteColle.trim()} style={{ width: '100%', marginTop: 12, fontSize: 17, padding: '14px' }}>🏦 Analyser</Btn>
        </Card>
      ) : (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontWeight: 700 }}>{apercu.length} opérations détectées</p>
            <span style={{ fontFamily: 'Lora', fontSize: 22, fontWeight: 700, color: C.accent }}>{apercu.reduce((s, a) => s + a.montant, 0).toFixed(2)} €</span>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto', borderRadius: 10, border: `1px solid ${C.border}` }}>
            {apercu.map((op, i) => (
              <div key={op.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', borderBottom: i < apercu.length - 1 ? `1px solid ${C.border}` : 'none', background: i % 2 === 0 ? C.bg : C.card }}>
                <div><span style={{ fontSize: 14, fontWeight: 500 }}>{op.article}</span><br /><span style={{ fontSize: 12, color: C.muted }}>{op.date}</span></div>
                <span style={{ fontWeight: 700 }}>{op.montant.toFixed(2)} €</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <Btn onClick={reset} variant="secondary" style={{ flex: 1 }}>← Modifier</Btn>
            <Btn onClick={confirmer} style={{ flex: 2 }}>✅ Importer tout</Btn>
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Onglet Liste ─────────────────────────────────────────────────────────────
function OngletListe({ depenses, supprimer, moisFiltre, moisDisponibles, setMoisFiltre }) {
  const depensesFiltrees = moisFiltre ? depenses.filter(d => extraireMois(d.date) === moisFiltre) : depenses
  const grouped = depensesFiltrees.reduce((acc, d) => { const key = d.date; if (!acc[key]) acc[key] = []; acc[key].push(d); return acc }, {})
  const jours = Object.keys(grouped).sort((a, b) => { const parse = d => { const p = d.split('/'); return new Date(p[2], p[1]-1, p[0]) }; return parse(b) - parse(a) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 20 }}>📅</span>
        <select value={moisFiltre} onChange={e => setMoisFiltre(e.target.value)} style={{ flex: 1, padding: '10px 14px', fontSize: 16, fontWeight: 600, border: `1.5px solid ${C.border}`, borderRadius: 12, background: C.card, color: C.ink }}>
          <option value="">Tous les mois</option>
          {moisDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      {depensesFiltrees.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}><div style={{ fontSize: 48 }}>🗒️</div><p style={{ color: C.muted }}>Aucune dépense</p></Card>
      ) : jours.map(jour => (
        <div key={jour}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 8 }}>{jour}</p>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {grouped[jour].map((d, i) => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < grouped[jour].length - 1 ? `1px solid ${C.border}` : 'none', background: i % 2 === 0 ? C.card : C.bg }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{d.source} {d.article}</p>
                  <p style={{ color: C.muted, fontSize: 12 }}>{d.commercant} · {CATEGORIES_ICONES[d.categorie] || '📦'} {d.categorie}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: d.source === '💰' ? C.green : C.ink }}>{d.source === '💰' ? '+' : ''}{d.montant.toFixed(2)} €</span>
                  <button onClick={() => supprimer(d.id)} style={{ background: 'none', border: 'none', color: C.border, fontSize: 18, lineHeight: 1, padding: 4, borderRadius: 6 }}>✕</button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      ))}
    </div>
  )
}

// ─── App principale ───────────────────────────────────────────────────────────

export default function App() {
  const [depenses, setDepenses] = useState(() => {
    try { const s = localStorage.getItem('budget-foyer-depenses'); return s ? JSON.parse(s) : [] }
    catch { return [] }
  })
  const [plafond, setPlafond] = useState(() => Number(localStorage.getItem('budget-foyer-plafond') || 1500))
  const [onglet, setOnglet] = useState('resume')
  const [moisFiltre, setMoisFiltre] = useState(() => new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }))

  const sauver = (d) => { localStorage.setItem('budget-foyer-depenses', JSON.stringify(d)); setDepenses(d) }

  useEffect(() => { localStorage.setItem('budget-foyer-plafond', plafond) }, [plafond])

  const supprimer = (id) => sauver(depenses.filter(d => d.id !== id))

  const onImport = (articles) => { if (articles.length > 0) sauver([...articles, ...depenses]) }

  const moisDisponibles = [...new Set(depenses.map(d => extraireMois(d.date)).filter(Boolean))].sort().reverse()

  const ONGLETS = [
    { id: 'resume',  label: 'Résumé',  icon: '📊' },
    { id: 'ticket',  label: 'Ticket',  icon: '🧾' },
    { id: 'releve',  label: 'Relevé',  icon: '🏦' },
    { id: 'revenus', label: 'Revenus', icon: '💰' },
    { id: 'liste',   label: 'Liste',   icon: '🗒️' },
  ]

  return (
    <>
      <style>{fonts + globalStyle}</style>
      <div style={{ minHeight: '100dvh', background: C.bg, paddingBottom: 90 }}>
        <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '18px 20px 14px', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <h1 style={{ fontFamily: 'Lora', fontSize: 26, fontWeight: 700, color: C.ink }}>💰 Budget Foyer</h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>{depenses.length} élément{depenses.length !== 1 ? 's' : ''} enregistré{depenses.length !== 1 ? 's' : ''}</p>
        </div>

        <div style={{ padding: '20px 16px', maxWidth: 560, margin: '0 auto' }}>
          {onglet === 'resume' && <OngletResume depenses={depenses} plafond={plafond} setPlafond={setPlafond} moisFiltre={moisFiltre} setMoisFiltre={setMoisFiltre} moisDisponibles={moisDisponibles} />}
          {onglet === 'ticket' && <OngletTicket onImport={onImport} />}
          {onglet === 'releve' && <OngletReleve onImport={onImport} />}
          {onglet === 'revenus' && <OngletRevenus depenses={depenses} onImport={onImport} />}
          {onglet === 'liste' && <OngletListe depenses={depenses} supprimer={supprimer} moisFiltre={moisFiltre} setMoisFiltre={setMoisFiltre} moisDisponibles={moisDisponibles} />}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.card, borderTop: `1px solid ${C.border}`, display: 'flex', boxShadow: '0 -2px 12px rgba(0,0,0,0.08)', zIndex: 20, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {ONGLETS.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)} style={{ flex: 1, padding: '12px 8px 10px', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 22 }}>{o.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: onglet === o.id ? C.accent : C.muted, borderBottom: onglet === o.id ? `2px solid ${C.accent}` : '2px solid transparent', paddingBottom: 2 }}>{o.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}