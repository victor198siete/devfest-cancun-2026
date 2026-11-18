import { Component, computed, input } from '@angular/core';
import { Text, View } from '@ng-native/components';

export type VarianteChip = 'neutro' | 'ok' | 'warn' | 'bad' | 'tinte' | 'blanco';

const FONDO: Record<VarianteChip, string> = {
  neutro: 'bg-line dark:bg-line-dk',
  ok: 'bg-ok-bg',
  warn: 'bg-warn-bg',
  bad: 'bg-bad-bg',
  tinte: 'bg-tint dark:bg-tint-dk',
  blanco: 'bg-white',
};
const TEXTO: Record<VarianteChip, string> = {
  neutro: 'text-ink2 dark:text-ink2-dk',
  ok: 'text-ok-fg',
  warn: 'text-warn-fg',
  bad: 'text-bad-fg',
  tinte: 'text-brand-ink dark:text-brand-ink-dk',
  blanco: 'text-ink',
};

/** Píldora con icono opcional (se proyecta) y texto; el color sale de la variante. */
@Component({
  selector: 'app-chip',
  imports: [Text, View],
  template: `
    <view class="flex-row items-center gap-1 self-start rounded-full px-3 py-1" [class]="fondo()">
      <ng-content />
      <text class="text-caption font-bold" [class]="texto()">{{ etiqueta() }}</text>
    </view>
  `,
})
export class Chip {
  readonly etiqueta = input.required<string>();
  readonly variante = input<VarianteChip>('neutro');

  protected readonly fondo = computed(() => FONDO[this.variante()]);
  protected readonly texto = computed(() => TEXTO[this.variante()]);
}
