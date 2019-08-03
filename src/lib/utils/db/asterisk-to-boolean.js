import _ from 'lodash'

export function asteriskToBoolean (obj) {
  return _.mapValues(obj, v => {
    if (typeof v === 'object') {
      return asteriskToBoolean(v)
    }

    return v === '*' ? true : v
  })
}
