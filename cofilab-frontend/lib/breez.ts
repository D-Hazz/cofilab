// lib/breez.ts
'use client'

let sdk: any = null
let currentMnemonic: string | null = null

function ensureClientEnv() {
  if (typeof window === 'undefined') {
    throw new Error('Breez SDK doit être initialisé dans le navigateur.')
  }
}

export async function connectBreezWithMnemonic(mnemonic: string) {
  ensureClientEnv()

  if (sdk?.getInfo && currentMnemonic === mnemonic) return sdk

  const breezModule = await import('@breeztech/breez-sdk-liquid/web')

  const apiKey = process.env.NEXT_PUBLIC_BREEZ_API_KEY!
  const network = 'mainnet' // ou 'testnet'

  if (typeof breezModule.default === 'function') {
    await breezModule.default()
  } else if (typeof breezModule.initSync === 'function') {
    breezModule.initSync()
  }

  const config = breezModule.defaultConfig(network, apiKey)

  sdk = await breezModule.connect({
    config,
    mnemonic,
  })

  currentMnemonic = mnemonic

  console.info('✅ Breez SDK connecté avec mnemonic utilisateur')

  return sdk
}

export async function getBreezSdk() {
  ensureClientEnv()

  if (!sdk?.getInfo) {
    throw new Error('Breez SDK non connecté. Appelez connectBreezWithMnemonic() d’abord.')
  }

  return sdk
}

export function isBreezInitialized() {
  return sdk !== null && sdk.getInfo !== undefined
}
