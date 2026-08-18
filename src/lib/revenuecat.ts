// RevenueCat / Apple in-app purchase, native only.
//
// READ THIS BEFORE CHANGING ANYTHING HERE.
//
// The Capacitor shells do not bundle the app — they load the deployed
// duty.leftfieldapps.com site via `server.url`. So this file reaches the CURRENT
// App Store build the moment Vercel deploys, and that build does NOT contain the
// RevenueCat native plugin (it ships in the next binary). Every export here must
// therefore fail soft and never throw: on an old binary `isPurchasingAvailable()`
// returns false and the Upgrade screen falls back to the pre-IAP message. A throw
// here would break the paywall for people already on the App Store.
//
// Web is unaffected — it keeps using Stripe Checkout. See Upgrade.tsx.

import { isNativeApp } from './platform'

// Public SDK key for the Duty (App Store) app in RevenueCat project proj3cf3350c.
// Public keys are designed to ship in the client; the secret key never leaves
// ~/.config/gatheredin/revenuecat-duty.env.
const RC_IOS_PUBLIC_KEY = 'appl_SvZiwbhFDoomDEvdFHDdTMSciig'

// The entitlement configured in RevenueCat. Granting this is what makes a family premium.
export const PREMIUM_ENTITLEMENT = 'premium'

export interface PremiumPackage {
  id: string
  /** '$rc_monthly' | '$rc_annual' */
  lookupKey: string
  /** Localized, store-formatted price, e.g. "$2.99". Never hand-format this. */
  priceString: string
  period: 'monthly' | 'annual'
  raw: unknown
}

type PurchasesModule = typeof import('@revenuecat/purchases-capacitor')

let modulePromise: Promise<PurchasesModule | null> | null = null
let configuredFor: string | null = null

/** Loads the plugin, or null when it isn't there (web, or a pre-IAP native build). */
async function loadPurchases(): Promise<PurchasesModule | null> {
  if (!isNativeApp) return null
  if (!modulePromise) {
    modulePromise = (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core')
        // The decisive check: an App Store build made before the plugin was added
        // reports false here, and we degrade instead of crashing.
        if (!Capacitor.isPluginAvailable('Purchases')) return null
        return await import('@revenuecat/purchases-capacitor')
      } catch {
        return null
      }
    })()
  }
  return modulePromise
}

/**
 * Configure RevenueCat for a family. The RevenueCat customer IS the family, not the
 * parent: premium is a family-level fact in `duty_families`, and using family_id as
 * the app user id means either parent's purchase covers the family and restores
 * correctly on a second parent's device.
 */
export async function initPurchases(familyId: string): Promise<boolean> {
  const mod = await loadPurchases()
  if (!mod) return false
  if (configuredFor === familyId) return true
  try {
    await mod.Purchases.configure({ apiKey: RC_IOS_PUBLIC_KEY, appUserID: familyId })
    configuredFor = familyId
    return true
  } catch {
    return false
  }
}

/** True only when a real purchase can actually be made on this device+build. */
export async function isPurchasingAvailable(): Promise<boolean> {
  return (await loadPurchases()) !== null
}

/** The current offering's packages, or [] if unavailable for any reason. */
export async function getPremiumPackages(): Promise<PremiumPackage[]> {
  const mod = await loadPurchases()
  if (!mod) return []
  try {
    const { current } = await mod.Purchases.getOfferings()
    if (!current) return []
    return current.availablePackages.map((p) => ({
      id: p.identifier,
      lookupKey: p.identifier,
      priceString: p.product.priceString,
      period: p.identifier.includes('annual') || p.packageType === 'ANNUAL' ? 'annual' : 'monthly',
      raw: p,
    }))
  } catch {
    return []
  }
}

export type PurchaseOutcome =
  | { status: 'success' }
  | { status: 'cancelled' }
  | { status: 'error'; message: string }

/**
 * Runs the Apple purchase sheet. On success the entitlement is live in RevenueCat
 * immediately, but `duty_families.premium_status` is written by the RevenueCat
 * webhook (server truth — the client is never trusted with premium columns, see
 * the duty_families_guard_premium trigger). Callers should refetch the family
 * rather than assuming the row is already updated.
 */
export async function purchasePremium(pkg: PremiumPackage): Promise<PurchaseOutcome> {
  const mod = await loadPurchases()
  if (!mod) return { status: 'error', message: 'Purchases are not available in this version of the app.' }
  try {
    const res = await mod.Purchases.purchasePackage({ aPackage: pkg.raw as never })
    const active = res.customerInfo?.entitlements?.active ?? {}
    return PREMIUM_ENTITLEMENT in active
      ? { status: 'success' }
      : { status: 'error', message: 'Purchase completed but Premium did not activate. Try Restore Purchases.' }
  } catch (e) {
    const err = e as { code?: string; message?: string; userCancelled?: boolean }
    if (err?.userCancelled || err?.code === 'PURCHASE_CANCELLED') return { status: 'cancelled' }
    return { status: 'error', message: err?.message || 'Something went wrong with the purchase.' }
  }
}

/** Apple requires a restore path for non-consumable/subscription purchases. */
export async function restorePremium(): Promise<PurchaseOutcome> {
  const mod = await loadPurchases()
  if (!mod) return { status: 'error', message: 'Purchases are not available in this version of the app.' }
  try {
    const res = await mod.Purchases.restorePurchases()
    const active = res.customerInfo?.entitlements?.active ?? {}
    return PREMIUM_ENTITLEMENT in active
      ? { status: 'success' }
      : { status: 'error', message: 'No previous purchase found for this Apple ID.' }
  } catch (e) {
    return { status: 'error', message: (e as { message?: string })?.message || 'Could not restore purchases.' }
  }
}
