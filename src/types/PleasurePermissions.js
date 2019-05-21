/**
 *
 * @type {{patch: boolean, schema: boolean, pull: boolean, read: boolean, create: boolean, update: boolean, list: boolean, delete: boolean, push: boolean}}
 */
export const defaultValues = {
  create: true,
  pull: true,
  push: true,
  read: true,
  list: true,
  delete: true,
  update: true,
  patch: true,
  schema: true
}

export default {
  /**
   * Callback before creating a new entry
   *
   * @callback PleasureHook
   * @property {ApiContext} pleasureCtx - ApiContext of the request. See {@link ApiContext}
   *
   * @return {boolean|Array} - True to perform the operation, false otherwise. Alternatively, an array of strings
   * representing each field of the entity that the request is granted access to.
   */
  create ({ user, create, ctx } = {}) {
    // return user.level === 'admin'
    return defaultValues.create
  },
  push ({ user, push, entry, ctx, field } = {}) {
    return defaultValues.push
  },
  pull ({ user, pull, entry, ctx, field } = {}) {
    return defaultValues.pull
  },
  read ({ user, id, entry, ctx } = {}) {
    return defaultValues.read
  },
  update ({ user, id, entry, update, ctx } = {}) {
    return defaultValues.update
  },
  patch ({ user, id, field, entry, patch, ctx } = {}) {
    return defaultValues.patch
  },
  delete ({ user, id, entry, ctx } = {}) {
    return defaultValues.delete
  },
  list ({ user, filter, search, ctx } = {}) {
    return defaultValues.list
  },
  schema ({ user, ctx } = {}) {
    return defaultValues.schema
  },
  $order: [
    'profilePicture',
    'firstName',
    'lastName',
    'email',
    'smeId',
    'phoneNumber',
    'affiliate',
    'department',
    'level',
    'unsuccessfulLoginAttempts',
    'lockedUntil',
    'locked',
    'password',
    'passwordSet',
    'dfa.installed',
    'forcePasswordChange',
    'isOnline',
    'lastSignIn',
    'activeSessions',
    'jwtSessions',
    '_id'
  ],
  $render: {
    admin: {
      isOnline: {
        component: 'virtual-boolean'
      }
    }
  }
}
