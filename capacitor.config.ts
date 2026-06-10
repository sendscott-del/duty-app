import type { CapacitorConfig } from "@capacitor/cli";

// Native iOS/Android shell for Duty. The app loads the live duty.leftfieldapps.com
// site via server.url, with native plugins (splash) for real native value to pass
// Apple review guideline 4.2. Mirror of the Homefront/Steward pattern.
const config: CapacitorConfig = {
  appId: "com.leftfieldapps.duty",
  appName: "Duty",
  // Placeholder bundled assets (offline fallback). The real app is served remotely.
  webDir: "public",
  server: {
    url: "https://duty.leftfieldapps.com",
    cleartext: false,
  },
  ios: {
    backgroundColor: "#fff7e6",
  },
};

export default config;
