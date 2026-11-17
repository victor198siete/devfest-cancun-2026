import { ngNative } from '@ng-native/testing/vitest';
import { defineConfig } from 'vitest/config';

// Compila Angular como lo hace Metro; los tests corren en Node, sin simulador.
export default defineConfig({
  plugins: [ngNative()],
  test: { setupFiles: ['@angular/localize/init'] },
});
