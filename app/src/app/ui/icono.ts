import { Component, computed, inject, input } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  lucideHeartPulse, lucideCheck, lucideChevronDown, lucideChevronUp, lucideCircleAlert, lucideImagePlus,
  lucideMap, lucideMapPin, lucideMegaphone, lucidePawPrint, lucideRefreshCw, lucideSearch, lucideSend,
  lucideSettings, lucideShare2, lucideSparkles, lucideTriangleAlert, lucideCircleHelp,
} from '@ng-icons/lucide';
import { ColorScheme } from '@ng-native/device';
import { NgIcon } from '@ng-native/icons';

export type TonoIcono = 'brand' | 'white' | 'ink' | 'ink2' | 'ok' | 'warn' | 'bad';

// [claro, oscuro]: los mismos valores del @theme de styles.css.
const COLORES: Record<TonoIcono, [string, string]> = {
  brand: ['#0f766e', '#2dd4bf'],
  white: ['#ffffff', '#ffffff'],
  ink: ['#14211b', '#eef4f1'],
  ink2: ['#55655d', '#a4b5ab'],
  ok: ['#065f46', '#6ee7b7'],
  warn: ['#92400e', '#fcd34d'],
  bad: ['#991b1b', '#fca5a5'],
};

/** Icono lucide decorativo (sin label) con tono que sigue el modo claro/oscuro. */
@Component({
  selector: 'app-icono',
  imports: [NgIcon],
  providers: [
    provideIcons({
      lucideHeartPulse, lucideCheck, lucideChevronDown, lucideChevronUp, lucideCircleAlert, lucideImagePlus,
      lucideMap, lucideMapPin, lucideMegaphone, lucidePawPrint, lucideRefreshCw, lucideSearch, lucideSend,
      lucideSettings, lucideShare2, lucideSparkles, lucideTriangleAlert, lucideCircleHelp,
    }),
  ],
  template: `<ng-icon [name]="nombre()" [size]="tamano()" [color]="color()" [strokeWidth]="trazo()" />`,
})
export class Icono {
  private readonly esquema = inject(ColorScheme).current;

  readonly nombre = input.required<string>();
  readonly tamano = input(20);
  readonly tono = input<TonoIcono>('ink');
  readonly trazo = input(2);

  protected readonly color = computed(() => COLORES[this.tono()][this.esquema() === 'dark' ? 1 : 0]);
}
