import mapValues from 'lodash/mapValues'

export function parseNumberAndBoolean (v) {
  if (typeof v === 'object' && !Array.isArray(v)) {
    return mapValues(v, parseNumberAndBoolean)
  }

  if (Array.isArray(v)) {
    return v
  }

  if (/^-?[\d]+(\.[\d]+)?$/.test(v)) {
    return Number(v)
  }

  if (/^(true|false)$/.test(v)) {
    return v === 'true'
  }

  return v
}
