import { DestroyRef, Injectable, InjectionToken, inject, signal } from '@angular/core';

/** Lo mínimo que se usa de AccessibilityInfo; se inyecta para poder probar sin react-native. */
export interface LectorMovimiento {
  isReduceMotionEnabled(): Promise<boolean>;
  addEventListener(evento: 'reduceMotionChanged', cb: (activo: boolean) => void): { remove(): void };
}

export const LECTOR_MOVIMIENTO = new InjectionToken<() => Promise<LectorMovimiento>>('LECTOR_MOVIMIENTO', {
  providedIn: 'root',
  // Import diferido: react-native no se puede cargar bajo Node (tests).
  factory: () => async () => (await import('react-native')).AccessibilityInfo as unknown as LectorMovimiento,
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
