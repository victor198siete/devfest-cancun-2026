import { Component, computed, inject } from '@angular/core';

import { Sharing } from '@ng-native/device';
import { Pressable, SafeAreaView, ScrollView, Text, View } from '@ng-native/components';
import { NativeHeader, NativeNavigation } from '@ng-native/router';
import { Linking } from 'react-native';
import type { Urgencia } from '../core/modelos.ts';
import { ReporteState } from '../core/reporte.state.ts';

const INSIGNIA: Record<Urgencia, { fondo: string; texto: string; etiqueta: string }> = {
  baja: { fondo: 'bg-ok-bg', texto: 'text-ok-fg', etiqueta: 'Urgencia baja' },
  media: { fondo: 'bg-warn-bg', texto: 'text-warn-fg', etiqueta: 'Urgencia media' },
  alta: { fondo: 'bg-bad-bg', texto: 'text-bad-fg', etiqueta: 'Urgencia alta' },
};

@Component({
  selector: 'app-resultado-screen',
  imports: [NativeHeader, Pressable, SafeAreaView, ScrollView, Text, View],
  host: { style: 'flex: 1' },
  template: `
    <native-header title="Resultado" />
    <safe-area-view [edges]="['bottom']" class="flex-1 bg-canvas dark:bg-canvas-dk">
      <scroll-view [contentContainerStyle]="{ padding: 20, gap: 16, paddingBottom: 48 }">
        @if (resultado(); as r) {
          @if (r.esMascota) {
            <view class="gap-3 rounded-lg border border-line bg-surface p-5 dark:border-line-dk dark:bg-surface-dk">
              <text class="text-caption font-semibold text-ink2 dark:text-ink2-dk">ESPECIE</text>
              <text class="text-h1 font-black text-ink dark:text-ink-dk">{{ r.especie }}</text>
              <view class="self-start rounded-md px-3 py-1" [class]="insignia().fondo">
                <text class="text-body font-bold" [class]="insignia().texto">{{ insignia().etiqueta }}</text>
              </view>
            </view>

            <view class="gap-2 rounded-lg border border-line bg-surface p-5 dark:border-line-dk dark:bg-surface-dk">
              <text class="text-caption font-semibold text-ink2 dark:text-ink2-dk">SEÑAS</text>
              @for (sena of r.senas; track $index) {
                <text class="text-body text-ink dark:text-ink-dk">• {{ sena }}</text>
              }
            </view>

            <view class="gap-2 rounded-lg border border-line bg-surface p-5 dark:border-line-dk dark:bg-surface-dk">
              <text class="text-caption font-semibold text-ink2 dark:text-ink2-dk">AVISO</text>
              <text class="text-body text-ink dark:text-ink-dk">{{ r.aviso }}</text>
            </view>

            <pressable class="h-14 items-center justify-center rounded-lg bg-brand" accessibilityRole="button" (press)="compartir()">
              <text class="text-title font-bold text-white">Compartir</text>
            </pressable>
            <pressable class="h-14 items-center justify-center rounded-lg border border-brand" accessibilityRole="button" (press)="abrirMapa()">
              <text class="text-title font-bold text-brand dark:text-brand-dk">Abrir en Google Maps</text>
            </pressable>
          } @else {
            <view class="gap-3 rounded-lg border border-line bg-surface p-5 dark:border-line-dk dark:bg-surface-dk">
              <text class="text-h1 font-black text-ink dark:text-ink-dk">No veo una mascota en la foto</text>
              <text class="text-body font-semibold text-ink2 dark:text-ink2-dk">Confianza: {{ confianza() }}%</text>
              <text class="text-body text-ink dark:text-ink-dk">{{ r.aviso }}</text>
            </view>
          }
        }

        <pressable class="h-14 items-center justify-center rounded-lg bg-ink dark:bg-ink-dk" accessibilityRole="button" (press)="nuevo()">
          <text class="text-title font-bold text-canvas dark:text-canvas-dk">Nuevo reporte</text>
        </pressable>
      </scroll-view>
    </safe-area-view>
  `,
})
export class ResultadoScreen {
  protected readonly resultado = inject(ReporteState).resultado;
  private readonly sharing = inject(Sharing);
  private readonly navegacion = inject(NativeNavigation);

  protected readonly insignia = computed(() => INSIGNIA[this.resultado()?.urgencia ?? 'baja']);
  protected readonly confianza = computed(() => Math.round((this.resultado()?.confianza ?? 0) * 100));

  protected compartir() {
    const r = this.resultado();
    if (r) void this.sharing.share({ message: `${r.aviso}\n${r.mapaUrl}` });
  }

  protected abrirMapa() {
    const r = this.resultado();
    if (r) void Linking.openURL(r.mapaUrl);
  }

  protected nuevo() {
    this.resultado.set(null);
    this.navegacion.back();
  }
}
