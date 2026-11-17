import { Injectable, inject } from '@angular/core';
import { ImageEditor, SaveFormat } from '@ng-native/expo/image-editor';
import { ImagePicker } from '@ng-native/expo/image-picker';
import type { Foto } from './modelos.ts';

const ANCHO_MAXIMO = 1024;
const CALIDAD = 0.7;

@Injectable({ providedIn: 'root' })
export class FotoService {
  private readonly picker = inject(ImagePicker);
  private readonly editor = inject(ImageEditor);

  /** Elige una foto de la galería y la reduce. Devuelve null si se cancela. */
  async elegirDeGaleria(): Promise<Foto | null> {
    const [elegida] = await this.picker.pick({ mediaTypes: ['images'], quality: 1 });
    if (!elegida) return null;

    const acciones = elegida.width > ANCHO_MAXIMO ? [{ resize: { width: ANCHO_MAXIMO } }] : [];
    const reducida = await this.editor.edit(elegida.uri, acciones, {
      compress: CALIDAD,
      format: SaveFormat.JPEG,
      base64: true,
    });
    if (!reducida?.base64) return null;

    return { uri: reducida.uri, base64: reducida.base64, mimeType: 'image/jpeg' };
  }
}
