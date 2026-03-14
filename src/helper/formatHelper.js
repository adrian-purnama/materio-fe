import { baseURL } from "./apiHelper"

const formatImageUrl = (url) => {
  return `${baseURL}${url}`
}

/**
 * Format a number with dot as thousands separator (e.g. 180000 → "180.000").
 * @param {number} num - Value to format
 * @param {number} [decimals=0] - Decimal places (use 0 for integers)
 * @returns {string} Formatted string
 */
export const formatNumber = (num, decimals = 0) => {
  if (num == null || Number.isNaN(Number(num))) return ''
  const n = Number(num)
  const fixed = decimals > 0 ? n.toFixed(decimals) : String(Math.round(n))
  const [intPart, decPart] = fixed.split('.')
  const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return decPart != null ? `${withDots},${decPart}` : withDots
}

/**
 * Parse a formatted number string back to a number (e.g. "180.000" → 180000).
 * Accepts dot as thousands separator and comma or dot as decimal separator.
 * @param {string} str - Formatted string
 * @returns {number} Parsed number, or NaN if invalid
 */
export const parseFormattedNumber = (str) => {
  if (str == null || str === '') return NaN
  const cleaned = String(str).trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  return Number(cleaned) || NaN
}

export default formatImageUrl
