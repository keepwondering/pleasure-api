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
      command: function foo (args) {
        console.log('go start the server!', { args })
        start()
          .then((port) => {
            console.log(`Pleasure running on ${ port }`)
            process.emit('pleasure-initialized')
          })
      }
    },
    {
      name: 'bar',
      help: 'an order you must obey!!',
      command: function bar (args) {
        console.log('go to the bar (:', { args })
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
