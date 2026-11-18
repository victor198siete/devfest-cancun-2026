import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Image, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import { NativeHeader } from '@ng-native/router';
import { FotoService } from '../core/foto.service.ts';
import type { Foto, TipoReporte, Ubicacion } from '../core/modelos.ts';
import { ReporteState } from '../core/reporte.state.ts';
import { ApiUrl, ReporteError, ReportesApi } from '../core/reportes-api.ts';
import { UbicacionService } from '../core/ubicacion.service.ts';
import { crearLatido, crearPop, crearSegmentos, crearTransicion } from '../ui/animar.ts';
import { Chip } from '../ui/chip.ts';
import { Icono } from '../ui/icono.ts';
import { TarjetaSeccion } from '../ui/tarjeta-seccion.ts';

const TIPOS: { valor: TipoReporte; etiqueta: string; icono: string }[] = [
  { valor: 'perdida', etiqueta: 'Perdida', icono: 'lucideSearch' },
  { valor: 'herida', etiqueta: 'Herida', icono: 'lucideHeartPulse' },
  { valor: 'campana', etiqueta: 'Campaña', icono: 'lucideMegaphone' },
];
const AVISO_LENTO_MS = 10_000;
const TOTAL_PASOS = 3;

@Component({
  selector: 'app-reportar-screen',
  imports: [AnimatedStyle, Chip, Icono, Image, NativeHeader, Pressable, SafeAreaView, ScrollView, TarjetaSeccion, Text, TextInput, View],
  host: { style: 'flex: 1' },
  template: `
    <native-header title="Reportar mascota" />
    <safe-area-view [edges]="['bottom']" class="flex-1 bg-canvas dark:bg-canvas-dk">
      <scroll-view class="flex-1" keyboardShouldPersistTaps="handled" [contentContainerStyle]="{ padding: 20, gap: 16, paddingBottom: 24 }">
        @if (cargando()) {
          <view class="items-center gap-4 rounded-lg border border-line bg-surface p-8 dark:border-line-dk dark:bg-surface-dk">
            @if (foto(); as f) {
              <image [source]="{ uri: f.uri }" resizeMode="cover" accessibilityLabel="Foto que se está analizando" style="height: 120; width: 120; borderRadius: 16" />
            }
            <!-- Huella de espera: late mientras carga. -->
            <view class="huella-espera" [animatedStyle]="latido" [accessibilityElementsHidden]="true">
              <app-icono nombre="lucidePawPrint" [tamano]="48" tono="brand" />
            </view>
            <text class="text-center text-title font-bold text-ink dark:text-ink-dk">Gemini está analizando la foto…</text>
            <text accessibilityLiveRegion="polite" class="text-body font-semibold text-brand dark:text-brand-dk">{{ segundos() }} s</text>
            @if (lento()) {
              <text class="text-center text-body text-ink2 dark:text-ink2-dk">Esto puede tardar hasta 30 segundos</text>
            }
          </view>
        } @else {
          <view class="flex-row items-center gap-3">
            <view class="h-12 w-12 items-center justify-center rounded-md bg-brand" [accessibilityElementsHidden]="true">
              <app-icono nombre="lucidePawPrint" [tamano]="26" tono="white" />
            </view>
            <view class="flex-1">
              <text accessibilityRole="header" class="text-title font-black text-ink dark:text-ink-dk">Reporta una mascota</text>
              <text class="text-body text-ink2 dark:text-ink2-dk">Una foto y Gemini hace el resto</text>
            </view>
          </view>

          <view class="flex-row items-center justify-between">
            <!-- Chip de conexión: envuelto para animarlo sin tocar el chip. -->
            <view class="chip-conexion" [animatedStyle]="transicionChip">
              @if (api.esRespaldo()) {
                <app-chip etiqueta="Usando el respaldo" variante="neutro" />
              } @else {
                <app-chip etiqueta="Conectado a tu API" variante="ok">
                  <app-icono nombre="lucideCheck" [tamano]="12" tono="ok" [trazo]="3" />
                </app-chip>
              }
            </view>
            <text class="text-caption font-semibold text-ink2 dark:text-ink2-dk">{{ listos() }} de 3 listos</text>
          </view>

          <view class="flex-row gap-2" accessibilityRole="progressbar" [accessibilityLabel]="listos() + ' de 3 pasos listos'">
            @for (paso of pasos(); track $index) {
              <!-- Segmento de progreso: uno por paso. -->
              <view class="segmento h-1.5 flex-1 overflow-hidden rounded-full bg-line dark:bg-line-dk">
                <view class="h-1.5 rounded-full bg-brand dark:bg-brand-dk" [animatedStyle]="segmentos[$index]"></view>
              </view>
            }
          </view>

          @if (error(); as e) {
            <view class="gap-3 rounded-lg bg-bad-bg p-4">
              <view class="flex-row items-start gap-2">
                <view class="pt-0.5" [accessibilityElementsHidden]="true">
                  <app-icono nombre="lucideCircleAlert" [tamano]="20" tono="bad" />
                </view>
                <text accessibilityRole="alert" class="flex-1 text-body font-semibold text-bad-fg">{{ e.message }}</text>
              </view>
              <pressable class="h-12 items-center justify-center rounded-md bg-bad-fg" accessibilityRole="button" accessibilityLabel="Reintentar" (press)="enviar()">
                <text class="text-body font-bold text-white">Reintentar</text>
              </pressable>
              @if (e.tipo === 'red' && !api.esRespaldo()) {
                <pressable class="h-12 items-center justify-center rounded-md border border-bad-fg" accessibilityRole="button" accessibilityLabel="Usar la API de respaldo" (press)="usarRespaldo()">
                  <text class="text-body font-bold text-bad-fg">Usar la API de respaldo</text>
                </pressable>
              }
            </view>
          }

          <app-tarjeta-seccion etiqueta="TIPO DE REPORTE">
            <view class="flex-row gap-2">
              @for (tipo of tipos; track tipo.valor) {
                <pressable
                  class="min-h-20 flex-1 items-center justify-center gap-2 rounded-md border py-3"
                  [class]="tipoElegido() === tipo.valor ? 'border-brand bg-brand' : 'border-line dark:border-line-dk'"
                  accessibilityRole="button"
                  [accessibilityLabel]="tipo.etiqueta"
                  [accessibilityState]="{ selected: tipoElegido() === tipo.valor }"
                  (press)="tipoElegido.set(tipo.valor)"
                >
                  <app-icono [nombre]="tipo.icono" [tamano]="24" [tono]="tipoElegido() === tipo.valor ? 'white' : 'brand'" />
                  <text class="text-body font-bold" [class]="tipoElegido() === tipo.valor ? 'text-white' : 'text-ink dark:text-ink-dk'">{{ tipo.etiqueta }}</text>
                </pressable>
              }
            </view>
          </app-tarjeta-seccion>

          @if (foto(); as f) {
            <view class="overflow-hidden rounded-lg">
              <image [source]="{ uri: f.uri }" resizeMode="cover" accessibilityLabel="Vista previa de la foto" style="height: 220; width: 100%; borderRadius: 12" />
              <pressable
                class="absolute bottom-3 right-3 min-h-11 flex-row items-center gap-1 rounded-full bg-white px-4"
                accessibilityRole="button"
                accessibilityLabel="Cambiar foto"
                (press)="elegirFoto()"
              >
                <app-icono nombre="lucideRefreshCw" [tamano]="16" tono="ink" />
                <text class="text-body font-bold text-ink">Cambiar</text>
              </pressable>
            </view>
          } @else {
            <pressable
              class="h-44 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand bg-tint dark:border-brand-dk dark:bg-tint-dk"
              accessibilityRole="button"
              accessibilityLabel="Elegir de la galería"
              (press)="elegirFoto()"
            >
              <app-icono nombre="lucideImagePlus" [tamano]="36" tono="brand" />
              <text class="text-body font-bold text-brand-ink dark:text-brand-ink-dk">Elegir de la galería</text>
            </pressable>
          }

          <view class="flex-row items-center gap-3 rounded-lg border border-line bg-surface p-4 dark:border-line-dk dark:bg-surface-dk">
            <app-icono nombre="lucideMapPin" [tamano]="24" tono="brand" />
            <view class="flex-1">
              @if (ubicacion(); as u) {
                @if (u.lugar) {
                  <text class="text-body font-bold text-ink dark:text-ink-dk">{{ u.lugar }}</text>
                }
                @if (u.aproximada) {
                  <text class="text-caption font-semibold text-warn-fg">Ubicación aproximada</text>
                } @else {
                  <text class="text-caption text-ink2 dark:text-ink2-dk">{{ u.latitud.toFixed(4) }}, {{ u.longitud.toFixed(4) }}</text>
                }
              } @else {
                <text class="text-body text-ink2 dark:text-ink2-dk">Buscando tu ubicación…</text>
              }
            </view>
            @if (ubicacion()) {
              <!-- Palomita de ubicación lista. -->
              <view class="palomita-ubicacion" [animatedStyle]="pop" [accessibilityElementsHidden]="true">
                <app-icono nombre="lucideCheck" [tamano]="22" tono="ok" [trazo]="3" />
              </view>
            }
          </view>

          <app-tarjeta-seccion etiqueta="NOTA (OPCIONAL)">
            <text-input class="field" [(value)]="nota" multiline [numberOfLines]="3" [maxLength]="500" placeholder="Collar azul, cojea de una pata…" accessibilityLabel="Nota" />
            <text class="text-right text-caption text-ink2 dark:text-ink2-dk">{{ nota().length }}/500</text>
          </app-tarjeta-seccion>

          <view class="gap-2">
            <pressable
              class="min-h-11 flex-row items-center gap-2 px-1"
              accessibilityRole="button"
              [accessibilityLabel]="apiAbierta() ? 'Ocultar Mi API' : 'Mostrar Mi API'"
              [accessibilityState]="{ expanded: apiAbierta() }"
              (press)="apiAbierta.set(!apiAbierta())"
            >
              <app-icono nombre="lucideSettings" [tamano]="16" tono="ink2" />
              <text class="flex-1 text-body text-ink2 dark:text-ink2-dk">Mi API · {{ hostApi() }}</text>
              <app-icono [nombre]="apiAbierta() ? 'lucideChevronUp' : 'lucideChevronDown'" [tamano]="16" tono="ink2" />
            </pressable>
            @if (apiAbierta()) {
              <app-tarjeta-seccion>
                <text-input class="field" [(value)]="api.url" keyboardType="url" autoCapitalize="none" [autoCorrect]="false" accessibilityLabel="URL de mi API" />
                <pressable class="h-11 items-center justify-center" accessibilityRole="button" accessibilityLabel="Restablecer al respaldo" (press)="usarRespaldo()">
                  <text class="text-body font-semibold text-brand dark:text-brand-dk">Restablecer al respaldo</text>
                </pressable>
              </app-tarjeta-seccion>
            }
          </view>
        }
      </scroll-view>

      @if (!cargando()) {
        <view class="border-t border-line bg-canvas px-5 pb-3 pt-3 dark:border-line-dk dark:bg-canvas-dk">
          <pressable
            class="h-14 flex-row items-center justify-center gap-2 rounded-lg"
            [class]="puedeEnviar() ? 'bg-brand' : 'bg-line dark:bg-line-dk'"
            accessibilityRole="button"
            [accessibilityLabel]="etiquetaBoton()"
            [disabled]="!puedeEnviar()"
            [accessibilityState]="{ disabled: !puedeEnviar() }"
            (press)="enviar()"
          >
            @if (puedeEnviar()) {
              <app-icono nombre="lucideSend" [tamano]="20" tono="white" />
            }
            <text class="text-title font-bold" [class]="puedeEnviar() ? 'text-white' : 'text-ink2 dark:text-ink2-dk'">{{ etiquetaBoton() }}</text>
          </pressable>
        </view>
      }
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
  protected readonly apiAbierta = signal(false);

  protected readonly cargando = signal(false);
  protected readonly lento = signal(false);
  protected readonly segundos = signal(0);
  protected readonly error = signal<ReporteError | null>(null);

  protected readonly puedeEnviar = computed(() => this.foto() !== null && this.ubicacion() !== null);
  /** Tipo (siempre tiene valor), foto y ubicación. */
  protected readonly pasos = computed(() => [true, this.foto() !== null, this.ubicacion() !== null]);
  protected readonly listos = computed(() => this.pasos().filter(Boolean).length);
  protected readonly etiquetaBoton = computed(() => {
    if (this.foto() === null) return 'Falta la foto';
    if (this.ubicacion() === null) return 'Buscando tu ubicación…';
    return 'Reportar';
  });
  /** Host de la API sin protocolo ni ruta, para la fila plegada. */
  protected readonly hostApi = computed(() => this.api.url().replace(/^https?:\/\//, '').split('/')[0] ?? '');

  // Animaciones (se apagan con «Reducir movimiento»).
  protected readonly latido = crearLatido(this.cargando);
  protected readonly segmentos = crearSegmentos(this.pasos);
  protected readonly pop = crearPop(() => this.ubicacion() !== null);
  protected readonly transicionChip = crearTransicion(this.api.esRespaldo);

  private temporizador: ReturnType<typeof setTimeout> | undefined;
  private reloj: ReturnType<typeof setInterval> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.detenerTiempos());
    void this.ubicaciones.obtener().then((u) => this.ubicacion.set(u));
  }

  protected async elegirFoto() {
    const elegida = await this.fotos.elegirDeGaleria();
    if (elegida) this.foto.set(elegida);
  }

  protected usarRespaldo() {
    this.api.restablecer();
  }

  private detenerTiempos() {
    clearTimeout(this.temporizador);
    clearInterval(this.reloj);
  }

  protected async enviar() {
    const foto = this.foto();
    const ubicacion = this.ubicacion();
    if (!foto || !ubicacion) return;

    this.error.set(null);
    this.lento.set(false);
    this.segundos.set(0);
    this.cargando.set(true);
    const inicio = Date.now();
    this.temporizador = setTimeout(() => this.lento.set(true), AVISO_LENTO_MS);
    this.reloj = setInterval(() => this.segundos.set(Math.floor((Date.now() - inicio) / 1000)), 1000);

    try {
      const resultado = await this.reportes.enviar({
        tipo: this.tipoElegido(),
        fotoBase64: foto.base64,
        mimeType: foto.mimeType,
        latitud: ubicacion.latitud,
        longitud: ubicacion.longitud,
        ...(this.nota().trim() && { nota: this.nota().trim() }),
      });
      this.estado.uri.set(foto.uri);
      this.estado.segundos.set(Math.round((Date.now() - inicio) / 1000));
      this.estado.resultado.set(resultado);
      await this.router.navigateByUrl('/resultado');
    } catch (e) {
      this.error.set(e instanceof ReporteError ? e : new ReporteError('red', 'Algo salió mal. Intenta de nuevo.'));
    } finally {
      this.detenerTiempos();
      this.cargando.set(false);
    }
  }
}
