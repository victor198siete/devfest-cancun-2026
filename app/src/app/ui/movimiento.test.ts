import { Injector } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { LECTOR_MOVIMIENTO, Movimiento, type LectorMovimiento } from './movimiento.ts';

function crear(activo: boolean) {
  let cambiar: (v: boolean) => void = () => undefined;
  const lector: LectorMovimiento = {
    isReduceMotionEnabled: async () => activo,
    addEventListener: (_e, cb) => {
      cambiar = cb;
      return { remove: () => undefined };
    },
  };
  const injector = Injector.create({
    providers: [Movimiento, { provide: LECTOR_MOVIMIENTO, useValue: async () => lector }],
  });
  return { mov: injector.get(Movimiento), cambiar: (v: boolean) => cambiar(v) };
}

const esperar = () => new Promise((r) => setTimeout(r, 0));

describe('Movimiento', () => {
  it('queda en reducido cuando el teléfono lo pide y sigue sus cambios', async () => {
    const { mov, cambiar } = crear(true);
    expect(mov.reducido()).toBe(false);
    await esperar();
    expect(mov.reducido()).toBe(true);
    cambiar(false);
    expect(mov.reducido()).toBe(false);
  });
});
