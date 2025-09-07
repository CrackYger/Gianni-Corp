import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.giannicorp.admin',
  appName: 'Giannicorp Admin',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    allowNavigation: ['*']
  }
};

export default config;