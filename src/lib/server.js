import Koa from 'koa'
import { getConfig } from 'lib/get-config'
import { findRoot } from 'lib/utils/find-root'
import { packageJson } from 'lib/tools/package-json'
import { api } from 'src'
import koaBody from 'koa-body'
import { Nuxt, Builder } from 'nuxt'
import fs from 'fs'
import get from 'lodash/get'
import chokidar from 'chokidar'
import path from 'path'

let runningConnection
let runningBuilder
let runningPort
let runningWatcher

const nuxtConfigFile = findRoot('./nuxt.config.js')
const pleasureConfigFile = findRoot('./pleasure.config.js')

function watcher () {
  if (runningWatcher) {
    runningWatcher.close()
    runningWatcher = null
  }

  // delete cache
  delete require.cache[require.resolve(nuxtConfigFile)]
  delete require.cache[require.resolve(pleasureConfigFile)]

  const { ui: { watchForRestart = [] } } = getConfig()
  const cacheClean = [nuxtConfigFile, pleasureConfigFile].concat(watchForRestart)
  runningWatcher = chokidar.watch(cacheClean, { ignored: /(^|[\/\\])\../, ignoreInitial: true })

  runningWatcher.on('all', (event, path) => {
    // todo: trigger restart
    restart()
      .catch(err => {
        console.log(`restarting failed with error`, err.message)
      })
  })
}

export async function start (port) {
  if (runningConnection) {
    console.error(`An app is already running`)
    return
  }

  // delete cache
  delete require.cache[require.resolve(nuxtConfigFile)]
  delete require.cache[require.resolve(findRoot('./pleasure.config.js'))]

  const { pleasureApi } = api
  const { api: apiConfig } = getConfig(null, true)
  port = port || apiConfig.port

  let withNuxt = false
  let nuxt

  // enable nuxt
  if (fs.existsSync(nuxtConfigFile)) {
    withNuxt = true
    let nuxtConfig = require(nuxtConfigFile)

    const currentModules = nuxtConfig.modules = get(nuxtConfig, 'modules', [])
    const currentModulesDir = nuxtConfig.modulesDir = get(nuxtConfig, 'modulesDir', [])
    //console.log({ currentModulesDir })
    currentModulesDir.push(...require.main.paths.filter(p => {
      return currentModulesDir.indexOf(p) < 0
    }))
    //console.log({ currentModulesDir })
    const ui = ['nuxt-pleasure', {
      root: findRoot(),
      name: packageJson().name,
      config: getConfig(),
      pleasureRoot: path.join(__dirname, '..')
    }]
    currentModules.push(ui)

    //console.log({ nuxtConfig })
    nuxt = new Nuxt(nuxtConfig)

    // Build in development
    if (nuxtConfig.dev) {
      const builder = new Builder(nuxt)
      runningBuilder = builder
      await builder.build()
    }
  }

  const app = new Koa()

  app.use(koaBody())

  const server = runningConnection = app.listen(port)
  runningPort = port

  app.use(pleasureApi({
    prefix: apiConfig.prefix,
    plugins: apiConfig.plugins
  }, server))

  // nuxt
  if (withNuxt) {
    app.use(ctx => {
      ctx.status = 200
      ctx.respond = false // Mark request as handled for Koa
      ctx.req.ctx = ctx // This might be useful later on, e.g. in nuxtServerInit or with nuxt-stash
      nuxt.render(ctx.req, ctx.res)
    })
  }

  process.send && process.send('pleasure-ready')

  watcher()

  return port
}

export async function restart () {
  if (!runningPort || !runningConnection) {
    console.error(`No app instance running`)
    return
  }

  if (runningBuilder) {
    await runningBuilder.close()
    runningBuilder = null
  }

  runningConnection.close()
  runningConnection = null
  start(runningPort)
}
