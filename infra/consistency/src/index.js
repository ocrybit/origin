#!/usr/bin/env node
/**
 * Sanity checker to verify all past events are in the database
 *
 * Blame: Mike Shultz
 */
const esmImport = require('esm')(module)
const contractsContext = esmImport('@origin/graphql/src/contracts').default
const { setNetwork, web3 } = esmImport('@origin/graphql/src/contracts')

const { createLogger } = require('./logger')
const { validateIdentities } = require('./validators/ident')
const { validateListings } = require('./validators/listing')
const { validateOffers } = require('./validators/offer')

async function main(config) {
  let commands = 0
  const log = createLogger({
    filename: config.logFile ? config.logFile : null,
    useColors: false
  })
  config.log = log

  log.info(`Performing consistency check on network ${config.network}`)
  if (config.identity) {
    commands += 1
    log.info('Validating Identities...')
    try {
      await validateIdentities({
        contractsContext,
        ...config
      })
    } catch (err) {
      log.error('Unable to verify identities due to an unhandled error!')
      log.error(err)
    }
  }

  if (config.listings) {
    commands += 1
    log.info('Validating Listings...')
    await validateListings({
      contractsContext,
      ...config
    })
  }

  if (config.offers) {
    commands += 1
    log.info('Validating Offers...')
    await validateOffers({
      contractsContext,
      ...config
    })
  }
  return commands
}

if (require.main === module) {
  const args = {}
  process.argv.forEach(arg => {
    const t = arg.split('=')
    const argVal = t.length > 1 ? t[1] : true
    args[t[0]] = argVal
  })

  if (args['--help'] || args['help']) {
    console.log('Usage')
    console.log('-----')
    console.log(
      'origin-check --network=[network] [--identity] [--listings] [--offers] [--ipfs-gateway=[gateway_url]] [--from-block=[block_number]]'
    )
    console.log('')
    process.exit(0)
  }

  const config = {
    // Possible values: origin, rinkeby, mainnet, ...
    network: args['--network'] || process.env.NETWORK || 'docker',
    identity: args['--identity'] || false,
    listings: args['--listings'] || false,
    offers: args['--offers'] || false,
    ipfsGateway: args['--ipfs-gateway'] || 'https://ipfs.originprotocol.com',
    fromBlock: args['--from-block'] || 0
  }

  setNetwork(config.network)
  config.web3 = web3
  main(config)
    .then(() => {
      process.exit()
    })
    .catch(err => {
      console.error('Unhandled error in main()')
      console.error(err)
    })
} else {
  module.exports = { main }
}
