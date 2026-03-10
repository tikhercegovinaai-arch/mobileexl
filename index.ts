// Polyfill for import.meta
// @ts-ignore
if (typeof globalThis.importMeta === 'undefined') {
    // @ts-ignore
    globalThis.importMeta = {
        // @ts-ignore
        url: typeof __webpack_require__ !== 'undefined' ? __webpack_require__.p : '',
        env: {}
    };
}

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
