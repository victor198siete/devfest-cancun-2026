import { Controller, Get, Header, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';

const escapar = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Página que ve quien escanea el QR del despliegue: confirma que la API vive y muestra la URL para la app.
@ApiExcludeController()
@Controller()
export class InicioController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  inicio(@Req() req: Request) {
    const proto = String(req.headers['x-forwarded-proto'] ?? req.protocol).split(',')[0];
    const url = escapar(`${proto}://${req.headers.host ?? ''}`);
    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tu API está lista</title>
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #f3f6f4; color: #14211b; }
  main { max-width: 32rem; margin: 0 auto; padding: 2.5rem 1.25rem; }
  h1 { font-size: 1.75rem; margin: 0 0 .5rem; }
  p { line-height: 1.5; color: #55655d; }
  .url { background: #fff; border: 1px solid #dbe3de; border-radius: 14px; padding: 1rem; font: 1rem ui-monospace, monospace;
    word-break: break-all; color: #14211b; user-select: all; -webkit-user-select: all; }
  button { margin-top: 1rem; width: 100%; height: 3rem; border: 0; border-radius: 14px; background: #0f766e; color: #fff;
    font-size: 1rem; font-weight: 600; }
  a { color: #0f766e; }
</style>
</head>
<body>
<main>
  <h1>✔ Tu API está lista</h1>
  <p>Copia esta dirección y pégala en la app, en <strong>Mi API</strong>:</p>
  <div class="url" id="url">${url}</div>
  <button id="copiar" type="button">Copiar dirección</button>
  <p>Documentación: <a href="/docs">/docs</a> · Salud: <a href="/health">/health</a></p>
</main>
<script>
  document.getElementById('copiar').addEventListener('click', async (e) => {
    try { await navigator.clipboard.writeText(document.getElementById('url').textContent); e.target.textContent = 'Copiada ✔'; }
    catch { e.target.textContent = 'Mantén presionada la dirección para copiarla'; }
  });
</script>
</body>
</html>`;
  }
}
