import pick from 'lodash/pick'

export function filterAccess (res, access) {
  if (typeof access === 'boolean' && access) {
    return res
  }

  return pick(res, access)
}
