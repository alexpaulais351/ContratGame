const LIMITE = 1_000_000 // ~1 Mo (data URL)

function charger(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = () => rej(new Error('Image illisible'))
    img.src = src
  })
}

function lireDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.onerror = () => rej(new Error('Lecture du fichier impossible'))
    r.readAsDataURL(file)
  })
}

/** Lit une image en data URL ; la redimensionne via canvas si > ~1 Mo. */
export async function lireLogo(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Le fichier doit être une image')
  const url = await lireDataUrl(file)
  if (url.length <= LIMITE) return url
  const img = await charger(url)
  let max = 800
  for (let i = 0; i < 6; i++) {
    const ratio = Math.min(1, max / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.width * ratio))
    canvas.height = Math.max(1, Math.round(img.height * ratio))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas indisponible')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    // PNG conserve la transparence ; JPEG en repli si encore trop lourd
    let out = canvas.toDataURL('image/png')
    if (out.length > LIMITE) out = canvas.toDataURL('image/jpeg', 0.85)
    if (out.length <= LIMITE) return out
    max = Math.round(max * 0.7)
  }
  throw new Error('Image trop volumineuse')
}
