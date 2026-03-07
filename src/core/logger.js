const red    = '\x1b[31m'
const yellow = '\x1b[33m'
const green  = '\x1b[32m'
const grey   = '\x1b[90m'
const reset  = '\x1b[0m'

const isDev = process.env.NODE_ENV !== 'production'

function timestamp() {
  return new Date().toISOString()
}

export const logger = {
  info(message, meta) {
    console.log(`${green}[pulse][info]${reset} ${timestamp()} ${message}`, meta ?? '')
  },
  warn(message, meta) {
    console.warn(`${yellow}[pulse][warn]${reset} ${timestamp()} ${message}`, meta ?? '')
  },
  error(message, err) {
    console.error(`${red}[pulse][error]${reset} ${timestamp()} ${message}`)
    if (err?.stack && isDev) console.error(`${red}[pulse][cause]${reset}`, err.stack)
    if (err?.cause) console.error(`${red}[pulse][details]${reset}`, err.cause)
  },
  debug(message, meta) {
    if (isDev) {
      console.log(`${grey}[pulse][debug]${reset} ${timestamp()} ${message}`, meta ? JSON.stringify(meta, null, 2) : '')
    }
  },
}
