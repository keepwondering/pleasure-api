import get from 'lodash/get'
import Boom from 'boom'
import defaults from 'lodash/defaults'

export default {
  name: 'response',
  extend ({ router }) {
    // return pleasure api results
    router.use((ctx) => {
      // api returning a string
      // will be converted in an object response
/*
      if (!ctx.$pleasure.res) {
        ctx.body = Boom.badData().output.payload
        return
      }
*/

      let apiResponse

      if (ctx.$pleasure.res) {
        apiResponse = {
          statusCode: 200,
          data: ctx.$pleasure.res
        }
      }

      ctx.body = apiResponse || Boom.notImplemented(`Method not implemented`).output.payload
    })
  }
}
