export async function queryFilter (entity, queryFilter = []) {
  if (queryFilter.length > 0) {
    queryFilter.forEach(filter => {
      entity = filter(entity)
    })
    entity = await entity.exec()
  }

  return typeof entity === 'function' ? entity() : entity
}
