/* Portal Equipe Las Vegas — guarda os arquivos do portal no aparelho (v32).
   • Páginas (HTML): sempre tenta a internet primeiro; sem internet, usa a última guardada.
   • Arquivos do portal (/ponto/*.js, .css, .json, .svg) e ícones/fontes: abre na hora com o que está guardado
     e atualiza em segundo plano (na próxima abertura já vem a versão nova). Cada arquivo guarda só a última versão (?v=).
   • O servidor (Apps Script), a Kommo e qualquer envio (POST) nunca passam por aqui.
   Para DESLIGAR em todos os aparelhos: troque este arquivo pelo conteúdo de emergência no fim dele. */
const CACHE = 'lv-portal-1';

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

function guardavel(url) {
  if (url.origin === self.location.origin) return /^\/ponto\/[^/]+\.(js|css|json|svg|png|webmanifest)$/.test(url.pathname) || url.pathname === '/app.webmanifest';
  return url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

async function guardar(req, resp) {
  if (!resp || !(resp.ok || resp.type === 'opaque')) return;
  const c = await caches.open(CACHE), url = new URL(req.url);
  if (url.origin === self.location.origin) {                 // apaga as versões antigas do mesmo arquivo
    for (const k of await c.keys()) { const u = new URL(k.url); if (u.pathname === url.pathname && u.search !== url.search) await c.delete(k); }
  }
  await c.put(req, resp);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate' && url.origin === self.location.origin) {
    e.respondWith((async () => {
      try {
        const r = await fetch(req);
        if (r.ok && (url.pathname === '/' || url.pathname === '/index.html' || url.pathname.startsWith('/ponto'))) {
          const copia = r.clone(); caches.open(CACHE).then(c => c.put('/', copia)).catch(() => {});
        }
        return r;
      } catch (err) {
        const c = await caches.open(CACHE), portal = url.pathname === '/' || url.pathname === '/index.html' || url.pathname.startsWith('/ponto');
        return (await c.match(req)) || (portal ? await c.match('/') : null) || Response.error();
      }
    })());
    return;
  }

  if (!guardavel(url)) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const ja = await c.match(req);
    const rede = fetch(req).then(r => { guardar(req, r.clone()).catch(() => {}); return r; });
    if (ja) { e.waitUntil(rede.catch(() => {})); return ja; }
    return rede;
  })());
});

/* ── EMERGÊNCIA (desliga e apaga tudo nos aparelhos): substitua todo o arquivo por:
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll()) c.navigate(c.url);
})()));
── */
