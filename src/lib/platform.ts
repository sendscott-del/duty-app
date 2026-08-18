import { Capacitor } from '@capacitor/core'

// True when running inside the native iOS/Android Capacitor shell (not a browser).
// Used to hide Stripe paywall / upgrade UI in the App Store / Play builds, where
// Apple (Guideline 3.1.1) and Google require digital purchases to use their own
// in-app billing. Premium features themselves still unlock normally for families
// who subscribed on the web — we only suppress the purchase path here.
export const isNativeApp = Capacitor.isNativePlatform()

// True only in the iOS shell. Needed because Capacitor syncs plugins to BOTH
// platforms: once @revenuecat/purchases-capacitor is installed, an Android build
// would also report the Purchases plugin as available and would then configure
// RevenueCat with an Apple public key. Android billing is deliberately not built
// (Scott, 2026-08-17: "ignore android"), so the purchase path is gated on iOS.
export const isIOSApp = Capacitor.getPlatform() === 'ios'
