import renderHelp = require('render-help')
import { handler as run } from './run'
import { handler as start } from './start'
import { handler as stop } from './stop'

export function types () {
  return {}
}

export const commandNames = ['restart']

export function help () {
  return renderHelp({
    description: `Restarts a package. Runs a package's "stop", "restart", and "start" scripts, and associated pre- and post- scripts.`,
    usages: ['pnpm restart [-- <args>...]'],
  })
}

export async function handler (
  args: string[],
  opts: {
    extraBinPaths: string[],
    dir: string,
    rawConfig: object,
  },
) {
  await stop(args, opts)
  await run(['restart', ...args], opts)
  await start(args, opts)
}
