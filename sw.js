// Service Worker for 고객상담 관리 시스템 PWA
const CACHE_NAME = 'customer-consultation-v2.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js'
];

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker 설치 중...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('💾 캐시 파일들 저장 중...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker 설치 완료');
        self.skipWaiting(); // 즉시 활성화
      })
      .catch((error) => {
        console.error('❌ Service Worker 설치 실패:', error);
      })
  );
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker 활성화');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 이전 버전 캐시 삭제
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker 활성화 완료');
      self.clients.claim(); // 즉시 제어권 획득
    })
  );
});

// 네트워크 요청 가로채기 (캐시 우선 전략)
self.addEventListener('fetch', (event) => {
  // Firebase API 요청은 항상 네트워크 우선
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('firebase.googleapis.com')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // 네트워크 실패시 오프라인 안내
          return new Response(
            JSON.stringify({ 
              error: '오프라인 상태입니다. 네트워크 연결을 확인해주세요.' 
            }),
            { 
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // 정적 자원은 캐시 우선
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에 있으면 캐시된 버전 반환
        if (response) {
          console.log('📦 캐시에서 로드:', event.request.url);
          return response;
        }

        // 캐시에 없으면 네트워크에서 가져와서 캐시에 저장
        return fetch(event.request).then((response) => {
          // 유효한 응답이 아니면 그대로 반환
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 응답 복제 (응답은 한 번만 사용 가능)
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // 네트워크도 실패한 경우 오프라인 페이지 반환
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// 백그라운드 동기화 (향후 확장 가능)
self.addEventListener('sync', (event) => {
  console.log('🔄 백그라운드 동기화:', event.tag);
  
  if (event.tag === 'consultation-sync') {
    event.waitUntil(
      // 오프라인에서 저장한 데이터를 동기화
      syncOfflineData()
    );
  }
});

// 푸시 알림 (향후 확장 가능)
self.addEventListener('push', (event) => {
  console.log('📢 푸시 알림 수신:', event.data?.text());
  
  const options = {
    body: event.data?.text() || '새로운 상담 알림이 있습니다.',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: '열기',
        icon: '/icon-96.png'
      },
      {
        action: 'close', 
        title: '닫기'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('고객상담 시스템', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 알림 클릭:', event.action);
  
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 오프라인 데이터 동기화 함수
async function syncOfflineData() {
  try {
    console.log('🔄 오프라인 데이터 동기화 시작');
    
    // 실제 구현시 IndexedDB에서 오프라인 저장된 데이터 가져와서
    // Firebase에 동기화하는 로직 추가
    
    // 예시:
    // const offlineData = await getOfflineData();
    // for (const item of offlineData) {
    //   await uploadToFirebase(item);
    //   await removeFromOfflineStorage(item.id);
    // }
    
    console.log('✅ 오프라인 데이터 동기화 완료');
    
  } catch (error) {
    console.error('❌ 오프라인 데이터 동기화 실패:', error);
  }
}

// 에러 처리
self.addEventListener('error', (event) => {
  console.error('❌ Service Worker 오류:', event.error);
});

// 처리되지 않은 Promise 거부 처리
self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Service Worker Promise 거부:', event.reason);
  event.preventDefault();
});

console.log('🚀 Service Worker 로드 완료 - 고객상담 시스템 PWA v2.1');