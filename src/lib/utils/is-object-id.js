import { Types } from 'mongoose'

const { ObjectId } = Types

/**
 * Determines whether a given value is an ObjectId or not
 *
 * @param {String} id - The id to validate
 * @return {Boolean} - Whether `id` is or not a valid ObjectId
 */
export function isObjectId (id) {
  if (id instanceof ObjectId) {
    return true
  }

  return ObjectId.isValid(id) && new ObjectId(id).toString() === id
}
