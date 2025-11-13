// lib/breez.ts
'use client'

type AnyObj = Record<string, any>
let sdk: any = null

function ensureClientEnv() {
  if (typeof window === 'undefined') {
    throw new Error('Breez SDK doit être initialisé dans le navigateur.')
  }
}

function safeGet(obj: AnyObj, path: string[]) {
  return path.reduce((acc: any, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj)
}

export async function getBreezSdk() {
  ensureClientEnv()

  if (sdk) return sdk

  // import dynamique (évite SSR)
  const breezModule: AnyObj = await import('@breeztech/breez-sdk-liquid/web')

  // DEBUG: lister les exports pour comprendre la forme du module
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('breez module exports:', Object.keys(breezModule))
    // eslint-disable-next-line no-console
    console.debug('breezModule.default keys:', breezModule.default ? Object.keys(breezModule.default) : 'no default')
  }

  const apiKey = process.env.NEXT_PUBLIC_BREEZ_API_KEY ?? ''
  const mnemonic =
    process.env.NEXT_PUBLIC_MNEMONIC_SECRET ??
    process.env.MNEMONIC_SECRET ??
    ''

  const optsCandidates = [
    { breezSdkConfig: { environment: 'testnet' }, apiKey, mnemonicSecret: mnemonic },
    { config: { environment: 'testnet' }, apiKey, mnemonicSecret: mnemonic },
    { environment: 'testnet', apiKey, mnemonicSecret: mnemonic },
    { apiKey, mnemonicSecret: mnemonic },
    {}, // minimal fallback
  ]

  // helpers pour appeler une initFn en essayant plusieurs options
  async function tryInit(fn: Function | undefined, ctx: AnyObj | null) {
    if (!fn) return null
    for (const opts of optsCandidates) {
      try {
        const ret = fn.call(ctx, opts)
        return await Promise.resolve(ret)
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.debug('Breez init attempt failed for opts', opts, err)
        }
      }
    }
    return null
  }

  // 1) Si le module expose initSync, on tente initSync(opts)
  if (typeof breezModule.initSync === 'function') {
    try {
      const res = breezModule.initSync({ environment: 'testnet' })
      // initSync peut renvoyer un objet ou le sdk directement
      sdk = res?.sdk ?? res?.client ?? res ?? null
      if (sdk) {
        // eslint-disable-next-line no-console
        console.info('Breez: initialized via initSync')
        return sdk
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('initSync failed', err)
      }
    }
  }

  // 2) Si le module expose connectWithSigner or connect (promesses)
  if (typeof breezModule.connectWithSigner === 'function') {
    const res = await tryInit(breezModule.connectWithSigner, breezModule)
    if (res) {
      sdk = res?.sdk ?? res?.client ?? res ?? null
      if (sdk) {
        // eslint-disable-next-line no-console
        console.info('Breez: initialized via connectWithSigner')
        return sdk
      }
    }
  }

  if (typeof breezModule.connect === 'function') {
    const res = await tryInit(breezModule.connect, breezModule)
    if (res) {
      sdk = res?.sdk ?? res?.client ?? res ?? null
      if (sdk) {
        // eslint-disable-next-line no-console
        console.info('Breez: initialized via connect')
        return sdk
      }
    }
  }

  // 3) Si l'export default contient une initialisation
  if (breezModule.default) {
    const def = breezModule.default
    // si default est une fonction, essayez de l'appeler
    if (typeof def === 'function') {
      const res = await tryInit(def, null)
      if (res) {
        sdk = res?.sdk ?? res?.client ?? res ?? null
        if (sdk) {
          // eslint-disable-next-line no-console
          console.info('Breez: initialized via default export function')
          return sdk
        }
      }
    }

    // si default expose init/initServices/createServices/initSync
    const defInitCandidates = ['initServices', 'init', 'createServices', 'initSync', 'connectWithSigner', 'connect']
    for (const name of defInitCandidates) {
      const fn = def[name]
      if (typeof fn === 'function') {
        const res = await tryInit(fn, def)
        if (res) {
          sdk = res?.sdk ?? res?.client ?? res ?? null
          if (sdk) {
            // eslint-disable-next-line no-console
            console.info(`Breez: initialized via default.${name}`)
            return sdk
          }
        }
      }
    }
  }

  // 4) fallback : peut-être que le module exporte directement un "BindingLiquidSdk" ou un client factory
  if (breezModule.BindingLiquidSdk) {
    // si c'est une classe/constructeur
    try {
      const Constructor = breezModule.BindingLiquidSdk
      const instance = new Constructor()
      sdk = instance
      // eslint-disable-next-line no-console
      console.info('Breez: initialized via BindingLiquidSdk constructor')
      return sdk
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('BindingLiquidSdk ctor failed', err)
      }
    }
  }

  // 5) si aucune initialisation n'a réussi, lister les exports et renvoyer une erreur claire
  const exported = Object.keys(breezModule).join(', ')
  throw new Error(`Impossible de trouver une fonction d'initialisation utilisable dans le module Breez. Exports trouvés: ${exported}`)
}

export function isBreezInitialized() {
  return sdk !== null
}

export function getInitializedBreezSdk() {
  if (!sdk) {
    throw new Error("Breez SDK n'est pas encore initialisé.")
  }
  return sdk
}
