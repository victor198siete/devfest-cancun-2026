import { Injectable, signal } from '@angular/core';
import type { Resultado } from './modelos.ts';

/** El resultado que la pantalla Reportar le pasa a la pantalla Resultado. */
@Injectable({ providedIn: 'root' })
export class ReporteState {
  readonly resultado = signal<Resultado | null>(null);
}
