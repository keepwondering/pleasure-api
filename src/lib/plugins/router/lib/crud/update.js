import Boom from 'boom'
import omit from 'lodash/omit'
import { addedDiff, updatedDiff } from 'deep-object-diff'
import { mergeWithMongoose } from 'src/lib/utils/merge-with-mongoose'
import size from 'lodash/size'

export async function update ({ id, entry, newEntry, entryGranted, entryResult, access }) {
  const theEntry = await entry()

  if (!theEntry) {
    throw Boom.badRequest(`Entry not found.`)
  }

  const updating = omit(updatedDiff(theEntry.toObject(), newEntry), ['_id'])
  const notGranted = addedDiff(entryGranted, updating)

  if (size(notGranted) > 0) {
    throw Boom.badRequest(`Access to ${Object.keys(notGranted)} were not granted.`)
  }

  mergeWithMongoose(theEntry, entryResult)
  return theEntry.save()
}
