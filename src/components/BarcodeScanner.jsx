import React, { useEffect, useRef, useState, useCallback } from 'react'

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef    = useRef(null)
  const readerRef   = useRef(null)
  const detectedRef = useRef(false)
  const [error,   setError]   = useState(null)
  const [cameras, setCameras] = useState([])
  const [camIdx,  setCamIdx]  = useState(0)

  const startScan = useCallback(async (deviceId) => {
    if (!readerRef.current) return
    try {
      const { NotFoundException } = await import('@zxing/library')
      await readerRef.current.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
        if (result && !detectedRef.current) { detectedRef.current = true; onDetected(result.getText()) }
        if (err && !(err instanceof NotFoundException)) console.warn(err)
      })
    } catch(e) { setError('Kamera nicht verfügbar: ' + e.message) }
  }, [onDetected])

  useEffect(() => {
    let cancelled = false
    import('@zxing/library').then(({ BrowserMultiFormatReader }) => {
      if (cancelled) return
      readerRef.current = new BrowserMultiFormatReader()
      BrowserMultiFormatReader.listVideoInputDevices()
        .then(devices => {
          if (cancelled) return
          if (!devices.length) { setError('Keine Kamera gefunden.'); return }
          setCameras(devices)
          const back = devices.findIndex(d => /back|rear|environment/i.test(d.label))
          const idx  = back >= 0 ? back : 0
          setCamIdx(idx); startScan(devices[idx].deviceId)
        })
        .catch(e => setError('Kamerazugriff verweigert: ' + e.message))
    })
    return () => { cancelled = true; readerRef.current?.reset() }
  }, [startScan])

  const switchCam = async () => {
    readerRef.current?.reset(); detectedRef.current = false
    const next = (camIdx + 1) % cameras.length; setCamIdx(next)
    await startScan(cameras[next].deviceId)
  }

  const corners = [
    { top:12, left:12,  borderTop:'2px solid #22c55e', borderLeft:'2px solid #22c55e',  borderRadius:'6px 0 0 0' },
    { top:12, right:12, borderTop:'2px solid #22c55e', borderRight:'2px solid #22c55e', borderRadius:'0 6px 0 0' },
    { bottom:12, left:12,  borderBottom:'2px solid #22c55e', borderLeft:'2px solid #22c55e',  borderRadius:'0 0 0 6px' },
    { bottom:12, right:12, borderBottom:'2px solid #22c55e', borderRight:'2px solid #22c55e', borderRadius:'0 0 6px 0' },
  ]

  return (
    <div className="scanner-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="scanner-box">
        <div className="modal-handle" />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontWeight:600, fontSize:15 }}>Barcode scannen</span>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding:'6px 10px' }}>✕</button>
        </div>

        {error ? (
          <div className="error-msg">{error}</div>
        ) : (
          <div className="scanner-viewfinder">
            <video ref={videoRef} autoPlay playsInline muted />
            <div className="scanner-line" />
            {corners.map((s, i) => (
              <div key={i} style={{ position:'absolute', width:20, height:20, ...s }} />
            ))}
          </div>
        )}

        <p style={{ textAlign:'center', fontSize:12, color:'var(--text-muted)' }}>
          Halte den Barcode in den Rahmen – Erkennung läuft automatisch
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {cameras.length > 1 && (
            <button className="btn btn-ghost" onClick={switchCam} style={{ width:'100%', justifyContent:'center' }}>
              ⟳ Kamera wechseln
            </button>
          )}
          <button className="btn" onClick={() => {
            const e = window.prompt('EAN manuell eingeben:')
            if (e?.trim()) onDetected(e.trim())
          }} style={{ background:'transparent', color:'var(--text-muted)', justifyContent:'center', width:'100%', fontSize:12 }}>
            Manuell eingeben
          </button>
        </div>
      </div>
    </div>
  )
}
