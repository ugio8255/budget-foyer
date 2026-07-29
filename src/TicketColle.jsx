import { useState } from 'react'
import { C } from './theme.js'
import { classerArticle } from './categories.js'
import { analyserTicket } from './parseTicket.js'

export default function TicketColle({ onImport }) {
  const [texte, setTexte] = useState('')
  const [articles, setArticles] = useState([])
  const [commercant, setCommercant] = useState('')
  const [dateTicket, setDateTicket] = useState('')
  const [etape, setEtape] = useState(1)   // 1 = saisie, 2 = vérification, 3 = confirmation
  const [avert, setAvert] = useState('')

  const analyser = () => {
    const { commercant: com, date, articles: trouves } = analyserTicket(texte)
    setCommercant(com)
    setDateTicket(date)
    setArticles(trouves)
    setAvert(trouves.length === 0
      ? "Aucun article reconnu. Vérifie que le texte est bien collé, avec un article et son prix par ligne."
      : '')
    setEtape(2)
  }

  const modifier = (id, champ, valeur) => {
    setArticles(articles.map(a => {
      if (a.id !== id) return a
      if (champ === 'prix') return { ...a, prix: parseFloat(String(valeur).replace(',', '.')) || 0 }
      return { ...a, nom: valeur, categorie: classerArticle(valeur) }
    }))
  }

  const supprimerLigne = (id) => setArticles(articles.filter(a => a.id !== id))

  const confirmer = () => {
    onImport(articles.map((a, i) => ({
      id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      date: dateTicket,
      montant: a.prix,
      article: a.nom,
      commercant,
      categorie: a.categorie,
      source: '🧾',
    })))
    recommencer()
    setEtape(3)
    setTimeout(() => setEtape(1), 2500)
  }

  const recommencer = () => { setTexte(''); setArticles([]); setAvert(''); setEtape(1) }

  const total = articles.reduce((s, a) => s + a.prix, 0)
  const carte = { background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: C.shadow, padding: 20 }

  if (etape === 3) return (
    <div style={{ ...carte, textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 48 }}>✅</div>
      <p style={{ fontWeight: 600, color: C.green, fontSize: 18 }}>Ticket importé !</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Lora', fontSize: 24, color: C.ink }}>🧾 Ticket</h2>
      </div>

      {etape === 1 ? (
        <>
          <div style={{ ...carte, background: C.blueBg, border: `1px solid ${C.blue}33`, padding: 16 }}>
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: C.ink }}>Comment faire</p>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: C.ink, lineHeight: 1.7 }}>
              <li>Photographie ton ticket avec <b>Google Lens</b> (Android), ou appuie longuement sur le texte dans <b>Photos</b> (iPhone)</li>
              <li>Sélectionne tout le texte, puis <b>Copier</b></li>
              <li>Reviens ici et colle-le ci-dessous</li>
            </ol>
          </div>

          <div style={carte}>
            <textarea
              value={texte}
              onChange={e => setTexte(e.target.value)}
              placeholder={"Colle ici le texte du ticket…\n\nExemple :\nPOMMES GALA      3,49\nLAIT DEMI-ÉCRÉMÉ 1,15\nBAGUETTE         1,10"}
              rows={10}
              style={{ width: '100%', padding: 14, fontSize: 14, borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.bg, outline: 'none', resize: 'vertical', color: C.ink, fontFamily: 'inherit' }}
            />
            <button
              onClick={analyser}
              disabled={!texte.trim()}
              style={{ width: '100%', marginTop: 12, padding: 14, fontSize: 17, fontWeight: 600, borderRadius: 12, border: 'none', background: C.accent, color: '#fff', opacity: texte.trim() ? 1 : 0.5 }}
            >
              📋 Analyser
            </button>
          </div>
        </>
      ) : (
        <div style={carte}>
          {avert && (
            <div style={{ background: C.redBg, color: C.red, padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 12 }}>
              {avert}
            </div>
          )}

          {articles.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input
                    value={commercant}
                    onChange={e => setCommercant(e.target.value)}
                    aria-label="Nom du commerçant"
                    style={{ fontWeight: 700, fontSize: 15, border: 'none', background: 'transparent', color: C.ink, width: '100%', outline: 'none', padding: 0 }}
                  />
                  <input
                    value={dateTicket}
                    onChange={e => setDateTicket(e.target.value)}
                    aria-label="Date du ticket"
                    style={{ color: C.muted, fontSize: 13, border: 'none', background: 'transparent', width: 120, outline: 'none', padding: 0 }}
                  />
                </div>
                <span style={{ fontFamily: 'Lora', fontSize: 22, fontWeight: 700, color: C.accent, whiteSpace: 'nowrap' }}>
                  {total.toFixed(2)} €
                </span>
              </div>

              <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
                Corrige ce qui est mal lu avant d'importer :
              </p>

              <div style={{ maxHeight: 300, overflowY: 'auto', borderRadius: 10, border: `1px solid ${C.border}` }}>
                {articles.map((a, i) => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderBottom: i < articles.length - 1 ? `1px solid ${C.border}` : 'none', background: i % 2 === 0 ? C.bg : C.card }}>
                    <input
                      value={a.nom}
                      onChange={e => modifier(a.id, 'nom', e.target.value)}
                      aria-label="Nom de l'article"
                      style={{ flex: 1, minWidth: 0, padding: '7px 9px', fontSize: 14, borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.ink, outline: 'none' }}
                    />
                    <input
                      value={a.prix}
                      onChange={e => modifier(a.id, 'prix', e.target.value)}
                      inputMode="decimal"
                      aria-label="Prix"
                      style={{ width: 68, padding: '7px 9px', fontSize: 14, borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.ink, textAlign: 'right', outline: 'none' }}
                    />
                    <span style={{ fontSize: 13, color: C.muted }}>€</span>
                    <button
                      onClick={() => supprimerLigne(a.id)}
                      aria-label={`Supprimer ${a.nom}`}
                      style={{ background: 'none', border: 'none', color: C.red, fontSize: 18, lineHeight: 1, padding: '0 2px' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button
              onClick={recommencer}
              style={{ flex: 1, padding: 12, fontSize: 15, fontWeight: 600, borderRadius: 12, background: C.bg, color: C.ink, border: `1px solid ${C.border}` }}
            >
              ← Recommencer
            </button>
            {articles.length > 0 && (
              <button
                onClick={confirmer}
                style={{ flex: 2, padding: 12, fontSize: 15, fontWeight: 600, borderRadius: 12, border: 'none', background: C.green, color: '#fff' }}
              >
                ✅ Importer {articles.length} article{articles.length > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
