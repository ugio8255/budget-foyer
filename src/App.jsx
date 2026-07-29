import React, { useState, useEffect, useRef } from 'react'
import TesseractScanner from './TesseractScanner.jsx'

const C = {
  bg: '#FAF7F2', card: '#FFFFFF', ink: '#1C1A16', muted: '#8C8370',
  border: '#E8E2D9', accent: '#D97B3A', accentBg: '#FDF0E6', green: '#3A8C5C',
  greenBg: '#E8F5EE', red: '#C0392B', redBg: '#FDECEA', orange: '#E07B2A',
  blue: '#2563EB', blueBg: '#EBF2FF', shadow: '0 2px 12px rgba(0,0,0,0.07)',
}

const fonts = `@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');`
const globalStyle = `*{box-sizing:border-box;margin:0;padding:0}body{background:${C.bg};font-family:'DM Sans',sans-serif}input,select,textarea,button{font-family:inherit}button{cursor:pointer}`

const extraireMois = (d) => {
  const p = d.split('/')
  if (p.length < 2) return null
  const a = p.length === 3 ? (p[2].length === 2 ? '20'+p[2] : p[2]) : '2025'
  return new Date(a, p[1]-1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const ICONES = { 'Viandes/Poissons':'🥩','Fruits':'🍎','Légumes':'🥦','Laitiers/Œufs':'🥛','Boulangerie':'🥖','Boissons':'🧃','Sucreries':'🍫','Épicerie':'🛒','Alimentation':'🍽️','Loisirs':'🎭','Transport':'🚌','Maison':'🏠','À classer':'📋' }

const CAISSES = [
  { nom:'CNAV', frequence:'Mensuelle', mois:[] },
  { nom:'AGIRC-ARRCO', frequence:'Mensuelle', mois:[] },
  { nom:'RENTE-AT', frequence:'Trimestrielle', mois:['Janvier','Avril','Juillet','Octobre'] },
  { nom:'IRCANTEC', frequence:'Annuelle', mois:['Janvier'] },
  { nom:'INPS', frequence:'Semestrielle', mois:['Janvier','Juillet'] },
]

function Card({ children, style={} }) {
  return <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, boxShadow:C.shadow, padding:20, ...style }}>{children}</div>
}

function Btn({ children, onClick, variant='primary', style={}, disabled=false }) {
  const s = {
    primary: { background:C.accent, color:'#fff' },
    secondary: { background:C.bg, color:C.ink, border:`1px solid ${C.border}` },
    ghost: { background:'transparent', color:C.blue },
    danger: { background:C.redBg, color:C.red, border:`1px solid ${C.red}33` },
  }
  return <button onClick={onClick} disabled={disabled} style={{ padding:'12px 18px', borderRadius:12, fontWeight:600, fontSize:16, border:'none', opacity:disabled?0.5:1, ...s[variant], ...style }}>{children}</button>
}

function Badge({ children, color=C.muted }) {
  return <span style={{ background:color+'22', color, fontSize:12, fontWeight:600, padding:'2px 8px', borderRadius:20 }}>{children}</span>
}

function BarreProgression({ pct }) {
  const c = pct >= 100 ? C.red : pct >= 80 ? C.orange : C.green
  return <div style={{ background:C.border, height:10, borderRadius:5, overflow:'hidden' }}><div style={{ width:Math.min(pct,100)+'%', height:'100%', background:c, borderRadius:5 }} /></div>
}

