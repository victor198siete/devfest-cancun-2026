import { Injectable, signal } from '@angular/core';
import type { Resultado } from './modelos.ts';

/** Lo que la pantalla Reportar le pasa a la pantalla Resultado. */
@Injectable({ providedIn: 'root' })
export class ReporteState {
  readonly resultado = signal<Resultado | null>(null);
  /** Foto enviada, para mostrarla en el resultado. */
  readonly uri = signal<string | null>(null);
  /** Segundos que tardó el análisis. */
  readonly segundos = signal(0);
}
