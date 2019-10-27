import mapValues from 'lodash/mapValues'

export function sanitateUrlParamsToMongoDriver (params, child) {
  if (typeof params === 'object' && !Array.isArray(params)) {
    return mapValues(params, theParams => {
      return sanitateUrlParamsToMongoDriver(theParams, true)
    })
  }

  if (Array.isArray(params)) {
    return params
  }

  if (typeof params === 'string' && /^-?[\d]+(\.[\d]+)?$/.test(params)) {
    return Number(params)
  }

  if (/^(true|false)$/.test(params)) {
    return params === 'true'
  }

  if (typeof params === 'string') {
    try {
      return JSON.parse(params)
    } catch (err) {
      // shhh...
    }
  }

  return params
}
