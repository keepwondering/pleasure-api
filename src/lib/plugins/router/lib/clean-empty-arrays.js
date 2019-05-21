import mapValues from 'lodash/mapValues'
import compact from 'lodash/compact'

export function cleanEmptyArrays (obj) {
  return mapValues(obj, v => {
    if (Array.isArray(v)) {
      return compact(v)
    }

    if (typeof v === 'object' && v !== null) {
      return cleanEmptyArrays(v)
    }

    return v
  })
}
