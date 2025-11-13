'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Download, Scan, X } from 'lucide-react'
import { useBreez } from '@/contexts/BreezContext'

import QRCode from 'qrcode' // npm i qrcode

// Simple Modal (remplacez par votre Dialog si besoin)
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: any }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}

export default function ActionButtons() {
  const { payInvoice, receiveInvoice, loading: breezLoading } = useBreez()

  // Send state
  const [invoiceToPay, setInvoiceToPay] = useState('')
  const [sending, setSending] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)

  // Receive state
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedInvoice, setGeneratedInvoice] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [receiveAmount, setReceiveAmount] = useState<number | ''>('')
  const [manualInvoice, setManualInvoice] = useState<string>('')

  // Scan state
  const [scanOpen, setScanOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  // Send handling
  const handleSendSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const inv = invoiceToPay?.trim()
    if (!inv) {
      alert('Veuillez saisir une invoice à payer.')
      return
    }
    setSending(true)
    try {
      await payInvoice(inv)
      alert('✅ Paiement effectué avec succès.')
      setInvoiceToPay('')
      setSendOpen(false)
    } catch (err: any) {
      console.error('Pay error', err)
      alert(`❌ Erreur lors du paiement: ${err?.detail || err?.message || String(err)}`)
    } finally {
      setSending(false)
    }
  }

  // Receive handling (generate invoice and QR). If manualInvoice is provided, use it; otherwise call receiveInvoice(amount)
  const handleReceive = async () => {
    setGenerating(true)
    setGeneratedInvoice(null)
    setQrDataUrl(null)

    try {
      let inv: string
      if (manualInvoice && manualInvoice.trim().length > 0) {
        inv = manualInvoice.trim()
      } else {
        const amount = typeof receiveAmount === 'number' && receiveAmount > 0 ? receiveAmount : undefined
        const res = await receiveInvoice(amount)
        inv = res
      }

      setGeneratedInvoice(inv)

      // Try to get raster QR first
      try {
        if (typeof window !== 'undefined' && typeof QRCode.toDataURL === 'function') {
          const dataUrl = await QRCode.toDataURL(inv, { margin: 1, scale: 6 })
          setQrDataUrl(dataUrl)
        } else {
          throw new Error('toDataURL unavailable')
        }
      } catch (qrErr) {
        // Fallback to SVG string
        try {
          if (typeof QRCode.toString === 'function') {
            const svgString = await QRCode.toString(inv, { type: 'svg', margin: 1 })
            const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`
            setQrDataUrl(svgDataUrl)
          } else {
            throw qrErr
          }
        } catch (svgErr) {
          console.warn('QR generation fallback failed', svgErr)
        }
      }

      setReceiveOpen(true)
    } catch (err: any) {
      console.error('Receive error', err)
      alert(`❌ Erreur lors de la génération de la facture: ${err?.detail || err?.message || String(err)}`)
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = async (text?: string | null) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      alert('Copié dans le presse-papier')
    } catch {
      alert('Impossible de copier automatiquement. Sélectionnez et copiez manuellement.')
    }
  }

  // --- Scan logic using BarcodeDetector if available, otherwise file input fallback ---
  useEffect(() => {
    if (!scanOpen) return
    setScanError(null)
    let mounted = true

    async function startCamera() {
      setScanning(true)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        // Prefer BarcodeDetector if available
        const hasBarcode = (window as any).BarcodeDetector && (window as any).BarcodeDetector.getSupportedFormats
        if (hasBarcode) {
          const formats = await (window as any).BarcodeDetector.getSupportedFormats?.()
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
          const loop = async () => {
            if (!mounted) return
            try {
              if (!videoRef.current) return
              const detections = await detector.detect(videoRef.current)
              if (detections && detections.length > 0) {
                const raw = detections[0].rawValue
                if (raw) {
                  setInvoiceToPay(raw)
                  stopCamera()
                  setScanOpen(false)
                }
                return
              }
            } catch (err) {
              // ignore detection errors, fallback to setScanError
              console.debug('BarcodeDetector error', err)
            }
            requestAnimationFrame(loop)
          }
          loop()
        } else {
          // Fallback: no BarcodeDetector — still show video so user can snapshot and upload
          // Inform user to tap capture button (we provide file-upload fallback UI)
        }
      } catch (err: any) {
        setScanError(err?.message || String(err))
      } finally {
        setScanning(false)
      }
    }

    startCamera()

    return () => {
      mounted = false
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanOpen])

  const stopCamera = () => {
    const s = streamRef.current
    if (s) {
      s.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause()
        videoRef.current.srcObject = null
      } catch {}
    }
  }

  // File fallback: user uploads an image containing a QR to decode using an offscreen canvas + BarcodeDetector if available
  const handleFileScan = async (file?: File) => {
    if (!file) return
    const img = document.createElement('img')
    img.src = URL.createObjectURL(file)
    await new Promise((res) => (img.onload = res))

    // Try BarcodeDetector on image
    if ((window as any).BarcodeDetector) {
      try {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
        // draw to canvas then detector.detect(canvas) requires video or canvas; draw to canvas:
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas not available')
        ctx.drawImage(img, 0, 0)
        const detections = await detector.detect(canvas)
        if (detections && detections.length > 0) {
          const raw = detections[0].rawValue
          if (raw) {
            setInvoiceToPay(raw)
            setScanOpen(false)
            return
          }
        }
      } catch (err) {
        console.debug('BarcodeDetector on image failed', err)
      }
    }

    // Fallback: try to decode using QRCode.toString (some libs support decoding; qrcode package doesn't decode)
    // As a practical fallback, just open the image in new tab and ask user to copy invoice manually
    window.open(img.src, '_blank')
    alert('Impossible de décoder automatiquement ce QR. Ouvrez l\'image et copiez l\'invoice manuellement.')
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera()
  }, [])

  return (
    <>
      <div className="flex justify-between gap-3 mt-4">
        <Button
          variant="secondary"
          className="flex-1 flex items-center justify-center gap-2"
          onClick={() => {
            setScanOpen(true)
          }}
        >
          <Scan size={18} /> Scan
        </Button>

        <Button
          onClick={() => setSendOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Send size={18} /> Send
        </Button>

        <Button
          onClick={() => {
            // Reset manual fields when opening
            setManualInvoice('')
            setReceiveAmount('')
            setGeneratedInvoice(null)
            setQrDataUrl(null)
            // open generate flow UI (we open a small modal to input amount or paste invoice)
            setReceiveOpen(true)
          }}
          disabled={generating || breezLoading}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Download size={18} /> Receive
        </Button>
      </div>

      {/* SCAN modal */}
      <Modal open={scanOpen} onClose={() => { setScanOpen(false); stopCamera(); }} title="Scanner un QR">
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <div className="w-full h-64 bg-gray-50 rounded border flex items-center justify-center overflow-hidden">
              {/* video for live scanning */}
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            </div>

            {scanError && <div className="text-sm text-red-500">Erreur caméra: {scanError}</div>}

            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFileScan(f)
                }}
                className="text-sm"
              />
              <Button onClick={() => { setScanOpen(false); stopCamera() }} variant="outline">Close</Button>
            </div>

            <div className="text-sm text-gray-500">Si le navigateur ne supporte pas la détection directe, uploadez une image du QR.</div>
          </div>
        </div>
      </Modal>

      {/* Send modal */}
      <Modal open={sendOpen} onClose={() => setSendOpen(false)} title="Payer une invoice">
        <form onSubmit={handleSendSubmit} className="space-y-4">
          <label className="block text-sm font-medium">Invoice (Bolt11)</label>
          <textarea
            value={invoiceToPay}
            onChange={(e) => setInvoiceToPay(e.target.value)}
            placeholder="lnbc1..."
            rows={4}
            className="w-full rounded border p-2 text-sm"
            disabled={sending}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setSendOpen(false)} disabled={sending}>
              Annuler
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={sending}>
              {sending ? 'En cours...' : 'Payer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Receive modal */}
      <Modal open={receiveOpen} onClose={() => setReceiveOpen(false)} title="Facture à recevoir">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Saisir un montant (sats) ou coller une invoice</label>
            <div className="flex items-start gap-2">
              <input
                type="number"
                min={0}
                placeholder="Montant en sats (optionnel)"
                value={receiveAmount as any}
                onChange={(e) => setReceiveAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-40 rounded border p-2 text-sm"
              />
              <textarea
                value={manualInvoice}
                onChange={(e) => setManualInvoice(e.target.value)}
                placeholder="Ou collez ici une invoice si vous en possédez une"
                rows={3}
                className="flex-1 rounded border p-2 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" onClick={() => { setManualInvoice(''); setReceiveAmount('') }}>Reset</Button>
              <Button onClick={handleReceive} disabled={generating} className="bg-green-600 hover:bg-green-700">
                {generating ? 'Génération...' : 'Générer'}
              </Button>
            </div>
          </div>

          {generatedInvoice && (
            <div>
              <label className="block text-sm font-medium mb-1">Invoice générée</label>
              <div className="flex items-start gap-2">
                <textarea readOnly value={generatedInvoice} rows={3} className="w-full rounded border p-2 text-sm bg-gray-50" />
                <div className="flex flex-col gap-2 ml-2">
                  <Button onClick={() => copyToClipboard(generatedInvoice)}>Copy</Button>
                  <Button onClick={() => { setGeneratedInvoice(null); setQrDataUrl(null) }} variant="outline">Close</Button>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">QR Code</label>
            <div className="flex items-center justify-center">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR Invoice" className="h-52 w-52 object-contain" />
              ) : (
                <div className="h-52 w-52 flex items-center justify-center rounded border bg-gray-50 text-sm text-gray-500">
                  {generating ? 'Génération...' : 'QR indisponible'}
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
