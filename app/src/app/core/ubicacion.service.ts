import { Injectable, inject } from '@angular/core';
import { Location, type Address } from '@ng-native/expo/location';
import type { Ubicacion } from './modelos.ts';

/** Universidad del Caribe, Cancún. */
const UNICARIBE: Ubicacion = { latitud: 21.2011, longitud: -86.8236, aproximada: true, lugar: 'Cancún, Q. Roo' };
const ESPERA_LUGAR_MS = 4000;

/** «Ciudad, Región» con lo que dé el geocodificador; vacío si no hay nada útil. */
export function nombreDeLugar(direccion: Address | undefined): string {
  if (!direccion) return '';
  const ciudad = direccion.city ?? direccion.subregion ?? direccion.district ?? '';
  const region = direccion.region === 'Quintana Roo' ? 'Q. Roo' : (direccion.region ?? '');
  return [ciudad, region].filter(Boolean).join(', ');
}

@Injectable({ providedIn: 'root' })
export class UbicacionService {
  private readonly location = inject(Location);

  /** Pide permiso y lee la posición. Si se niega o falla, usa la Unicaribe. */
  async obtener(): Promise<Ubicacion> {
    try {
      const posicion = await this.location.current('balanced');
      if (posicion) {
        const latitud = posicion.latitude;
        const longitud = posicion.longitude;
        return { latitud, longitud, aproximada: false, lugar: await this.lugarDe(latitud, longitud) };
      }
    } catch {
      // cae al valor aproximado
    }
    return UNICARIBE;
  }

  /** Geocodificación inversa que nunca lanza ni espera más de unos segundos. */
  private async lugarDe(latitude: number, longitude: number): Promise<string> {
    try {
      const espera = new Promise<Address[]>((resolver) => setTimeout(() => resolver([]), ESPERA_LUGAR_MS));
      const [direccion] = await Promise.race([this.location.reverseGeocode({ latitude, longitude }), espera]);
      return nombreDeLugar(direccion);
    } catch {
      return '';
    }
  }
}
