import { DestroyRef, effect, inject } from '@angular/core';
import { Animated, Easing } from '@ng-native/components/animations';
import { Movimiento } from './movimiento.ts';

// Todas se llaman en contexto de inyección (campo de un componente). Opacity y transform
// usan el driver nativo; con «Reducir movimiento» el valor salta directo al estado final.

/** Latido en bucle mientras `activo()` sea true; se detiene al apagarse o destruirse. */
export function crearLatido(activo: () => boolean) {
  const mov = inject(Movimiento);
  const v = new Animated.Value(0);
  let anim: Animated.CompositeAnimation | undefined;
  const parar = () => {
    anim?.stop();
    anim = undefined;
    v.setValue(0);
  };
  effect((onCleanup) => {
    if (activo() && !mov.reducido()) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
      anim.start();
    }
    onCleanup(parar);
  });
  inject(DestroyRef).onDestroy(parar);
  return {
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }],
  };
}

/** Progreso 0/1 por segmento: el relleno aparece (opacidad) al completarse. */
export function crearSegmentos(completos: () => boolean[]) {
  const mov = inject(Movimiento);
  const valores = [0, 1, 2].map(() => new Animated.Value(0));
  effect(() => {
    const estado = completos();
    const reducido = mov.reducido();
    valores.forEach((v, i) => {
      const meta = estado[i] ? 1 : 0;
      if (reducido) v.setValue(meta);
      else Animated.timing(v, { toValue: meta, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    });
  });
  return valores.map((v) => ({ opacity: v }));
}

/** Pop (escala 0.5 a 1 con rebote) cada vez que `visible()` pasa a true. */
export function crearPop(visible: () => boolean) {
  const mov = inject(Movimiento);
  const v = new Animated.Value(0);
  effect(() => {
    if (!visible()) return;
    if (mov.reducido()) return v.setValue(1);
    v.setValue(0);
    Animated.spring(v, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
  });
  return { opacity: v.interpolate({ inputRange: [0, 0.4], outputRange: [0, 1], extrapolate: 'clamp' }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] };
}

/** Fade + escala breve cada vez que cambia `clave()` (no en la primera lectura). */
export function crearTransicion(clave: () => unknown) {
  const mov = inject(Movimiento);
  const v = new Animated.Value(1);
  let primera = true;
  effect(() => {
    clave();
    if (primera) {
      primera = false;
      return;
    }
    if (mov.reducido()) return v.setValue(1);
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  });
  return { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] };
}

/** Aparición (fade + desplazamiento) y un brillo único para el icono, cada vez que cambia `clave()`. */
export function crearAparicion(clave: () => unknown) {
  const mov = inject(Movimiento);
  const v = new Animated.Value(0);
  const brillo = new Animated.Value(0);
  effect(() => {
    clave();
    if (mov.reducido()) {
      v.setValue(1);
      brillo.setValue(0);
      return;
    }
    v.setValue(0);
    brillo.setValue(0);
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(brillo, { toValue: 1, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(brillo, { toValue: 0, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start();
  });
  return {
    pildora: { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] },
    icono: { transform: [{ scale: brillo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }] },
  };
}

/**
 * Relleno de 0 al valor (0 a 100) con ancho porcentual. `width` no admite el driver nativo,
 * así que va por JS (700 ms sobre una sola view es barato); scaleX necesitaría medir el ancho.
 */
export function crearRelleno(objetivo: () => number) {
  const mov = inject(Movimiento);
  const v = new Animated.Value(0);
  effect(() => {
    const meta = objetivo();
    if (mov.reducido()) return v.setValue(meta);
    v.setValue(0);
    Animated.timing(v, { toValue: meta, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  });
  return { width: v.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' }) };
}
