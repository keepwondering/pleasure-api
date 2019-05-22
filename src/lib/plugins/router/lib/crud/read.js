import { ApiError } from 'pleasure-api-client'
import get from 'lodash/get'

export async function read ({ entity, id, entryPath, queryFilter }) {
  let doc = await queryFilter(entity.findById(id))
  const fullIdentifier = id + (entryPath ? `/${entryPath}` : '')

  if (entryPath) {
    doc = get(doc, entryPath)
  }

  if (!doc) {
    throw new ApiError(`${fullIdentifier} not found`, 404)
  }

  return doc
}
