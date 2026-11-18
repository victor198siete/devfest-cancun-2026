// Define $localize antes de evaluar cualquier componente.
import '@angular/localize/init';
// Runtime de Expo: su fetch y URL. Debe cargarse antes que Angular.
import 'expo';
import { AccessibilityInfo, AppRegistry, Image, Platform, processColor } from 'react-native';
import { withComponentInputBinding } from '@angular/router';
import { currentConditions, deviceTokens, watchConditions } from '@ng-native/device';
import { getFabricUIManager, registerPlatformComponents } from '@ng-native/fabric';
import { mount } from '@ng-native/platform';
import { provideNativeRouter, withHeaderDefaults } from '@ng-native/router';
import tailwind from '../.angular-native/app.tailwind.js';
import { routes } from './app/app.routes.ts';
import { LECTOR_MOVIMIENTO, type LectorMovimiento } from './app/ui/movimiento.ts';
import { App } from './app/app.ts';

registerPlatformComponents(Platform.OS);

AppRegistry.registerRunnable('main', ({ rootTag }) => {
  const app = mount(Number(rootTag), App, getFabricUIManager(), {
    processColor,
    // Clases de Tailwind, compiladas por withTailwind en metro.config.js.
    globalStyles: tailwind,
    providers: [
      { provide: LECTOR_MOVIMIENTO, useValue: async () => AccessibilityInfo as unknown as LectorMovimiento },
      provideNativeRouter(
        routes,
        withComponentInputBinding(),
        withHeaderDefaults((scheme) => ({
          backgroundColor: scheme === 'dark' ? '#0c1210' : '#f3f6f4',
          titleColor: scheme === 'dark' ? '#eef4f1' : '#14211b',
          largeTitleColor: scheme === 'dark' ? '#eef4f1' : '#14211b',
          color: '#0f766e',
          userInterfaceStyle: scheme,
          hideShadow: true,
        })),
      ),
    ],
    conditions: currentConditions(),
    tokens: deviceTokens(),
    resolveAssetSource: (value) => Image.resolveAssetSource(value as never),
  });

  // Vuelve a resolver las condiciones al rotar o cambiar de tema.
  watchConditions(app.engine);
});
