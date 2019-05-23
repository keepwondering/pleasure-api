import main from 'commander'

export default {
  cmd: 'app',
  description: 'app options',
  handler (argv, cmd) {
    main
      .version('what?')
      .command(`start`, `Starts the app`)
      .parse(argv)
  }
}

