import { isObjectId } from './is-object-id.js'

/**
 * Compares two mongoose ObjectId's.
 *
 * @param {String|ObjectId} id1 - The id to validate
 * @param {String|ObjectId} id2 - The id to validate
 * @return {Boolean} - Whether `id1` and `id2` are equal, despite their type
 */
export function idsAreEqual (id1, id2) {
  id1 = isObjectId(id1) ? id1.toString() : id1
  id2 = isObjectId(id2) ? id2.toString() : id2
  console.log({ id1, id2 }, typeof id1, typeof id2)
  return id1 === id2
}
