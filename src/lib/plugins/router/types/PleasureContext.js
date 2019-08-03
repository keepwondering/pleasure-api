import merge from 'deepmerge'

/**
 * @typedef {Object} ApiContext
 * @memberOf API
 *
 * Object passed on all of the pleasure api hooks.
 *
 * @property {Object} [user=null] - The user in session (if any). JWT value returned by the loginMethod.
 * See `jwtAuthentication.loginMethod` in {@link ApiConfig}
 * @property {Object} ctx - The koa context. See [koa#context](https://koajs.com/#context)
 * @property {Object} entity - Mongoose model of the requested entity.
 * @property {Promise.<Object|null>|undefined} [entry] - A promised function that attempts to resolves the entry
 * `id` (if present).
 * @property {String} [entryPath=null] - Optional path to the entry field. i.e. `_.pick(entry, entryPath)`
 * @property {Object|null} newEntry - The raw data passed to the entity request via `POST`.
 * @property {Object} appendEntry - Mutable object to be merged with `newEntry` at the end of the pipeline.
 * @property {Object} [entryGranted=null] - Entry filtered according to given access.
 * @property {Object} [entryResult=null] - Resulting merged object between `entryGranted` and `appendEntry`.
 * @property {String} [id=null] - The requested entry `id` of the `entity` (if any).
 * @property {String} [method=null] - API method (create, read, update, delete, list, push, pull).
 * @property {Object} [params=null] - `GET` variables sent within the request (if any).
 * @property {Function} queryFilter - Array of functions that will be executed with the queried `entry` as the
 * only parameter.
 * `entry => { return entry.find({ email: /@gmail.com$/i })}`.
 * See [mongoose queries](https://mongoosejs.com/docs/queries.html).
 * @property {Function} overrideReadAccess - Receives an optional value to override read access on the current request.
 * @property {Boolean|Array|undefined} overriddenReadAccess - Holds an optional array with any overridden read access in
 * the pipeline.
 */

export default function ApiContext (apiContext) {
  return merge({
    user: null,
    ctx: null,
    entity: null,
    entry: null,
    entryPath: null,
    newEntry: null,
    appendEntry: {},
    entryGranted: null,
    entryResult: null,
    queryFilter: []
  }, apiContext)
}
