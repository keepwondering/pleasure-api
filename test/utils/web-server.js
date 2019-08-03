const emulate = require('pleasure-core-dev-tools/test/emulate-server.js')
const path = require('path')

emulate(path.join(__dirname, '../fixtures/pleasure-dummy-project'))
