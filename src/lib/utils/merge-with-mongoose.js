import forOwn from 'lodash/forOwn'
import { flattenObject } from './flatten-object.js'

export function mergeWithMongoose (doc, obj) {
  if (!doc) {
    return doc
  }

  forOwn(flattenObject(obj), (value, path) => {
    doc.set(path, value)
  })

  return doc
}
