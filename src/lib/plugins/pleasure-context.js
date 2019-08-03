import Boom from 'boom'

export default {
  name: 'context',
  prepare ({ router }) {
    router.use(async function robots (ctx, next) {
      ctx.response.set('X-Robots-Tag', 'noindex, nofollow')
      return next()
    })

    // return response time in X-Response-Time header
    router.use(async function responseTime (ctx, next) {
      const t1 = Date.now()
      await next()
      const t2 = Date.now()
      ctx.set('X-Response-Time', Math.ceil(t2 - t1) + 'ms')
      // console.log(`response time...`, Math.ceil(t2 - t1) + 'ms')
    })

    // pleasure context
    router.use(async (ctx, next) => {
      ctx.$pleasure = {
        res: null,
        errors: [],
        error (error) {
          this.errors.push(error)
        }
      }

      try {
        await next()
      } catch (err) {
        console.log(err)
        ctx.body = (Boom.isBoom(err) ? err : Boom.badRequest(err.message)).output.payload
      }
    })
  }
}
