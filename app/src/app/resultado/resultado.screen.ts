import { Component, computed, inject } from '@angular/core';

import { Sharing } from '@ng-native/device';
import { Image, Pressable, SafeAreaView, ScrollView, Text, View } from '@ng-native/components';
import { NativeHeader, NativeNavigation } from '@ng-native/router';
import { Linking } from 'react-native';
import type { Urgencia } from '../core/modelos.ts';
import { ReporteState } from '../core/reporte.state.ts';
import { Chip, type VarianteChip } from '../ui/chip.ts';
import { Icono, type TonoIcono } from '../ui/icono.ts';
import { TarjetaSeccion } from '../ui/tarjeta-seccion.ts';

const INSIGNIA: Record<Urgencia, { variante: VarianteChip; tono: TonoIcono; icono: string; etiqueta: string }> = {
  baja: { variante: 'ok', tono: 'ok', icono: 'lucideCheck', etiqueta: 'Urgencia baja' },
  media: { variante: 'warn', tono: 'warn', icono: 'lucideTriangleAlert', etiqueta: 'Urgencia media' },
  alta: { variante: 'bad', tono: 'bad', icono: 'lucideTriangleAlert', etiqueta: 'Urgencia alta' },
};

@Component({
  selector: 'app-resultado-screen',
  imports: [Chip, Icono, Image, NativeHeader, Pressable, SafeAreaView, ScrollView, TarjetaSeccion, Text, View],
  host: { style: 'flex: 1' },
  template: `
    <native-header title="Resultado" />
    <safe-area-view [edges]="['bottom']" class="flex-1 bg-canvas dark:bg-canvas-dk">
      <scroll-view class="flex-1" [contentContainerStyle]="{ padding: 20, gap: 16, paddingBottom: 24 }">
        @if (resultado(); as r) {
          @if (uri(); as u) {
            <view class="overflow-hidden rounded-lg">
              <image [source]="{ uri: u }" resizeMode="cover" accessibilityLabel="Foto del reporte" style="height: 130; width: 100%; borderRadius: 16" />
              <!-- Píldora de destellos: la que luego brillará. -->
              <view class="pildora-gemini absolute left-3 top-3">
                <app-chip [etiqueta]="'Analizado por Gemini · ' + segundos() + ' s'" variante="blanco">
                  <app-icono nombre="lucideSparkles" [tamano]="12" tono="brand" />
                </app-chip>
              </view>
            </view>
          }

          @if (r.esMascota) {
            <app-tarjeta-seccion>
              <view class="flex-row items-start justify-between gap-3">
                <view class="flex-1 gap-1">
                  <text class="text-caption font-bold text-ink2 dark:text-ink2-dk">ESPECIE</text>
                  <text class="text-h1 font-black text-ink dark:text-ink-dk">{{ r.especie }}</text>
                </view>
                <app-chip [etiqueta]="insignia().etiqueta" [variante]="insignia().variante">
                  <app-icono [nombre]="insignia().icono" [tamano]="12" [tono]="insignia().tono" [trazo]="3" />
                </app-chip>
              </view>
              <view class="gap-2">
                <view class="flex-row items-center justify-between">
                  <text class="text-body text-ink2 dark:text-ink2-dk">Confianza</text>
                  <text class="text-body font-bold text-ink dark:text-ink-dk">{{ confianza() }}%</text>
                </view>
                <!-- Barra de confianza: el relleno es una view con ancho porcentual. -->
                <view class="h-2 overflow-hidden rounded-full bg-tint dark:bg-tint-dk" accessibilityRole="progressbar" [accessibilityLabel]="'Confianza ' + confianza() + ' por ciento'">
                  <view class="barra-confianza h-2 rounded-full bg-brand dark:bg-brand-dk" [style]="{ width: confianza() + '%' }"></view>
                </view>
              </view>
            </app-tarjeta-seccion>

            <app-tarjeta-seccion etiqueta="SEÑAS">
              <view class="flex-row flex-wrap gap-2">
                @for (sena of r.senas; track $index) {
                  <app-chip [etiqueta]="sena" variante="tinte" />
                }
              </view>
            </app-tarjeta-seccion>

            <view class="flex-row overflow-hidden rounded-lg border border-line bg-surface dark:border-line-dk dark:bg-surface-dk">
              <view class="w-1 bg-brand dark:bg-brand-dk"></view>
              <view class="flex-1 gap-2 p-4">
                <text class="text-caption font-bold text-ink2 dark:text-ink2-dk">AVISO</text>
                <text class="text-body text-ink dark:text-ink-dk">{{ r.aviso }}</text>
              </view>
            </view>
          } @else {
            <view class="gap-3 rounded-lg border border-line bg-surface p-5 dark:border-line-dk dark:bg-surface-dk">
              <view class="h-11 w-11 items-center justify-center rounded-full bg-line dark:bg-line-dk" [accessibilityElementsHidden]="true">
                <app-icono nombre="lucideCircleHelp" [tamano]="24" tono="ink2" />
              </view>
              <text class="text-h1 font-black text-ink dark:text-ink-dk">No veo una mascota en la foto</text>
              <text class="text-body font-semibold text-ink2 dark:text-ink2-dk">Confianza: {{ confianza() }}%</text>
              <text class="text-body text-ink dark:text-ink-dk">{{ r.aviso }}</text>
            </view>
          }
        }
      </scroll-view>

      <view class="gap-2 border-t border-line bg-canvas px-5 pb-3 pt-3 dark:border-line-dk dark:bg-canvas-dk">
        @if (resultado()?.esMascota) {
          <view class="flex-row gap-3">
            <pressable class="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-brand" accessibilityRole="button" accessibilityLabel="Compartir" (press)="compartir()">
              <app-icono nombre="lucideShare2" [tamano]="20" tono="white" />
              <text class="text-title font-bold text-white">Compartir</text>
            </pressable>
            <pressable class="h-14 w-14 items-center justify-center rounded-lg border-2 border-brand dark:border-brand-dk" accessibilityRole="button" accessibilityLabel="Abrir en Google Maps" (press)="abrirMapa()">
              <app-icono nombre="lucideMap" [tamano]="22" tono="brand" />
            </pressable>
          </view>
        }
        <pressable class="min-h-11 items-center justify-center" accessibilityRole="button" accessibilityLabel="Nuevo reporte" (press)="nuevo()">
          <text class="text-body font-bold text-brand dark:text-brand-dk">Nuevo reporte</text>
        </pressable>
      </view>
    </safe-area-view>
  `,
})
export class ResultadoScreen {
  private readonly estado = inject(ReporteState);
  protected readonly resultado = this.estado.resultado;
  protected readonly uri = this.estado.uri;
  protected readonly segundos = this.estado.segundos;
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
    this.uri.set(null);
    this.segundos.set(0);
    this.navegacion.back();
  }
}
