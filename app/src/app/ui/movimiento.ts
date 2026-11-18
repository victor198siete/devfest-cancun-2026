import { DestroyRef, Injectable, InjectionToken, inject, signal } from '@angular/core';

/** Lo mínimo que se usa de AccessibilityInfo; se inyecta para poder probar sin react-native. */
export interface LectorMovimiento {
  isReduceMotionEnabled(): Promise<boolean>;
  addEventListener(evento: 'reduceMotionChanged', cb: (activo: boolean) => void): { remove(): void };
}

export const LECTOR_MOVIMIENTO = new InjectionToken<() => Promise<LectorMovimiento>>('LECTOR_MOVIMIENTO', {
  providedIn: 'root',
  // Sin lector, nada se reduce. main.ts provee el real (AccessibilityInfo): aquí no se importa
  // react-native porque no carga bajo Node (tests) y un import diferido rompe en Expo Go.
  factory: () => async () => ({ isReduceMotionEnabled: async () => false, addEventListener: () => ({ remove() {} }) }),
});

/** Preferencia «Reducir movimiento» del teléfono: si es true, nada se anima. */
@Injectable({ providedIn: 'root' })
export class Movimiento {
  readonly reducido = signal(false);

  constructor() {
    let suscripcion: { remove(): void } | undefined;
    let destruido = false;
    inject(DestroyRef).onDestroy(() => {
      destruido = true;
      suscripcion?.remove();
    });
    void inject(LECTOR_MOVIMIENTO)().then(async (lector) => {
      const activo = await lector.isReduceMotionEnabled();
      if (destruido) return;
      this.reducido.set(activo);
      suscripcion = lector.addEventListener('reduceMotionChanged', (v) => this.reducido.set(v));
    });
  }
}
