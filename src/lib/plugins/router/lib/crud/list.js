export async function list ({ entity, params, queryFilter }) {
  // console.log(`listing`, queryFilter)
  let query = entity.find({})

  if (params.search) {
    query = query.find({ $text: { $search: params.search } })
  }

  if (params.find) {
    // todo: restrict query by access level
    query = query.find(params.find)
  }

  if (params.sort) {
    query = query.sort(params.sort)
  }

  if (params.skip && Number.isInteger(params.skip)) {
    query = query.skip(params.skip)
  }

  if (params.limit && Number.isInteger(params.limit)) {
    query = query.limit(params.limit)
  }

  return queryFilter(query)
}
