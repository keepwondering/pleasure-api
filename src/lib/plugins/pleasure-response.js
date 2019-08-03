import Boom from 'boom'

export default {
  name: 'response',
  extend ({ router }) {
    // return pleasure api results
    router.use((ctx) => {
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
