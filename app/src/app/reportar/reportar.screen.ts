import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ActivityIndicator, Image, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from '@ng-native/components';
import { NativeHeader } from '@ng-native/router';
import { FotoService } from '../core/foto.service.ts';
import type { Foto, TipoReporte, Ubicacion } from '../core/modelos.ts';
import { ReporteState } from '../core/reporte.state.ts';
import { ApiUrl, ReporteError, ReportesApi } from '../core/reportes-api.ts';
import { UbicacionService } from '../core/ubicacion.service.ts';

const TIPOS: { valor: TipoReporte; etiqueta: string }[] = [
  { valor: 'perdida', etiqueta: 'Perdida' },
  { valor: 'herida', etiqueta: 'Herida' },
  { valor: 'campana', etiqueta: 'Campaña' },
];
const AVISO_LENTO_MS = 10_000;

@Component({
  selector: 'app-reportar-screen',
  imports: [ActivityIndicator, Image, NativeHeader, Pressable, SafeAreaView, ScrollView, Text, TextInput, View],
  host: { style: 'flex: 1' },
  template: `
    <native-header title="Reportar mascota" />
    <safe-area-view [edges]="['bottom']" class="flex-1 bg-canvas dark:bg-canvas-dk">
      <scroll-view keyboardShouldPersistTaps="handled" [contentContainerStyle]="{ padding: 20, gap: 16, paddingBottom: 48 }">
        @if (cargando()) {
          <view class="items-center gap-4 rounded-lg border border-line bg-surface p-8 dark:border-line-dk dark:bg-surface-dk">
            <activity-indicator size="large" />
            <text class="text-center text-title font-bold text-ink dark:text-ink-dk">Gemini está analizando la foto…</text>
            @if (lento()) {
              <text class="text-center text-body text-ink2 dark:text-ink2-dk">Esto puede tardar hasta 30 segundos</text>
            }
          </view>
        } @else {
          <view class="gap-1">
            <text accessibilityRole="header" class="text-h1 font-black text-ink dark:text-ink-dk">Reporta una mascota</text>
            <text class="text-body text-ink2 dark:text-ink2-dk">Una foto, tu ubicación y Gemini hace el resto.</text>
          </view>

          @if (error(); as e) {
            <view class="gap-3 rounded-lg bg-bad-bg p-4">
              <text accessibilityRole="alert" class="text-body font-semibold text-bad-fg">{{ e.message }}</text>
              <pressable class="h-12 items-center justify-center rounded-md bg-bad-fg" accessibilityRole="button" (press)="enviar()">
                <text class="text-body font-bold text-white">Reintentar</text>
              </pressable>
              @if (e.tipo === 'red' && !api.esRespaldo()) {
                <pressable class="h-12 items-center justify-center rounded-md border border-bad-fg" accessibilityRole="button" (press)="usarRespaldo()">
                  <text class="text-body font-bold text-bad-fg">Usar la API de respaldo</text>
                </pressable>
              }
            </view>
          }

          <view class="gap-3 rounded-lg border border-line bg-surface p-4 dark:border-line-dk dark:bg-surface-dk">
            <text class="text-caption font-semibold text-ink2 dark:text-ink2-dk">1. TIPO DE REPORTE</text>
            <view class="flex-row gap-2">
              @for (tipo of tipos; track tipo.valor) {
                <pressable
                  class="h-11 flex-1 items-center justify-center rounded-md border"
                  [class]="tipoElegido() === tipo.valor ? 'border-brand bg-brand' : 'border-line dark:border-line-dk'"
                  accessibilityRole="button"
                  (press)="tipoElegido.set(tipo.valor)"
                >
                  <text class="text-body font-bold" [class]="tipoElegido() === tipo.valor ? 'text-white' : 'text-ink dark:text-ink-dk'">{{ tipo.etiqueta }}</text>
                </pressable>
              }
            </view>
          </view>

          <view class="gap-3 rounded-lg border border-line bg-surface p-4 dark:border-line-dk dark:bg-surface-dk">
            <text class="text-caption font-semibold text-ink2 dark:text-ink2-dk">2. FOTO</text>
            @if (foto(); as f) {
              <image [source]="{ uri: f.uri }" resizeMode="contain" accessibilityLabel="Vista previa de la foto" style="height: 240; width: 100%" />
            }
            <pressable class="h-12 items-center justify-center rounded-md border border-brand" accessibilityRole="button" (press)="elegirFoto()">
              <text class="text-body font-bold text-brand dark:text-brand-dk">{{ foto() ? 'Cambiar foto' : 'Elegir de la galería' }}</text>
            </pressable>
          </view>

          <view class="gap-1 rounded-lg border border-line bg-surface p-4 dark:border-line-dk dark:bg-surface-dk">
            <text class="text-caption font-semibold text-ink2 dark:text-ink2-dk">3. UBICACIÓN</text>
            @if (ubicacion(); as u) {
              <text class="text-body text-ink dark:text-ink-dk">{{ u.latitud.toFixed(4) }}, {{ u.longitud.toFixed(4) }}</text>
              @if (u.aproximada) {
                <text class="text-caption font-semibold text-warn-fg">Ubicación aproximada</text>
              }
            } @else {
              <text class="text-body text-ink2 dark:text-ink2-dk">Buscando tu ubicación…</text>
            }
          </view>

          <view class="gap-2 rounded-lg border border-line bg-surface p-4 dark:border-line-dk dark:bg-surface-dk">
            <text class="text-caption font-semibold text-ink2 dark:text-ink2-dk">4. NOTA (OPCIONAL)</text>
            <text-input class="field" [(value)]="nota" multiline [numberOfLines]="3" [maxLength]="500" placeholder="Collar azul, cojea de una pata…" accessibilityLabel="Nota" />
            <text class="text-right text-caption text-ink2 dark:text-ink2-dk">{{ nota().length }}/500</text>
          </view>

          <view class="gap-2 rounded-lg border border-line bg-surface p-4 dark:border-line-dk dark:bg-surface-dk">
            <text class="text-caption font-semibold text-ink2 dark:text-ink2-dk">MI API</text>
            <text-input class="field" [(value)]="api.url" keyboardType="url" autoCapitalize="none" [autoCorrect]="false" accessibilityLabel="URL de mi API" />
            <pressable class="h-10 items-center justify-center" accessibilityRole="button" (press)="usarRespaldo()">
              <text class="text-body font-semibold text-brand dark:text-brand-dk">Restablecer al respaldo</text>
            </pressable>
          </view>

          <pressable
            class="h-16 items-center justify-center rounded-lg"
            [class]="puedeEnviar() ? 'bg-brand' : 'bg-line dark:bg-line-dk'"
            accessibilityRole="button"
            [disabled]="!puedeEnviar()"
            [accessibilityState]="{ disabled: !puedeEnviar() }"
            (press)="enviar()"
          >
            <text class="text-title font-bold" [class]="puedeEnviar() ? 'text-white' : 'text-ink2 dark:text-ink2-dk'">Reportar</text>
          </pressable>
        }
      </scroll-view>
    </safe-area-view>
  `,
  styles: `
    .field {
      border-width: 1px;
      border-color: #dbe3de;
      border-radius: 14px;
      padding: 12px;
      font-size: 16px;
      background-color: #ffffff;
      color: #14211b;
    }
    @media (prefers-color-scheme: dark) {
      .field {
        border-color: #26332c;
        background-color: #0c1210;
        color: #eef4f1;
      }
    }
  `,
})
export class ReportarScreen {
  protected readonly api = inject(ApiUrl);
  private readonly reportes = inject(ReportesApi);
  private readonly fotos = inject(FotoService);
  private readonly ubicaciones = inject(UbicacionService);
  private readonly estado = inject(ReporteState);
  private readonly router = inject(Router);

