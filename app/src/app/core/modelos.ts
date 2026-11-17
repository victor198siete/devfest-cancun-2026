export type TipoReporte = 'perdida' | 'herida' | 'campana';
export type Urgencia = 'baja' | 'media' | 'alta';

export interface Foto {
  uri: string;
  base64: string;
  mimeType: 'image/jpeg';
}

export interface Ubicacion {
  latitud: number;
  longitud: number;
  /** true cuando no se pudo leer el GPS y se usa la Universidad del Caribe. */
  aproximada: boolean;
}

export interface NuevoReporte {
  tipo: TipoReporte;
  fotoBase64: string;
  mimeType: 'image/jpeg';
  latitud: number;
  longitud: number;
  nota?: string;
}

export interface Resultado {
  esMascota: boolean;
  confianza: number;
  especie: string;
  senas: string[];
  urgencia: Urgencia;
  aviso: string;
  mapaUrl: string;
}
