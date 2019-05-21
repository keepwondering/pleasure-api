import kebabCase from 'lodash/kebabCase'

export function getCollectionName (name) {
  return kebabCase(name)
}
