export function extractAsin(url: string): string | null {
  return (
    url.match(/\/dp\/([A-Z0-9]{10})/)?.[1] ??
    url.match(/\/gp\/product\/([A-Z0-9]{10})/)?.[1] ??
    null
  )
}

export function buildAffiliateLink(asin: string, tag: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${tag}`
}
