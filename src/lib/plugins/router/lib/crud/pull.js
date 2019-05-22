import get from 'lodash/get'
import forEach from 'lodash/forEach'
import { ApiError } from 'pleasure-api-client'
import castArray from 'lodash/castArray'

export async function pull ({ entity, id, entryPath, pull }) {
  const doc = await entity.findById(id)
  const array = get(doc, entryPath)

  if (!Array.isArray(array)) {
    const fullIdentifier = `${id}/${entryPath}`
    throw new ApiError(`${fullIdentifier} not found`, 404)
  }

  castArray(pull).forEach(pull => {
    let pullIndex

    forEach(array, (v, index) => {
      // if it's an object, compare it against the _id
      if (typeof v === 'object' && v.id === pull) {
        pullIndex = index
        return false
      } else if (typeof v !== 'object' && v === pull) {
        pullIndex = index
        return false
      }
    })

    if (typeof pullIndex === 'undefined') {
      throw new Error(`${pull} not found`)
    }

    array.splice(pullIndex, 1)
  })

  return doc.save()
}
