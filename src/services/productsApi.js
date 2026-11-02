const BASE_URL = 'https://world.openfoodfacts.org/api/v2/product'
 
export async function lookupProduct(barcode, { signal } = {}) {
  const url = `${BASE_URL}/${encodeURIComponent(barcode)}.json?fields=product_name,brands,quantity,categories_tags`
  try {
    const res = await fetch(url, { signal: signal ?? AbortSignal.timeout(8000) })
    if (res.status === 404) return { status: 'not-found' }
    if (!res.ok) return { status: 'error', message: `HTTP ${res.status}` }
 
    const data = await res.json()
    const p = data?.product
    if (data?.status !== 1 || !p?.product_name) return { status: 'not-found' }
 
    return {
      status: 'found',
      product: {
        barcode,
        name: p.product_name,
        brand: typeof p.brands === 'string' ? p.brands.split(',')[0].trim() : undefined,
        quantity: p.quantity || undefined,
        // "en:dairies" -> "dairies"
        category: Array.isArray(p.categories_tags) && p.categories_tags[0]
          ? String(p.categories_tags[0]).replace(/^[a-z]{2}:/, '')
          : undefined,
      },
    }
  } catch (e) {
    return { status: 'error', message: e?.message ?? 'Erro de rede' }
  }
}