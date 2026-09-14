// Facebook Marketplace URL builder for the apify/facebook-marketplace-scraper actor.
//
// The actor accepts three URL shapes:
//   - Location:     https://www.facebook.com/marketplace/<location>/
//   - Category:     https://www.facebook.com/marketplace/<location>/<category>
//   - Search query: https://www.facebook.com/marketplace/<location>/search/?query=<term>
//
// "propertyrentals" is Facebook's own category for rental listings — using it
// (instead of a bare keyword search across ALL categories) is what keeps cars,
// furniture, and other unrelated items out of the results. An optional query
// can be layered on top of the category to bias toward direct-owner language
// (e.g. "owner", "direct") without losing the category restriction.
const DEFAULT_CATEGORY = 'propertyrentals';

export function buildMarketplaceSearchUrl(params: {
  location: string;
  category?: string;
  query?: string;
}): string {
  const location = params.location.trim().toLowerCase().replace(/\s+/g, '');
  const category = (params.category || DEFAULT_CATEGORY).trim().toLowerCase();
  const base = `https://www.facebook.com/marketplace/${location}/${category}`;

  if (!params.query?.trim()) return base;

  const qs = new URLSearchParams({ query: params.query.trim() });
  return `${base}?${qs.toString()}`;
}

// Matches the three URL shapes documented above so user-pasted URLs (instead
// of ones built via buildMarketplaceSearchUrl) are still accepted.
export const MARKETPLACE_URL_PATTERN =
  /^https:\/\/www\.facebook\.com\/marketplace\/[\w-]+(\/[\w-]+)?(\/search)?\/?(\?.*)?$/;