  protected readonly tipos = TIPOS;
  protected readonly tipoElegido = signal<TipoReporte>('perdida');
  protected readonly foto = signal<Foto | null>(null);
  protected readonly ubicacion = signal<Ubicacion | null>(null);
  protected readonly nota = signal('');

  protected readonly cargando = signal(false);
  protected readonly lento = signal(false);
  protected readonly error = signal<ReporteError | null>(null);
  protected readonly puedeEnviar = computed(() => this.foto() !== null && this.ubicacion() !== null);

  private temporizador: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.temporizador));
    void this.ubicaciones.obtener().then((u) => this.ubicacion.set(u));
  }

  protected async elegirFoto() {
    const elegida = await this.fotos.elegirDeGaleria();
    if (elegida) this.foto.set(elegida);
  }

  protected usarRespaldo() {
    this.api.restablecer();
  }

  protected async enviar() {
    const foto = this.foto();
    const ubicacion = this.ubicacion();
    if (!foto || !ubicacion) return;

    this.error.set(null);
    this.lento.set(false);
    this.cargando.set(true);
    this.temporizador = setTimeout(() => this.lento.set(true), AVISO_LENTO_MS);

    try {
      const resultado = await this.reportes.enviar({
        tipo: this.tipoElegido(),
        fotoBase64: foto.base64,
        mimeType: foto.mimeType,
        latitud: ubicacion.latitud,
        longitud: ubicacion.longitud,
        ...(this.nota().trim() && { nota: this.nota().trim() }),
      });
      this.estado.resultado.set(resultado);
      await this.router.navigateByUrl('/resultado');
    } catch (e) {
      this.error.set(e instanceof ReporteError ? e : new ReporteError('red', 'Algo salió mal. Intenta de nuevo.'));
    } finally {
      clearTimeout(this.temporizador);
      this.cargando.set(false);
    }
  }
}
