// Sirve la app exportada (`expo export`) a Expo Go con el protocolo de actualizaciones de Expo.
// Expo Go pide el manifiesto en `/` y luego descarga el bundle de `/archivos/...`.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const DIST = process.env.DIST ?? './dist';
const PORT = Number(process.env.PORT ?? 8080);

const metadata = JSON.parse(await readFile(join(DIST, 'metadata.json'), 'utf8'));
const expoConfig = JSON.parse(await readFile(join(DIST, 'expoConfig.json'), 'utf8'));
// Sin rastro del proyecto de EAS: Expo Go en Android intenta consultarlo y se queda en
// «Checking for new update…» para quien no es miembro de la organización.
delete expoConfig.owner;
delete expoConfig.updates;
if (expoConfig.extra) delete expoConfig.extra.eas;
const idActualizacion = uuidDesde(JSON.stringify(metadata));
const creadoEn = new Date().toISOString();
const tipos = { '.js': 'application/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf' };

function uuidDesde(texto) {
  const h = createHash('sha256').update(texto).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

async function describir(ruta, ext, base, esBundle) {
  const archivo = await readFile(join(DIST, ruta));
  return {
    hash: createHash('sha256').update(archivo).digest('base64url'),
    key: createHash('md5').update(archivo).digest('hex'),
    fileExtension: esBundle ? '.bundle' : `.${ext}`,
    contentType: esBundle ? 'application/javascript' : (tipos[`.${ext}`] ?? 'application/octet-stream'),
    url: `${base}/archivos/${ruta}`,
  };
}

async function manifiesto(req, res) {
  const plataforma = req.headers['expo-platform'];
  if (plataforma !== 'ios' && plataforma !== 'android') {
    res.writeHead(400).end('Abre esta URL desde Expo Go.');
    return;
  }
  const base = `${req.headers['x-forwarded-proto'] ?? 'http'}://${req.headers['x-forwarded-host'] ?? req.headers.host}`;
  const datos = metadata.fileMetadata[plataforma];
  const cuerpo = JSON.stringify({
    id: idActualizacion,
    createdAt: creadoEn,
    runtimeVersion: `exposdk:${expoConfig.sdkVersion}`,
    launchAsset: await describir(datos.bundle, null, base, true),
    assets: await Promise.all(datos.assets.map((a) => describir(a.path, a.ext, base, false))),
    metadata: {},
    extra: { expoClient: expoConfig, scopeKey: `@taller/${expoConfig.slug}` },
  });
  const limite = 'expo-taller';
  res.writeHead(200, {
    'expo-protocol-version': 0,
    'expo-sfv-version': 0,
    'cache-control': 'private, max-age=0',
    'content-type': `multipart/mixed; boundary=${limite}`,
  });
  res.end(
    `--${limite}\r\ncontent-type: application/json; charset=utf-8\r\n` +
      `content-disposition: form-data; name="manifest"\r\n\r\n${cuerpo}\r\n--${limite}--\r\n`,
  );
}

async function archivo(req, res) {
  const ruta = normalize(decodeURIComponent(req.url.slice('/archivos/'.length).split('?')[0]));
  if (ruta.startsWith('..')) return res.writeHead(400).end();
  try {
    const contenido = await readFile(join(DIST, ruta));
    res.writeHead(200, { 'content-type': tipos[extname(ruta)] ?? 'application/octet-stream' });
    res.end(contenido);
  } catch {
    res.writeHead(404).end();
  }
}

createServer((req, res) => {
  if (req.url.startsWith('/archivos/')) return archivo(req, res);
  if (req.url === '/health') return res.writeHead(200).end('ok');
  if (req.url === '/' || req.url.startsWith('/?')) return manifiesto(req, res);
  res.writeHead(404).end();
}).listen(PORT, () => console.log(`App lista en el puerto ${PORT}`));