// ─── Revenus ──────────────────────────────────────────────────────
function OngletRevenus({ depenses, onImport }) {
  const [montant, setMontant] = useState('')
  const [caisse, setCaisse] = useState('CNAV')
  const [dateRevenu, setDateRevenu] = useState(new Date().toLocaleDateString('fr-FR'))
  const revenus = depenses.filter(d => d.source === '💰')
  const getDiv = (f) => { switch(f){ case'Trimestrielle':return 3; case'Semestrielle':return 6; case'Annuelle':return 12; default:return 1 } }
  const totalMensuel = revenus.reduce((s, r) => { const c = CAISSES.find(x => x.nom === r.article); return s + (r.montant / (c ? getDiv(c.frequence) : 1)) }, 0)
  const resume = CAISSES.map(c => { const t = revenus.filter(r => r.article === c.nom).reduce((s, r) => s + r.montant, 0); return {...c, total:t, mensuel:t/getDiv(c.frequence)} }).filter(c => c.total > 0)
  const ajouter = () => { if(!montant) return; onImport([{ id:Date.now(), date:dateRevenu, montant:parseFloat(montant.replace(',','.')), article:caisse, commercant:caisse, categorie:'Revenu', source:'💰' }]); setMontant('') }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <h2 style={{ fontFamily:'Lora', fontSize:22, color:C.ink, textAlign:'center' }}>💰 Revenus</h2>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Card style={{ background:C.greenBg, border:`1px solid ${C.green}44`, textAlign:'center' }}>
          <p style={{ fontSize:13, color:C.green, fontWeight:600 }}>Mensuel</p>
          <p style={{ fontFamily:'Lora', fontSize:32, fontWeight:700, color:C.green }}>{totalMensuel.toFixed(0)} €</p>
        </Card>
        <Card>
          <select value={caisse} onChange={e => setCaisse(e.target.value)} style={{ padding:8, fontSize:14, borderRadius:8, border:`1px solid ${C.border}`, width:'100%', marginBottom:6 }}>
            {CAISSES.map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
          </select>
          <input type="number" placeholder="Montant" value={montant} onChange={e => setMontant(e.target.value)} style={{ padding:8, fontSize:14, borderRadius:8, border:`1px solid ${C.border}`, width:'100%', marginBottom:6 }} />
          <Btn onClick={ajouter} disabled={!montant} style={{ width:'100%', padding:8, fontSize:14 }}>Ajouter</Btn>
        </Card>
      </div>
      {resume.length > 0 && (
        <Card style={{ padding:12 }}>
          <p style={{ fontWeight:600, fontSize:14, marginBottom:8 }}>📋 Résumé par caisse</p>
          {resume.map((c, i) => (
            <div key={c.nom} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:i<resume.length-1?`1px solid ${C.border}`:'none', fontSize:14 }}>
              <span><b>{c.nom}</b> <span style={{ color:C.muted, fontSize:12 }}>{c.frequence}</span></span>
              <span style={{ fontWeight:700, color:C.green }}>{c.mensuel.toFixed(0)} €/mois</span>
            </div>
          ))}
        </Card>
      )}
      {revenus.length > 0 && (
        <details style={{ marginTop:4 }}>
          <summary style={{ cursor:'pointer', color:C.muted, fontSize:14, fontWeight:600 }}>📜 Historique ({revenus.length})</summary>
          <Card style={{ padding:12, marginTop:8 }}>
            {revenus.sort((a,b) => new Date(b.date.split('/').reverse().join('-')) - new Date(a.date.split('/').reverse().join('-'))).map((r, i) => (
              <div key={r.id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:i<revenus.length-1?`1px solid ${C.border}`:'none', fontSize:14 }}>
                <div><b>{r.article}</b><br /><span style={{ fontSize:12, color:C.muted }}>{r.date}</span></div>
                <span style={{ fontWeight:700, color:C.green }}>+{r.montant.toFixed(2)} €</span>
              </div>
            ))}
          </Card>
        </details>
      )}
      <Card style={{ padding:12 }}>
        <p style={{ fontWeight:600, fontSize:14, marginBottom:8 }}>📅 Calendrier</p>
        {CAISSES.map(c => (
          <div key={c.nom} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'3px 0' }}>
            <span>{c.nom}</span>
            <span style={{ color:C.muted }}>{c.frequence}{c.mois.length>0?' · '+c.mois.join(', '):''}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ─── Résumé ───────────────────────────────────────────────────────
function OngletResume({ depenses, plafond, setPlafond, moisFiltre, setMoisFiltre, moisDisponibles }) {
  const df = moisFiltre ? depenses.filter(d => extraireMois(d.date) === moisFiltre) : depenses
  const depensesReelles = df.filter(d => d.source !== '💰')
  const revenusFiltres = df.filter(d => d.source === '💰')
  const totalDepenses = depensesReelles.reduce((s, d) => s + d.montant, 0)
  const getDiv = (f) => { switch(f){ case'Trimestrielle':return 3; case'Semestrielle':return 6; case'Annuelle':return 12; default:return 1 } }
  const totalRevenus = revenusFiltres.reduce((s, r) => { const c = CAISSES.find(x => x.nom === r.article); return s + (r.montant / (c ? getDiv(c.frequence) : 1)) }, 0)
  const pct = Math.round((totalDepenses / plafond) * 100)
  const reste = plafond - totalDepenses
  const cats = ['Alimentation','Viandes/Poissons','Fruits','Légumes','Laitiers/Œufs','Boulangerie','Boissons','Sucreries','Épicerie','Loisirs','Transport','Maison','À classer']
  const totaux = cats.map(c => ({ nom:c, total:depensesReelles.filter(d => d.categorie === c).reduce((s, d) => s + d.montant, 0), nombre:depensesReelles.filter(d => d.categorie === c).length })).filter(c => c.total > 0).sort((a,b) => b.total - a.total)
  const [edit, setEdit] = useState(false)
  const [tmp, setTmp] = useState(plafond)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        <span>📅</span>
        <select value={moisFiltre} onChange={e => setMoisFiltre(e.target.value)} style={{ flex:1, padding:'10px 14px', fontSize:16, fontWeight:600, border:`1.5px solid ${C.border}`, borderRadius:12, background:C.card, color:C.ink }}>
          <option value="">Tous les mois</option>
          {moisDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      {totalRevenus > 0 && (
        <Card style={{ background:C.greenBg, border:`1px solid ${C.green}44` }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontWeight:600 }}>💰 Revenus du mois</span>
            <span style={{ fontFamily:'Lora', fontSize:24, fontWeight:700, color:C.green }}>+{totalRevenus.toFixed(0)} €</span>
          </div>
        </Card>
      )}
      {totalDepenses > 0 ? (
        <>
          <Card>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:14 }}>
              <div><p style={{ color:C.muted, fontSize:13 }}>Total dépensé</p><p style={{ fontFamily:'Lora', fontSize:38, fontWeight:700 }}>{totalDepenses.toFixed(0)} €</p></div>
              <div style={{ textAlign:'right' }}>
                {edit ? (
                  <div style={{ display:'flex', gap:6 }}>
                    <input type="number" value={tmp} onChange={e => setTmp(Number(e.target.value))} style={{ width:80, padding:6, borderRadius:8, border:`1.5px solid ${C.accent}`, fontSize:16 }} />
                    <Btn onClick={() => { setPlafond(tmp); setEdit(false) }} style={{ padding:'6px 12px', fontSize:14 }}>OK</Btn>
                  </div>
                ) : (
                  <button onClick={() => { setTmp(plafond); setEdit(true) }} style={{ background:'none', border:'none' }}>
                    <p style={{ color:C.muted, fontSize:13 }}>Plafond</p>
                    <p style={{ fontFamily:'Lora', fontSize:22, fontWeight:600, color:C.muted }}>{plafond} € ✏️</p>
                  </button>
                )}
              </div>
            </div>
            <BarreProgression pct={pct} />
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
              <Badge color={pct>=100?C.red:pct>=80?C.orange:C.green}>{pct}% utilisé</Badge>
              <Badge color={reste>=0?C.green:C.red}>{reste>=0?`Reste ${reste.toFixed(0)} €`:`Dépassé de ${Math.abs(reste).toFixed(0)} €`}</Badge>
            </div>
          </Card>
          <Card style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}` }}><h3 style={{ fontFamily:'Lora', fontSize:18, fontWeight:600 }}>📊 Par catégorie</h3></div>
            {totaux.map((c, i) => (
              <div key={c.nom} style={{ padding:'12px 20px', borderBottom:i<totaux.length-1?`1px solid ${C.border}`:'none', background:i%2===0?C.card:C.bg }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontWeight:600, fontSize:15 }}>{ICONES[c.nom]||'📦'} {c.nom}</span>
                  <span style={{ fontWeight:700, fontSize:15 }}>{c.total.toFixed(0)} € <span style={{ color:C.muted, fontWeight:400, fontSize:13 }}>({Math.round(c.total/totalDepenses*100)}%)</span></span>
                </div>
                <div style={{ background:C.border, height:6, borderRadius:3, overflow:'hidden' }}><div style={{ width:Math.round(c.total/totalDepenses*100)+'%', height:'100%', background:C.accent, borderRadius:3 }} /></div>
              </div>
            ))}
          </Card>
        </>
      ) : (
        <Card style={{ textAlign:'center', padding:48 }}><div style={{ fontSize:48 }}>📭</div><p style={{ color:C.muted }}>Aucune dépense</p></Card>
      )}
    </div>
  )
}

// ─── Relevé ───────────────────────────────────────────────────────
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
      const debit = parseFloat((colonnes[2] || '0').replace(',', '.'))
      const credit = parseFloat((colonnes[3] || '0').replace(',', '.'))
      if (!dateOp?.match(/^\d{2}\/\d{2}/)) continue
      if (/VIREMENT|VIR SEPA|RETRAITE|PENSION|CNAV|CAF|ALLOCATION/i.test(libelle)) continue
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

  if (etape === 3) return <Card style={{ textAlign:'center', padding:40 }}><div style={{ fontSize:48 }}>✅</div><p style={{ fontWeight:600, color:C.green, fontSize:18 }}>Relevé importé !</p></Card>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ textAlign:'center' }}><h2 style={{ fontFamily:'Lora', fontSize:24 }}>🏦 Relevé Banque Postale</h2></div>
      {etape === 1 ? (
        <Card>
          <textarea value={texteColle} onChange={e => setTexteColle(e.target.value)} placeholder="Colle ici le texte du relevé (CSV avec ;)…" rows={8} style={{ width:'100%', padding:14, fontSize:13, borderRadius:12, border:`1.5px solid ${C.border}`, background:C.bg, color:C.ink, resize:'vertical', outline:'none', lineHeight:1.6 }} />
          <Btn onClick={analyserColle} disabled={!texteColle.trim()} style={{ width:'100%', marginTop:12, fontSize:17, padding:'14px' }}>🏦 Analyser</Btn>
        </Card>
      ) : (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
            <p style={{ fontWeight:700 }}>{apercu.length} opérations</p>
            <span style={{ fontFamily:'Lora', fontSize:22, fontWeight:700, color:C.accent }}>{apercu.reduce((s, a) => s + a.montant, 0).toFixed(2)} €</span>
          </div>
          <div style={{ maxHeight:320, overflowY:'auto', borderRadius:10, border:`1px solid ${C.border}` }}>
            {apercu.map((op, i) => (
              <div key={op.id} style={{ display:'flex', justifyContent:'space-between', padding:'9px 14px', borderBottom:i<apercu.length-1?`1px solid ${C.border}`:'none', background:i%2===0?C.bg:C.card }}>
                <div><span style={{ fontSize:14, fontWeight:500 }}>{op.article}</span><br /><span style={{ fontSize:12, color:C.muted }}>{op.date}</span></div>
                <span style={{ fontWeight:700 }}>{op.montant.toFixed(2)} €</span>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10, marginTop:14 }}>
            <Btn onClick={reset} variant="secondary" style={{ flex:1 }}>← Modifier</Btn>
            <Btn onClick={confirmer} style={{ flex:2 }}>✅ Importer tout</Btn>
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Liste ────────────────────────────────────────────────────────
function OngletListe({ depenses, supprimer, moisFiltre, moisDisponibles, setMoisFiltre }) {
  const df = moisFiltre ? depenses.filter(d => extraireMois(d.date) === moisFiltre) : depenses
  const grouped = df.reduce((acc, d) => { const key = d.date; if (!acc[key]) acc[key] = []; acc[key].push(d); return acc }, {})
  const jours = Object.keys(grouped).sort((a, b) => { const parse = d => { const p = d.split('/'); return new Date(p[2], p[1]-1, p[0]) }; return parse(b) - parse(a) })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        <span>📅</span>
        <select value={moisFiltre} onChange={e => setMoisFiltre(e.target.value)} style={{ flex:1, padding:'10px 14px', fontSize:16, fontWeight:600, border:`1.5px solid ${C.border}`, borderRadius:12, background:C.card, color:C.ink }}>
          <option value="">Tous les mois</option>
          {moisDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <button onClick={() => {
        if (confirm('Effacer TOUTES les dépenses ?')) { localStorage.setItem('budget-foyer-depenses', '[]'); window.location.reload() }
      }} style={{ padding:'8px 14px', fontSize:13, background:C.red, color:'#fff', border:'none', borderRadius:8, fontWeight:600 }}>🗑️ Tout effacer</button>
      {df.length === 0 ? (
        <Card style={{ textAlign:'center', padding:48 }}><div style={{ fontSize:48 }}>🗒️</div><p style={{ color:C.muted }}>Aucune dépense</p></Card>
      ) : jours.map(jour => (
        <div key={jour}>
          <p style={{ fontSize:13, fontWeight:600, color:C.muted, marginBottom:8 }}>{jour}</p>
          <Card style={{ padding:0, overflow:'hidden' }}>
            {grouped[jour].map((d, i) => (
              <div key={d.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:i<grouped[jour].length-1?`1px solid ${C.border}`:'none', background:i%2===0?C.card:C.bg }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:600, fontSize:15 }}>{d.source} {d.article}</p>
                  <p style={{ color:C.muted, fontSize:12 }}>{d.commercant} · {ICONES[d.categorie]||'📦'} {d.categorie}</p>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginLeft:10 }}>
                  <span style={{ fontWeight:700, fontSize:16, color:d.source==='💰'?C.green:C.ink }}>{d.source==='💰'?'+':''}{d.montant.toFixed(2)} €</span>
                  <button onClick={() => supprimer(d.id)} style={{ background:'none', border:'none', color:C.border, fontSize:18, lineHeight:1, padding:4, borderRadius:6 }}>✕</button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      ))}
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────
export default function App() {
  const [depenses, setDepenses] = useState(() => { try { const s = localStorage.getItem('budget-foyer-depenses'); return s ? JSON.parse(s) : [] } catch { return [] } })
  const [plafond, setPlafond] = useState(() => Number(localStorage.getItem('budget-foyer-plafond') || 1500))
  const [onglet, setOnglet] = useState('resume')
  const [moisFiltre, setMoisFiltre] = useState(() => new Date().toLocaleDateString('fr-FR', { month:'long', year:'numeric' }))

  const sauver = (d) => { localStorage.setItem('budget-foyer-depenses', JSON.stringify(d)); setDepenses(d) }
  useEffect(() => { localStorage.setItem('budget-foyer-plafond', plafond) }, [plafond])
  const supprimer = (id) => sauver(depenses.filter(d => d.id !== id))
  const onImport = (articles) => { if (articles.length > 0) sauver([...articles, ...depenses]) }
  const moisDisponibles = [...new Set(depenses.map(d => extraireMois(d.date)).filter(Boolean))].sort().reverse()

  const ONGLETS = [
    { id:'resume', label:'Résumé', icon:'📊' },
    { id:'ticket', label:'Ticket', icon:'🧾' },
    { id:'releve', label:'Relevé', icon:'🏦' },
    { id:'revenus', label:'Revenus', icon:'💰' },
    { id:'liste', label:'Liste', icon:'🗒️' },
  ]

  return (
    <>
      <style>{fonts + globalStyle}</style>
      <div style={{ minHeight:'100dvh', background:C.bg, paddingBottom:90 }}>
        <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:'18px 20px 14px', position:'sticky', top:0, zIndex:10, boxShadow:'0 1px 8px rgba(0,0,0,0.06)' }}>
          <h1 style={{ fontFamily:'Lora', fontSize:26, fontWeight:700, color:C.ink }}>💰 Budget Foyer</h1>
          <p style={{ color:C.muted, fontSize:13, marginTop:2 }}>{depenses.length} élément{depenses.length!==1?'s':''}</p>
        </div>
        <div style={{ padding:'20px 16px', maxWidth:560, margin:'0 auto' }}>
          {onglet === 'resume' && <OngletResume depenses={depenses} plafond={plafond} setPlafond={setPlafond} moisFiltre={moisFiltre} setMoisFiltre={setMoisFiltre} moisDisponibles={moisDisponibles} />}
          {onglet === 'ticket' && <TesseractScanner onImport={onImport} />}
          {onglet === 'releve' && <OngletReleve onImport={onImport} />}
          {onglet === 'revenus' && <OngletRevenus depenses={depenses} onImport={onImport} />}
          {onglet === 'liste' && <OngletListe depenses={depenses} supprimer={supprimer} moisFiltre={moisFiltre} setMoisFiltre={setMoisFiltre} moisDisponibles={moisDisponibles} />}
        </div>
      </div>
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:C.card, borderTop:`1px solid ${C.border}`, display:'flex', boxShadow:'0 -2px 12px rgba(0,0,0,0.08)', zIndex:20, paddingBottom:'env(safe-area-inset-bottom)' }}>
        {ONGLETS.map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)} style={{ flex:1, padding:'12px 8px 10px', background:'none', border:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <span style={{ fontSize:22 }}>{o.icon}</span>
            <span style={{ fontSize:12, fontWeight:600, color:onglet===o.id?C.accent:C.muted, borderBottom:onglet===o.id?`2px solid ${C.accent}`:'2px solid transparent', paddingBottom:2 }}>{o.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}