const test = require('ava')
const { fork } = require('child_process')
const { api } = require('../../') // pleasure
const path = require('path')

const dummyProjectPath = path.join(__dirname, '../../')
let webServer

test.beforeEach(async t => {
  // clean db before each test
  await api.utils.db.emptyModels()

  const { entities: { user, product } } = await api.getEntities()

  // register a dummy user
  const dummyUser = await new user({
    fullName: 'Martin Rafael Gonzalez',
    email: 'tin@devtin.io',
    level: 'admin',
    password: 'aVeryStrongPassword123:)'
  }).save()

  process.emit('dummy-user', dummyUser)

  // register a dummy product
  const dummyProduct = await new product({
    name: 'Kombucha',
    price: 1.99,
    stock: 5,
    categories: ['beverages', 'health']
  }).save()

  process.emit('dummy-product', dummyProduct)
})

test.before(async t => {
  // fork dummy project (web server)
  await new Promise((resolve, reject) => {
    const c = setTimeout(reject.bind(null, new Error(`Web server did not answer`)), 3000) // wait 1000 ms for the server to start

    webServer = fork(require.resolve(dummyProjectPath), {
      cwd: dummyProjectPath,
      env: {
        NODE_ENV: 'test',
        silent: true
      }
    })

    webServer.on('message', m => {
      if (m === 'ready') {
        clearTimeout(c)
        resolve()
      }
    })
  })
})

test.after.always(async t => {
  webServer && webServer.kill()
})
