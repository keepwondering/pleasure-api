import { addedDiff } from 'deep-object-diff'
import size from 'lodash/size'
import Boom from 'boom'

export async function create ($pleasureApiCtx) {
  const { entity, newEntry, entryGranted, entryResult, access } = $pleasureApiCtx
  const notGranted = addedDiff(entryGranted, newEntry)

  if (size(notGranted) > 0) {
    throw Boom.badRequest(`Access to ${ Object.keys(notGranted) } were not granted.`)
  }

  const theEntry = new entity(entryResult)
  theEntry.$pleasure = $pleasureApiCtx

  return theEntry.save()
}
