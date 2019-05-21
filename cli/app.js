import main from 'commander'

export default {
  cmd: 'app',
  description: 'app options',
  handler (argv, cmd) {
    console.log({ argv })
    main
      .version('what?')
      .command(`start`, `Starts the app`)
      .parse(argv)
  }
}

