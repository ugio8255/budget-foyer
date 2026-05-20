import React, { useState } from 'react'

export default function App() {
  const [depenses, setDepenses] = useState(() => {
    const saved = localStorage.getItem('budget-foyer-depenses')
    return saved ? JSON.parse(saved) : []
  })
  const [message, setMessage] = useState('')
  const [plafond, setPlafond] = useState(1500)
  const [vue, setVue] = useState('categories')
  const [moisFiltre, setMoisFiltre] = useState('')

  const aujourdhui = new Date()
  const moisActuel = aujourdhui.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const sauver = (d) => { localStorage.setItem('budget-foyer-depenses', JSON.stringify(d)); setDepenses(d) }

  const classerArticle = (article) => {
    const a = article.toUpperCase()
    if (a.includes('VIANDE') || a.includes('POULET') || a.includes('BOEUF') || a.includes('PORC') || a.includes('POISSON') || a.includes('SAUMON') || a.includes('JAMBON')) return 'Viandes/Poissons'
    if (a.includes('MANGUE') || a.includes('POMME') || a.includes('BANANE') || a.includes('CERISE') || a.includes('KIWI') || a.includes('ORANGE') || a.includes('FRAISE') || a.includes('FRUIT')) return 'Fruits'
    if (a.includes('SALADE') || a.includes('TOMATE') || a.includes('CAROTTE') || a.includes('OIGNON') || a.includes('POIVRON') || a.includes('COURGETTE') || a.includes('LEGUME')) return 'Légumes'
    if (a.includes('LAIT') || a.includes('BEURRE') || a.includes('YAOURT') || a.includes('FROMAGE') || a.includes('CREME') || a.includes('OEUF')) return 'Laitiers/Œufs'
    if (a.includes('PAIN') || a.includes('BAGUETTE') || a.includes('CROISSANT') || a.includes('BRIOCHE')) return 'Boulangerie'
    if (a.includes('EAU') || a.includes('JUS') || a.includes('SODA') || a.includes('BIERE') || a.includes('VIN') || a.includes('BOISSON')) return 'Boissons'
    if (a.includes('GATEAU') || a.includes('CHOCOLAT') || a.includes('BONBON') || a.includes('BISCUIT')) return 'Sucreries'
    return 'Épicerie'
  }

  const gererTicket = () => {
    const texte = document.getElementById('ticket').value
    if (!texte.trim()) return
    const lignes = texte.split('\n')
    const nouvelles = []
    let commercant = ''
    let dateTicket = ''

    for (const ligne of lignes.slice(0, 5)) {
      const l = ligne.trim()
      if (l.length > 3 && !l.includes(':') && !l.startsWith('TEL') && !l.startsWith('#') && !l.includes('App.') && !l.includes('Ray.')) {
        commercant = l
        break
      }
    }

    for (const ligne of lignes) {
      const m = ligne.match(/(\d{2}[-/]\d{2}[-/]\d{4})/)
      if (m) { dateTicket = m[1].replace(/-/g, '/'); break }
    }
    if (!dateTicket) dateTicket = new Date().toLocaleDateString('fr-FR')

    for (const ligne of lignes) {
      const parts = ligne.trim().split(/\s+/)
      if (parts.length >= 2) {
        const dernier = parts[parts.length - 1]
        const prix = parseFloat(dernier.replace(',', '.'))
        if (prix > 0 && prix < 1000 && !dernier.includes('/')) {
          const article = parts.slice(0, -1).join(' ')
          if (article.length > 2 && !article.includes('TOTAL') && !article.includes('CARTE') && !article.includes('ESPECE') && !article.includes('TEL') && !article.includes('Merci')) {
            nouvelles.push({
              id: Date.now() + Math.random(),
              date: dateTicket,
              montant: prix,
              article: article,
              commercant: commercant || 'Ticket',
              categorie: classerArticle(article),
              source: '🧾'
            })
          }
        }
      }
    }

    if (nouvelles.length > 0) {
      sauver([...nouvelles, ...depenses])
      setMessage(nouvelles.length + ' articles importés ✅')
      document.getElementById('ticket').value = ''
    } else {
      setMessage('Aucun article reconnu.')
    }
  }

  const supprimer = (id) => { sauver(depenses.filter(d => d.id !== id)) }

  const moisDisponibles = [...new Set(depenses.map(d => {
    const p = d.date.split('/')
    if (p.length >= 2) {
      const a = p.length === 3 ? (p[2].length === 2 ? '20' + p[2] : p[2]) : '2025'
      return new Date(a, p[1] - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    }
    return null
  }))].filter(Boolean).sort().reverse()

  const depensesFiltrees = moisFiltre ? depenses.filter(d => {
    const p = d.date.split('/')
    if (p.length >= 2) {
      const a = p.length === 3 ? (p[2].length === 2 ? '20' + p[2] : p[2]) : '2025'
      return new Date(a, p[1] - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) === moisFiltre
    }
    return false
  }) : depenses

  const total = depensesFiltrees.reduce((s, d) => s + d.montant, 0)
  const pct = Math.round((total / plafond) * 100)
  const couleurBarre = pct > 100 ? '#e53e3e' : pct > 80 ? '#ed8936' : '#38a169'

  const categories = ['Alimentation', 'Viandes/Poissons', 'Fruits', 'Légumes', 'Laitiers/Œufs', 'Boulangerie', 'Boissons', 'Sucreries', 'Épicerie', 'Loisirs', 'Transport', 'Maison', 'À classer']
  const totauxParCat = categories.map(c => ({ nom: c, total: depensesFiltrees.filter(d => d.categorie === c).reduce((s, d) => s + d.montant, 0), nombre: depensesFiltrees.filter(d => d.categorie === c).length })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  return (
    <div style={{ padding: 20, maxWidth: 550, margin: '0 auto', fontFamily: 'Arial', fontSize: 18 }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>💰 Budget Foyer</h1>

      <div style={{ background: '#ebf8ff', padding: 15, borderRadius: 10, marginBottom: 20, border: '2px solid #bee3f8' }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: 20 }}>🧾 Scanner un ticket de caisse</h2>
        <textarea id="ticket" placeholder="Colle ici le texte de ton ticket (Google Lens, etc.)" rows={8} style={{ width: '100%', padding: 10, fontSize: 14, boxSizing: 'border-box', marginBottom: 10, borderRadius: 6, border: '1px solid #ccc' }} />
        <button onClick={gererTicket} style={{ width: '100%', padding: 14, fontSize: 18, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>📋 Analyser le ticket</button>
        {message && <p style={{ marginTop: 10, color: '#2563eb', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>{message}</p>}
      </div>

      <div style={{ padding: 12, borderRadius: 10, marginBottom: 20, display: 'flex', gap: 10, background: '#f7fafc', border: '1px solid #e2e8f0' }}>
        <span>📅</span>
        <select value={moisFiltre} onChange={e => setMoisFiltre(e.target.value)} style={{ padding: 8, fontSize: 17, fontWeight: 'bold', border: 'none', borderRadius: 6, background: '#fff' }}>
          <option value="">Tous</option>
          {moisDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '2px solid #e2e8f0', marginBottom: 20 }}>
        {depensesFiltrees.length === 0 ? <div style={{ textAlign: 'center', padding: 30, color: '#a0aec0' }}><p style={{ fontSize: 40 }}>📭</p><p>Aucune dépense</p></div> : <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><span>Total</span><span style={{ fontSize: 32, fontWeight: 'bold' }}>{total.toFixed(0)} €</span></div>
          <div style={{ background: '#e2e8f0', height: 14, borderRadius: 7, overflow: 'hidden' }}><div style={{ width: Math.min(pct, 100) + '%', height: '100%', background: couleurBarre }} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#666', marginTop: 5 }}><span>Plafond: {plafond}€</span><span style={{ color: couleurBarre, fontWeight: 'bold' }}>{pct}%</span></div>
          <p style={{ marginTop: 10, fontSize: 15, color: pct >= 80 ? '#e53e3e' : '#38a169', textAlign: 'center', fontWeight: 'bold' }}>
            {pct >= 100 ? '⚠️ Plafond dépassé !' : pct >= 80 ? '⚠️ Attention au plafond' : `✅ Reste ${plafond - total} €`}
          </p>
        </>}
      </div>

      <div style={{ background: '#f7fafc', padding: 10, borderRadius: 8, marginBottom: 20, display: 'flex', gap: 10, fontSize: 15 }}><span>Plafond:</span><input type="number" value={plafond} onChange={e => setPlafond(Number(e.target.value))} style={{ width: 80, padding: 5, border: '1px solid #ccc', borderRadius: 4 }} /><span>€</span></div>

      {depensesFiltrees.length > 0 && <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><h2 style={{ margin: 0, fontSize: 20 }}>📊 Catégories</h2><button onClick={() => setVue(vue === 'categories' ? 'liste' : 'categories')} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}>{vue === 'categories' ? 'Liste' : 'Résumé'}</button></div>
        {vue === 'categories' ? totauxParCat.map(c => <div key={c.nom} style={{ marginBottom: 8 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span><b>{c.nom}</b> <span style={{ fontSize: 13, color: '#888' }}>{c.nombre} art.</span></span><span><b>{c.total.toFixed(0)}€</b> ({Math.round(c.total/total*100)}%)</span></div><div style={{ background: '#e2e8f0', height: 6, borderRadius: 3 }}><div style={{ width: Math.round(c.total/total*100) + '%', height: '100%', background: '#2563eb', borderRadius: 3 }} /></div></div>)
        : depensesFiltrees.map(d => <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee', fontSize: 15 }}><div><b>{d.source} {d.commercant}</b> - {d.article}<br /><span style={{ fontSize: 12, color: '#888' }}>{d.date} · {d.categorie}</span></div><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ fontWeight: 'bold', color: '#e53e3e' }}>{d.montant.toFixed(2)}€</span><button onClick={() => supprimer(d.id)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 18 }}>✕</button></div></div>)}
      </div>}

      <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center' }}>{depensesFiltrees.length} articles · 💾 Local</p>
    </div>
  )
}