import { cleanEmptyArrays } from 'lib/utils/clean-empty-array'

export function cleanMongooseEntry (entry) {
  // clean array empties
  return cleanEmptyArrays(entry)
}
