import Promise from 'bluebird'

export async function remove ($pleasureApiCtx) {
  const { execQueryFilter, entry, entity, params: { id, many = false } } = $pleasureApiCtx

  if (entry) {
    return (await execQueryFilter(entry)).remove()
  }

  if (typeof id !== 'object') {
    return
  }

  let query = id

  if (Array.isArray(id)) {
    if (id.length === 0) {
      return
    }

    query = {
      $or: id.map(id => {
        return { _id: id }
      })
    }
  }

  if (many) {
    const result = await entity.find(query).deleteMany()
    return { query, result }
  }

  const entries = await entity.find(query)

  const removed = []
  const errors = []

  await Promise.each(entries, async entry => {
    try {
      removed.push(await entry.remove())
    } catch (err) {
      errors.push({ _id: entry._id, message: err.message })
    }
  })

  // todo: do something with errored messages

  return removed
}
