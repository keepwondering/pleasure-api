/**
 * @typedef {Object} API.ApiPlugin
 *
 * An `ApiPlugin` is an `Object` operated by the API router pipeline of the framework to extend its functionality.
 *
 * @property {String} name - The name of the plugin. This name will be used as a key to pass configuration variables
 * to the plugin via the {@link pleasure.config.js}
 * @property {Object} config - Initial config of the plugin. This config can be changed from the `pleasure.config.js` by
 * using the plugin's name scope in the `api` configuration object of the file.
 * @property {Object} methods - Object that exposes custom methods for other plugins to interact with the logic or take
 * advantage of shared features.
 * @property {Function} [prepare] - Receives the koa router as the first argument
 * @property {Function} [respond] - Filter function that receives the generated object that is gonna be returned along with
 * the request information.
 * @property {Function} [schemaCreated] - Hook called per entity created, meant to extend the schema functionality.
 *
 * @example Changing configuration of a plugin
 *
 * ```js
 * // pleasure.config.js
 * module.exports = {
 *   // ...
 *   api: {
 *     // changing plugin 'jwt' configuration
 *     jwt: {
 *
 *     }
 *   }
 *   // ...
 * }
 * ```
 */

export default {
  name: '',
  /**
   * @callback schemaCreated
   * @param {PleasureEntityMap} pleasureEntityMap - The entity name.
   * @param {Object} pluginsApi - Object keyed by plugin name, containing all `methods` exported by loaded plugins.
   * @param {Object} config - Resulting object of the `deepmerge` operation between the `config` property of the plugin
   * and the object (if) found in the pleasure local configuration file > plugin's name scope.
   */
  init ({ pleasureEntityMap, pluginsApi, config }) {

  },
  methods: {
    // the methods
  },
  /**
   * @callback schemaCreated
   * @param {Object} res - The entity name.
   * @param {String} res.entityName - The entity name.
   * @param {Object} res.mongooseSchema - The created mongoose schema.
   */
  schemaCreated ({ entityName, mongooseSchema }) {
    // extend the schema functionality
  },
  /**
   * @callback prepare
   * @param {Object} koaRouter - The `app` koa router. Used to
   */
  prepare (koaRouter) {
    // extend the router functionality (controller)
  },
  /**
   * @callback extend
   * @param {Object} response - The response that's gonna be sent to the user
   * @param {Object} pleasureCtx - The pleasure request
   */
  extend (response, pleasureCtx) {
    // filter responses
  },
  /**
   * @callback response
   * @param {Object} response - The response that's gonna be sent to the client
   * @param {Object} pleasureCtx - The pleasure request
   * @return {Object} - The response
   */
  response (response, pleasureCtx) {
    // filter responses
    // must return the response
  }
}
