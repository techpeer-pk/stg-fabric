import { useState, useRef } from 'react'
import { db } from '../../firebase/config'
import { doc, writeBatch } from 'firebase/firestore'
import Layout from '../../components/layout/Layout'

// ── helpers ──────────────────────────────────────────────────────────────────
function countDocs(colObj) {
  let n = 0
  for (const colName of Object.keys(colObj)) {
    const docs = colObj[colName]
    for (const docId of Object.keys(docs)) {
      n++
      const nested = docs[docId].__collections__
      if (nested) n += countDocs(nested)
    }
  }
  return n
}

const BATCH_SIZE = 499

// ── component ─────────────────────────────────────────────────────────────────
export default function Import() {
  const [jsonText, setJsonText] = useState('')
  const [logs, setLogs] = useState([])
  const [status, setStatus] = useState('idle') // idle | running | done | error
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [importing, setImporting] = useState(false)
  const fileRef = useRef()
  const logRef = useRef()

  function addLog(type, msg) {
    const entry = { type, msg, time: new Date().toLocaleTimeString() }
    setLogs(prev => {
      const next = [...prev, entry]
      setTimeout(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
      }, 50)
      return next
    })
  }

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setJsonText(ev.target.result)
      addLog('info', `📂 Loaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`)
    }
    reader.readAsText(file)
  }

  function handleClear() {
    setJsonText('')
    setLogs([])
    setStatus('idle')
    setProgress({ done: 0, total: 0 })
    if (fileRef.current) fileRef.current.value = ''
  }

  async function importCollections(colObj, parentRef, state) {
    for (const colName of Object.keys(colObj)) {
      const docs = colObj[colName]
      const docIds = Object.keys(docs)
      addLog('info', `  ↳ [${colName}] — ${docIds.length} docs`)

      for (let i = 0; i < docIds.length; i += BATCH_SIZE) {
        const batch = writeBatch(db)
        const chunk = docIds.slice(i, i + BATCH_SIZE)

        for (const docId of chunk) {
          const { __collections__, ...cleanData } = docs[docId]
          const ref = parentRef
            ? doc(parentRef, colName, docId)
            : doc(db, colName, docId)
          batch.set(ref, cleanData)
        }

        await batch.commit()
        state.done += chunk.length
        setProgress({ done: state.done, total: state.total })
        addLog('ok', `  ✅ Wrote ${chunk.length} docs → [${colName}]`)

        // nested sub-collections
        for (const docId of chunk) {
          const nested = docs[docId].__collections__
          if (nested && Object.keys(nested).length) {
            const ref = parentRef
              ? doc(parentRef, colName, docId)
              : doc(db, colName, docId)
            await importCollections(nested, ref, state)
          }
        }
      }
    }
  }

  async function startImport() {
    if (!jsonText.trim()) { alert('Please paste JSON or upload a file first.'); return }

    let data
    try { data = JSON.parse(jsonText) }
    catch (e) { alert('Invalid JSON: ' + e.message); return }

    const collections = data.__collections__ || data
    if (!collections || typeof collections !== 'object') {
      alert('JSON format not recognised. Expected { "__collections__": { ... } }')
      return
    }

    setLogs([])
    setImporting(true)
    setStatus('running')

    const total = countDocs(collections)
    const state = { done: 0, total }
    setProgress({ done: 0, total })
    addLog('info', `📦 ${total} documents found — starting import...`)

    try {
      const start = Date.now()
      await importCollections(collections, null, state)
      const elapsed = ((Date.now() - start) / 1000).toFixed(1)
      addLog('done', `🎉 Done! ${state.done} documents imported in ${elapsed}s`)
      setStatus('done')
    } catch (e) {
      addLog('error', '❌ ' + e.message)
      setStatus('error')
    } finally {
      setImporting(false)
    }
  }

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0

  const statusConfig = {
    idle: { label: 'Idle', dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-500' },
    running: { label: 'Running', dot: 'bg-yellow-400 animate-pulse', badge: 'bg-yellow-50 text-yellow-600' },
    done: { label: 'Done', dot: 'bg-green-500', badge: 'bg-green-50 text-green-600' },
    error: { label: 'Error', dot: 'bg-red-500', badge: 'bg-red-50 text-red-600' },
  }

  const logColors = {
    info: 'text-gray-400',
    ok: 'text-green-400',
    warn: 'text-yellow-400',
    error: 'text-red-400',
    done: 'text-orange-400 font-bold',
  }

  const sc = statusConfig[status]

  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Firestore Importer</h1>
          <p className="text-sm text-gray-500 mt-1">
            Import product &amp; category data directly into your Firestore database.
          </p>
        </div>

        {/* How-to banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-blue-700 mb-2">📋 How to use</p>
          <ol className="text-sm text-blue-600 space-y-1 list-decimal list-inside">
            <li>Upload <code className="bg-blue-100 px-1 rounded">pk_goods_firestore_import.json</code> using the file picker below</li>
            <li>Review the JSON in the text area if needed</li>
            <li>Click <strong>Start Import</strong> — data goes straight into your connected Firestore</li>
          </ol>
        </div>

        {/* Upload */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Import File</p>

          <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <span className="text-3xl mb-2">📁</span>
            <span className="text-sm font-medium text-gray-600">Click to upload JSON file</span>
            <span className="text-xs text-gray-400 mt-1">pk_goods_firestore_import.json</span>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleFile}
              className="hidden"
            />
          </label>

          <p className="text-xs text-gray-400 mt-3 mb-2">Or paste JSON directly:</p>
          <textarea
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
            rows={6}
            placeholder='{"__collections__": {"categories": {...}, "products": {...}, "inventory": {...}, "customers": {...}}}'
            className="w-full border border-gray-200 rounded-lg p-3 text-xs font-mono text-gray-700 bg-gray-50 resize-y focus:outline-none focus:border-blue-400"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleClear}
            disabled={importing}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            ✕ Clear
          </button>
          <button
            onClick={startImport}
            disabled={importing || !jsonText.trim()}
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {importing ? '⏳ Importing...' : '▶ Start Import'}
          </button>
        </div>

        {/* Progress */}
        {status !== 'idle' && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Progress</p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${sc.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                {sc.label}
              </span>
            </div>

            {/* Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: pct + '%' }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mb-4">
              <span>{progress.done} / {progress.total} documents</span>
              <span>{pct}%</span>
            </div>

            {/* Log */}
            <div
              ref={logRef}
              className="bg-gray-900 rounded-lg p-3 h-52 overflow-y-auto font-mono text-xs space-y-0.5"
            >
              {logs.map((l, i) => (
                <div key={i} className={logColors[l.type] || 'text-gray-300'}>
                  <span className="text-gray-600">{l.time} › </span>{l.msg}
                </div>
              ))}
              {logs.length === 0 && (
                <span className="text-gray-600">Waiting for import to start...</span>
              )}
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}