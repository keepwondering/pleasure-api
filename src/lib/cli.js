import { printCommandsIndex } from 'pleasure-cli'
import { start } from './utils/server.js'

const cli = {
  root: {
    command () {
      printCommandsIndex(cli.commands)
    }
  },
  commands: [
    {
      name: 'start',
      help: 'starts the app in production',
      async command (args) {
        const port = await start()
        console.log(`Pleasure running on ${ port }`)
        process.emit('pleasure-initialized')
      }
    }
  ]
}

/**
 * @see {@link https://github.com/maxogden/subcommand}
 */
export default function (subcommand) {
  return {
    name: 'app',
    help: 'app options',
    command ({ _: args }) {
      // console.log(`calling app`, { args })
      const match = subcommand(cli)
      match(args)
    }
  }
}
