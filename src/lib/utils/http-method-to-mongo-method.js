export const httpMethodToMongoMethod = {
  post: 'create',
  patch: 'update',
  delete: 'delete',
  get: 'read' // conditionally patched to 'list' in the router... nasty...
}
