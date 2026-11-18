import { Injector } from '@angular/core';
import { Location } from '@ng-native/expo/location';
import { describe, expect, it, vi } from 'vitest';
import { UbicacionService } from './ubicacion.service.ts';

const posicion = { latitude: 21.16, longitude: -86.85 };

function crear(location: Partial<Record<keyof Location, unknown>>) {
  const injector = Injector.create({
    providers: [UbicacionService, { provide: Location, useValue: location }],
  });
  return injector.get(UbicacionService);
}

describe('UbicacionService.obtener', () => {
  it('agrega el nombre del lugar cuando el geocodificador responde', async () => {
    const servicio = crear({
      current: vi.fn(async () => posicion),
      reverseGeocode: vi.fn(async () => [{ city: 'Cancún', region: 'Quintana Roo' }]),
    });
    expect(await servicio.obtener()).toEqual({ latitud: 21.16, longitud: -86.85, aproximada: false, lugar: 'Cancún, Q. Roo' });
  });

  it('si el geocodificador falla, no lanza y devuelve las coordenadas sin lugar', async () => {
    const servicio = crear({
      current: vi.fn(async () => posicion),
      reverseGeocode: vi.fn(async () => {
        throw new Error('sin red');
      }),
    });
    const u = await servicio.obtener();
    expect(u).toMatchObject({ latitud: 21.16, longitud: -86.85, aproximada: false });
    expect(u.lugar).toBe('');
  });

  it('sin GPS usa la Unicaribe aproximada', async () => {
    const servicio = crear({ current: vi.fn(async () => null) });
    expect(await servicio.obtener()).toMatchObject({ aproximada: true, lugar: 'Cancún, Q. Roo' });
  });
});
