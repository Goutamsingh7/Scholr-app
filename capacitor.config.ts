import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.scholr.attendance',
  appName: 'Scholr',
  webDir: 'out',
  // This tells Capacitor to load from your live Vercel URL
  // This means your app always has the latest version automatically
  server: {
    url: process.env.CAPACITOR_URL || 'https://your-app.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#05050e',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: '#05050e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#05050e',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
