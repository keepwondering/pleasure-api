import qs from 'qs'

export function getPleasureQuery (ctx) {
  const { querystring } = ctx.request
  let { $pleasure = {} } = qs.parse(querystring, { interpretNumericEntities: true })
  return $pleasure
}
