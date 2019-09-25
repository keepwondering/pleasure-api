import { ApiError } from 'pleasure-api-client/src/lib/api-error'
import get from 'lodash/get'

export async function read ({ entity, id, entryPath, execQueryFilter }) {
  let doc = await execQueryFilter(entity.findById(id))
  const fullIdentifier = id + (entryPath ? `/${entryPath}` : '')

  if (entryPath) {
    doc = get(doc, entryPath)
  }

  if (!doc) {
    throw new ApiError(`${fullIdentifier} not found`, 404)
  }

  return doc
}
