import { Component, input } from '@angular/core';
import { Text, View } from '@ng-native/components';

/** Tarjeta de sección con etiqueta opcional en mayúsculas. */
@Component({
  selector: 'app-tarjeta-seccion',
  imports: [Text, View],
  template: `
    <view class="gap-3 rounded-lg border border-line bg-surface p-4 dark:border-line-dk dark:bg-surface-dk">
      @if (etiqueta(); as e) {
        <text class="text-caption font-bold text-ink2 dark:text-ink2-dk">{{ e }}</text>
      }
      <ng-content />
    </view>
  `,
})
export class TarjetaSeccion {
  readonly etiqueta = input<string>();
}
