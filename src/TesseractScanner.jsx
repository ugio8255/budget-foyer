import { useRef, useState } from 'react'
import { createWorker } from 'tesseract.js'

export default function TesseractScanner({ onImport }) {
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')

  const preprocessImage = async (imageSrc) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = img.width * 2
        canvas.height = img.height * 2
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
          const val = avg > 128 ? 255 : 0
          data[i] = data[i + 1] = data[i + 2] = val
        }
        ctx.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      img.src = imageSrc
    })
  }

  const runOCR = async (imageSrc) => {
    setLoading(true)
    setError('')
    setProgress('Preprocessing...')
    try {
      const processedImg = await preprocessImage(imageSrc)
      const worker = await createWorker('fra', 1, {
        logger: m => { if (m.status === 'recognizing text') setProgress(`Analyse... ${Math.round(m.progress * 100)}%`) }
      })
      await worker.setParameters({
        tessedit_pageseg_mode: '6',
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,€ ',
        preserve_interword_spaces: '1'
      })
      const { data: { text } } = await worker.recognize(processedImg)
      await worker.terminate()
      const parsedItems = parseFrenchReceipt(text)
      setItems(parsedItems)
      if (parsedItems.length === 0) setError('Aucun article détecté.')
    } catch (e) {
      setError('Erreur : ' + e.message)
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  const parseFrenchReceipt = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const results = []
    const priceRegex = /(.+?)\s+(\d+[.,]\d{2})/
    for (const line of lines) {
      if (/TOTAL|TVA|SOUS-TOTAL|RENDU|ESPECES|CB|CARTE|MERCI|TICKET|CAISSE/i.test(line)) continue
      const match = line.match(priceRegex)
      if (match) {
        const name = match[1].replace(/[^a-zA-Z0-9\s]/g, '').trim()
        const price = parseFloat(match[2].replace(',', '.'))
        if (name.length > 1 && price > 0 && price < 1000) {
          results.push({ id: Date.now() + Math.random(), name, price })
        }
      }
    }
    return results
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => runOCR(reader.result)
    reader.readAsDataURL(file)
  }

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: field === 'price' ? parseFloat(value) || 0 : value } : item))
  }

  const deleteItem = (id) => setItems(items.filter(i => i.id !== id))

  const handleImport = () => {
    const articles = items.map(i => ({
      id: Date.now() + Math.random(),
      date: new Date().toLocaleDateString('fr-FR'),
      montant: i.price,
      article: i.name,
      commercant: 'Ticket',
      categorie: 'À classer',
      source: '🧾'
    }))
    onImport(articles)
    setItems([])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontFamily: 'Lora', fontSize: 24, textAlign: 'center', color: '#1C1A16' }}>🧾 Scanner un ticket</h2>

      {!loading && !items.length && (
        <div style={{ display: 'flex', gap: 10 }}>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current.click()} style={{ flex: 1, padding: '14px', fontSize: 16, borderRadius: 12, border: 'none', background: '#D97B3A', color: '#fff', fontWeight: 600 }}>📷 Photographier un ticket</button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 30 }}>
          <p style={{ fontSize: 16, color: '#2563EB', fontWeight: 600 }}>⏳ {progress || 'Analyse...'}</p>
        </div>
      )}

      {error && <p style={{ color: '#C0392B', background: '#FDECEA', padding: 12, borderRadius: 8 }}>{error}</p>}

      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontWeight: 600, fontSize: 18 }}>Articles détectés :</h3>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #E8E2D9', fontSize: 14 }} />
              <input type="number" step="0.01" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} style={{ width: 80, padding: 8, borderRadius: 8, border: '1px solid #E8E2D9', fontSize: 14, textAlign: 'right' }} />
              <span style={{ fontSize: 14 }}>€</span>
              <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', color: '#C0392B', fontSize: 18 }}>✕</button>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, paddingTop: 10, borderTop: '1px solid #E8E2D9' }}>
            <span>Total :</span>
            <span>{items.reduce((sum, i) => sum + i.price, 0).toFixed(2)} €</span>
          </div>
          <button onClick={handleImport} style={{ width: '100%', padding: '14px', fontSize: 16, borderRadius: 12, border: 'none', background: '#3A8C5C', color: '#fff', fontWeight: 600 }}>✅ Importer {items.length} article(s)</button>
          <button onClick={() => setItems([])} style={{ width: '100%', padding: '10px', fontSize: 14, borderRadius: 12, border: '1px solid #E8E2D9', background: '#FAF7F2', color: '#8C8370', fontWeight: 600 }}>↺ Recommencer</button>
        </div>
      )}
    </div>
  )
}