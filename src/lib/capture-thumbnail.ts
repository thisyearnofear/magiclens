/**
 * Capture a remix preview frame as a PNG blob using the Canvas API.
 * Draws the video frame + overlay decorations without any external library.
 */

let _pendingThumbnail: Promise<string | null> | null = null

/** Store a pending thumbnail URL promise for the mint hook to consume. */
export function setPendingThumbnail(promise: Promise<string | null>) {
  _pendingThumbnail = promise
}

/** Consume the pending thumbnail URL (clears after read). */
export async function consumePendingThumbnail(): Promise<string | null> {
  const p = _pendingThumbnail
  _pendingThumbnail = null
  return p ?? null
}

export function captureRemixFrame(
  videoEl: HTMLVideoElement | null,
  overlays: { id: string; name: string }[],
  clipTitle: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const W = 1280
    const H = 720
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return reject(new Error('Canvas not available'))

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#1e1b4b')
    grad.addColorStop(0.5, '#172554')
    grad.addColorStop(1, '#0f172a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Draw video frame
    if (videoEl && videoEl.readyState >= 2) {
      try {
        const vw = videoEl.videoWidth
        const vh = videoEl.videoHeight
        if (vw > 0 && vh > 0) {
          const scale = Math.min(W / vw, H / vh)
          const dx = (W - vw * scale) / 2
          const dy = (H - vh * scale) / 2
          ctx.drawImage(videoEl, dx, dy, vw * scale, vh * scale)
        }
      } catch {
        // cross-origin video may taint canvas; skip gracefully
      }
    }

    // Draw overlay decorations
    const overlayColors: Record<string, string> = {
      'flag-halos': '#a855f7',
      'goal-lower-third': '#ef4444',
      'trophy-confetti': '#eab308',
      'commentary-bubble': '#3b82f6',
      'stadium-sparkles': '#facc15',
      'ref-card': '#dc2626',
    }

    overlays.forEach((ov, i) => {
      const color = overlayColors[ov.id] || '#8b5cf6'
      const x = 40 + i * 120
      const y = H - 60

      ctx.fillStyle = color + '30'
      ctx.beginPath()
      ctx.roundRect(x, y, 100, 36, 8)
      ctx.fill()

      ctx.fillStyle = color
      ctx.font = '600 13px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillText(ov.name, x + 10, y + 23)
    })

    // MagicLens watermark
    ctx.fillStyle = '#ffffff40'
    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText('MagicLens', 16, 24)

    // Title
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 18px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(clipTitle, W / 2, 36)
    ctx.textAlign = 'start'

    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas toBlob failed'))
    }, 'image/png', 0.85)
  })
}

/**
 * Upload a PNG blob to Grove storage and return the gateway URL.
 */
export async function uploadThumbnailToGrove(blob: Blob): Promise<string> {
  const res = await fetch('https://api.grove.storage?chain_id=1', {
    method: 'POST',
    body: blob,
  })
  if (!res.ok) {
    throw new Error(`Grove image upload failed: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  return data.gateway_url as string
}
