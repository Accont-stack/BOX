// Service Worker para PWA - Permite funcionar offline
const CACHE_NAME = 'thebox-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/ai-assistant.js',
  '/styles.css',
  '/manifest.json'
];

// Instalar o Service Worker
self.addEventListener('install', event => {
  console.log('📦 Service Worker instalado - criando cache');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('⚠️ Alguns arquivos não foram cacheados:', err);
        // Continua mesmo se alguns arquivos falharem
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting(); // Ativa imediatamente
});

// Ativar o Service Worker
self.addEventListener('activate', event => {
  console.log('✅ Service Worker ativado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', event => {
  // Apenas GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // Se está em cache, retorna do cache
      if (response) {
        return response;
      }

      // Se não está em cache, tenta buscar da rede
      return fetch(event.request).then(response => {
        // Não cachear respostas que não são sucesso
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clona a resposta
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Se falhar, retorna versão em cache
        return caches.match(event.request);
      });
    })
  );
});
