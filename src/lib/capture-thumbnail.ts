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
  const W = 1280
  const H = 720

  function drawOverlays(ctx: CanvasRenderingContext2D) {
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
    ctx.fillStyle = '#ffffff40'
    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText('MagicLens', 16, 24)
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 18px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(clipTitle, W / 2, 36)
    ctx.textAlign = 'start'
  }

  function drawBackground(ctx: CanvasRenderingContext2D) {
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#1e1b4b')
    grad.addColorStop(0.5, '#172554')
    grad.addColorStop(1, '#0f172a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
  }

  function canvasToBlob(c: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      c.toBlob((b) => {
        if (b) resolve(b)
        else reject(new Error('Canvas toBlob failed'))
      }, 'image/png', 0.85)
    })
  }

  // Try drawing with video frame first
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  drawBackground(ctx)

  if (videoEl && videoEl.readyState >= 2) {
    try {
      const vw = videoEl.videoWidth
      const vh = videoEl.videoHeight
      if (vw > 0 && vh > 0) {
        const scale = Math.min(W / vw, H / vh)
        ctx.drawImage(videoEl, (W - vw * scale) / 2, (H - vh * scale) / 2, vw * scale, vh * scale)
      }
    } catch {
      // cross-origin without CORS — canvas tainted
    }
  }

  drawOverlays(ctx)

  return canvasToBlob(canvas).catch(() => {
    // Canvas was tainted by cross-origin video — rebuild without it
    const clean = document.createElement('canvas')
    clean.width = W
    clean.height = H
    const c2 = clean.getContext('2d')!
    drawBackground(c2)
    drawOverlays(c2)
    return canvasToBlob(clean)
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
