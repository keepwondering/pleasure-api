import dot from 'dot-object'

export function flattenObject (ob) {
  let tgt = {}
  dot.dot(ob, tgt)
  return tgt
}
