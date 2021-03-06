import Promise from 'bluebird'
import uniq from 'lodash/uniq'

/**
 * @typedef {Function} ApiHook
 * @desc A function that attaches to an {@link API.Access} request.
 *
 * @param {ApiContext} apiContext - ApiContext of the request or undefined. See {@link ApiContext}
 *
 * @return {Boolean|String[]} - `true` to perform the operation, `false` otherwise. Alternatively, an array of strings
 * representing each field of the entity that the request is granted access to. Defaults to `false`.
 *
 * @example
 *
 * function create ({ user }) {
 *   return user.level === 'admin'
 * }
 */

/**
 * @typedef {Object} API.Access
 * @desc Orchestrates access permissions to entities.
 *
 * http calls to the api endpoint are treated as follow:
 *
 * | HTTP method | Endpoint | Access Triggered | Description |
 * | :--- | :--- | :--- | :--- |
 * | POST | `/:entity` | `create` | Creates a new entry into `/:entity` |
 * | GET | `/:entity/:id/:target?` | `read` | Retrieves the entry defined by `/:id` (optionally returns only the property `/:target` of the entry, if any) |
 * | PATCH | `/:entity/:id/:dotted-path-to-some-field` or `/:entity?id=[...]` | `update` | Updates entry referred as `/:id` or `?id=[...]` |
 * | DELETE | `/:entity/:id` | `delete` | Deletes entry referred as `/:id` |
 * | GET | `/:entity` | `list` | Lists entries in an entity |
 * | POST | `/:entity/:id/:path-to-array-field` | `push` | Pushes into an entry's array |
 * | DELETE | `/:entity/:id/:path-to-array-field-id` | `pull` | Pulls out of an entry's array |
 *
 * @property {ApiHook} create - Called when attempting to create one or several entry(s) in an entity.
 * @property {ApiHook} read - Called when attempting to read an entry of the entity.
 * @property {ApiHook} update - Called when attempting to update one or several entry(s) from the entity.
 * @property {ApiHook} delete - Called when attempting to delete one or several entry(s) from the entity.
 * @property {ApiHook} push - Called when attempting to push into an entry's array.
 * @property {ApiHook} pull - Called when attempting to pull out of an entry's array.
 * @property {ApiHook} schema - Called when fetching schema information via API
 */

function anyUser ({ user }) {
  return !!user
}

function anyBody () {
  return true
}

export default {
  create: anyUser,
  read: anyBody,
  update: anyUser,
  delete: anyUser,
  list: anyBody,
  push: anyUser,
  pull: anyUser,
  async schema (ctx = {}) {
    //  console.log(`retrieving schema from ${ this.name }`)
    // check if any returns method true or append arrays
    let auth = []
    const methods = ['read', 'list', 'update', 'create']
    await Promise.each(methods, async method => {
      if (!Array.isArray(auth)) {
        return
      }

      const p = await this[method](ctx)

      if (!Array.isArray(p)) {
        if (p) {
          auth = true
          // console.log('breaking')
          return false
        }
        return
      }

      auth.push(...p)
    })
    return Array.isArray(auth) ? (auth.length > 0 ? uniq(auth) : false) : auth
  }
}
