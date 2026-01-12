const CACHE_NAME = 'mi-vida-virtual-v39';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Instalar el service worker y cachear archivos
self.addEventListener('install', event => {
  console.log('🔄 Instalando nueva versión del service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
  // Forzar activación inmediata cuando hay nueva versión
  self.skipWaiting();
});

// Notificar a los clientes sobre la nueva versión
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activar el service worker y limpiar caches antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Tomar control de todas las páginas inmediatamente
  self.clients.claim();
});

// Interceptar peticiones con estrategia Network-First para index.html
self.addEventListener('fetch', event => {
  // Para el archivo principal, intentar red primero para obtener actualizaciones
  if (event.request.url.includes('index.html') || event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Si hay respuesta de red, actualizar cache y devolver
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Si falla la red, usar cache
          return caches.match(event.request);
        })
    );
  } else {
    // Para otros archivos, usar cache primero (más rápido)
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          
          return fetch(event.request).then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
        })
        .catch(() => {
          return caches.match('./index.html');
        })
    );
  }
});
