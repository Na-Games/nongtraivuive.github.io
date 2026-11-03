'use strict';
// Small network-first shell cache. Do not duplicate the large sprite library.
const CACHE='nongtrai-shell-20261103-document-v7';
const SHELL=['./','./index.html','./style.css','./art.css','./fishing.css','./responsive.css','./village.css','./diorama.css','./village-refresh.css','./playability.css','./countryside.css','./document-fixes.css'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('nongtrai-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||!SHELL.some(file=>new URL(file,self.registration.scope).href===event.request.url))return;event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)))}return response}).catch(()=>caches.match(event.request)))});
