import * as authorization from './router/lib/get-permissions.js'

/**
 * @typedef {Object} ApiPlugin
 *
 * A pleasure api plugin hooks within the api logic and consists in an Object with two callback function:
 * `prepare` and `extend`.
 *
 * @property {Function} [prepare] - Receives the router as first argument
 * @property {Function} [extend] - Receives the router as first argument
 */

export default {
  authorization
}
