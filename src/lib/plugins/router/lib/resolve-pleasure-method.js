export function resolvePleasureMethod (ctx) {
  let { params: { id, entryPath }, request: { method } } = ctx

  if (method === 'POST' && !id) {
    if (entryPath) {
      return 'push'
    }

    return 'create'
  }

  if (method === 'POST' && id && entryPath) {
    return 'push'
  }

  if (method === 'GET') {
    if (id) {
      return 'read'
    }

    return 'list'
  }

  if (method === 'PATCH') {
    if (entryPath) {
      return 'patch'
    }

    return 'update'
  }

  if (method === 'DELETE') {
    if (entryPath) {
      return 'pull'
    }

    return 'delete'
  }
}
