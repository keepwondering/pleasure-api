export async function list ({ entity, params, execQueryFilter }) {
  // console.log(`listing`, queryFilter)
  let query = entity.find({})

  if (params.search) {
    query = query.find({ $text: { $search: params.search } })
  }

  if (params.find) {
    // todo: restrict query by access level
    // todo: IMPORTANT to restrict prior release
    query = query.find(params.find)
  }

  if (params.sort) {
    // guarantee sort order
    let sort
    if (Array.isArray(params.sort)) {
      sort = {}
      params.sort.forEach(filter => {
        Object.assign(sort, filter)
      })
    } else {
      sort = params.sort
    }
    query = query.sort(sort)
  }

  if (params.skip && Number.isInteger(params.skip)) {
    query = query.skip(params.skip)
  }

  if (params.limit && Number.isInteger(params.limit)) {
    query = query.limit(params.limit)
  }

  return execQueryFilter(query)
}
