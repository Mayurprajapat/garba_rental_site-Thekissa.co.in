// Payment screenshot — compress + upload helpers.
// Mobile se 3-4MB photo aati hai; canvas par chhota karke ~100KB JPEG banate hain
// taaki upload fast ho aur browser storage full na ho.

export function fileToCompressedDataUrl(file: File, maxSide = 900, quality = 0.72): Promise<string | null> {
  return new Promise((res) => {
    if (!file || !file.type.startsWith('image/')) { res(null); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        c.getContext('2d')?.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', quality));
      } catch {
        URL.revokeObjectURL(url);
        res(null);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); res(null); };
    img.src = url;
  });
}

export function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const [head, data] = dataUrl.split(',');
    const mime = /data:(.*?);/.exec(head)?.[1] || 'image/jpeg';
    const bin = atob(data);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  } catch {
    return null;
  }
}

/**
 * Network/canvas kaam ko time-bound karo — hang ho to reject, taaki UI (Save/upload
 * buttons) kabhi atki na rahe. Supabase builders thenable hote hain, isliye .finally
 * ke bajaye then/clearTimeout pattern (sab par safe).
 */
export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new Error('timeout')), ms);
  });
  return Promise.race([
    p.then(
      (v) => { if (t) clearTimeout(t); return v; },
      (e) => { if (t) clearTimeout(t); throw e; }
    ),
    timeout,
  ]);
}
