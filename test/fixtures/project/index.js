const Koa = require('koa')
const _ = require('lodash')
const { pleasureApi, getEntities } = require('pleasure')
const koaBody = require('koa-body')

const app = new Koa()

app.use(koaBody())

const server = app.listen(3000)

app.use(pleasureApi({
  prefix: '/api',
  plugins: [
    {
      extend ({ router }) {
        router.use((ctx, next) => {
          if (!_.get(ctx, '$pleasure.res')) {
            // throw new Error(`Not here.`)
          }
          return next() // important
        })
      }
    }
  ]
}, server))

getEntities().then(() => {
  process.send && process.send('ready')
})
