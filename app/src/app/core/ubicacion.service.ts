import { Injectable, inject } from '@angular/core';
import { Location } from '@ng-native/expo/location';
import type { Ubicacion } from './modelos.ts';

/** Universidad del Caribe, Cancún. */
const UNICARIBE: Ubicacion = { latitud: 21.2011, longitud: -86.8236, aproximada: true };

@Injectable({ providedIn: 'root' })
export class UbicacionService {
  private readonly location = inject(Location);

  /** Pide permiso y lee la posición. Si se niega o falla, usa la Unicaribe. */
  async obtener(): Promise<Ubicacion> {
    try {
      const posicion = await this.location.current('balanced');
      if (posicion) return { latitud: posicion.latitude, longitud: posicion.longitude, aproximada: false };
    } catch {
      // cae al valor aproximado
    }
    return UNICARIBE;
  }
}
