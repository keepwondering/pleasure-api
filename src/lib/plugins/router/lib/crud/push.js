import get from 'lodash/get'
import { ApiError } from 'pleasure-client'

export async function push ({ entity, id, entryPath, newEntry, params }) {
  const doc = await entity.findById(id)
  const array = get(doc, entryPath)

  if (!Array.isArray(array)) {
    const fullIdentifier = `${ id }/${ entryPath }`
    throw new ApiError(`${ fullIdentifier } not found`, 404)
  }

  if (newEntry.multiple) {
    if (!Array.isArray(newEntry.push)) {
      return
    }
    array.push(...newEntry.push)
  } else {
    array.push(newEntry.push)
  }

  return doc.save()
}
