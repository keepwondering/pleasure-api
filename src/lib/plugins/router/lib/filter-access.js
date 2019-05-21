import pick from 'lodash/pick'

export function filterAccess (res, access) {
  if (typeof access === 'boolean' && access) {
    return res
  }

  if (Array.isArray(res)) {
    return res.map(v => pick(v, access))
  }

  return pick(res, access)
}
