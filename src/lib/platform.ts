import { Capacitor } from '@capacitor/core'

// True when running inside the native iOS/Android Capacitor shell (not a browser).
// Used to hide Stripe paywall / upgrade UI in the App Store / Play builds, where
// Apple (Guideline 3.1.1) and Google require digital purchases to use their own
// in-app billing. Premium features themselves still unlock normally for families
// who subscribed on the web — we only suppress the purchase path here.
export const isNativeApp = Capacitor.isNativePlatform()
