#!/usr/bin/env node --harmony
const { start } = require('./lib/server.js')

start()
  .then((port) => {
    console.log(`Pleasure running on ${ port }`)
    process.emit('pleasure-initialized')
  })
