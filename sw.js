/* =====================================================================
 *  おんたまドリル ポータル  Service Worker
 *  ---------------------------------------------------------------------
 *  ・CORE_ASSETS … このポータル自身のファイル（さいしょに まとめて保存）
 *  ・RUNTIME     … Google フォントなどの外部ファイル（つかった ものから 保存）
 *
 *  中身を なおしたら、下の VERSION を 1つ 上げること。
 *  （古い保存を そうじして、新しいファイルに 入れかえます）
 * ===================================================================== */

const VERSION = 'v1.0.0';

// このアプリ専用の 名ふだ。
// キャッシュ置き場（CacheStorage）は hot-spring-egg.github.io というサイト
// ぜんたいで 共有されていて、同じサイトに置いた ほかのドリルの保存も
// 見えてしまう。「自分の名ふだが 付いた保存だけ」を そうじするために、
// かならず この接頭辞を つかうこと。
const CACHE_PREFIX = 'ontama-portal-';
const CORE_CACHE = CACHE_PREFIX + 'core-' + VERSION;
const RUNTIME_CACHE = CACHE_PREFIX + 'runtime-' + VERSION;

// 自分のファイル（相対パス＝GitHub Pages のサブフォルダでも動く）
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.png',
  './icons/favicon-32.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
];

// インストール：コアファイルを まとめて保存
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CORE_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
      // 1つでも取れなかったときに install ごと失敗させると、
      // このあと ずっと オフラインで ひらけないままになる。
      .catch(() => self.skipWaiting())
  );
});

// 有効化：古いバージョンの保存を そうじ
// ※ 消すのは「ontama-portal- で始まる＝このポータルの保存」だけ。
//   ここで ぜんぶ消すと、同じサイトに置いた ほかのドリル
//   （けいさんカード・九九カードなど）の オフライン用データまで
//   まきぞえで 消えてしまう。
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith(CACHE_PREFIX))
            .filter((k) => k !== CORE_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // ページの表示（ナビゲーション）：通信を先に試し、ダメなら 保存した index.html。
  // ※ caches.match（置き場ぜんたい検索）は つかわない。置き場は サイト全体で
  //   共有なので、ほかのドリルが 保存した ページを 取りだしてしまうおそれがある。
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() =>
        caches
          .open(CORE_CACHE)
          .then((c) => c.match('./index.html', { ignoreSearch: true }))
          .then((r) => r || Response.error())
      )
    );
    return;
  }

  // 自分のフォルダ（/ontama-drill/…）の中かどうか。
  // 同じサイトでも ほかのドリルのファイルには 手を出さない。
  const inScope = req.url.startsWith(self.registration.scope);

  // マニフェスト：かならず通信を先に試す（オフラインのときだけ 保存を つかう）。
  // ブラウザは この中身の id / scope で「どのアプリか」を 判断している。
  // 保存を優先すると 古い id を返してしまい、なおしても なおらない・
  // 同じサイトの 別アプリと 取りちがえられる、といった 不具合の原因になる。
  if (inScope && url.pathname.endsWith('/manifest.webmanifest')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CORE_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches.open(CORE_CACHE).then((c) => c.match(req)).then((r) => r || Response.error())
        )
    );
    return;
  }

  if (inScope) {
    // 自分のファイル：まず保存を返し、うしろで 新しいものに 更新（速い＋最新化）
    event.respondWith(
      caches.open(CORE_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const network = fetch(req)
            .then((res) => {
              if (res && res.ok) {
                const copy = res.clone();
                caches.open(CORE_CACHE).then((c) => c.put(req, copy));
              }
              return res;
            })
            .catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  // 同じサイトの「自分のフォルダの外」＝ほかのドリルのページやファイル。
  // 横取りせず、そのまま 通信に まかせる。
  if (url.origin === self.location.origin) return;

  // 外部ファイル（Google フォント）：保存を優先しつつ、うしろで 更新
  event.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) =>
      cache.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && (res.ok || res.type === 'opaque')) {
              cache.put(req, res.clone());
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    )
  );
});

// ページからの「すぐ更新して」に こたえる
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
