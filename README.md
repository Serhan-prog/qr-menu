# QR Menu

Spring Boot + React tabanlı tek restoran QR menü, sipariş, garson çağırma, hesap isteme ve admin operasyon paneli.

Bu proje Semua Restorant için tasarlanmıştır. Admin paneli tek restoranı yönetir; masa QR kodları müşteriyi ilgili masanın menü ekranına yönlendirir.

## Klasör Yapısı

```text
root/
├── backend/
└── frontend/
```

## Backend

Backend PostgreSQL, Flyway migration, JWT HttpOnly cookie auth, WebSocket bildirimleri, public endpoint rate limit ve Docker healthcheck ile çalışır.

Tüm sistemi Nginx frontend + backend + PostgreSQL olarak root klasörden çalıştırmak için:

```powershell
copy .env.example .env
docker compose up -d --build
```

Bu kullanımda uygulama:

```text
http://localhost:3000
```

üzerinden açılır. Nginx `/api` ve `/ws` isteklerini backend'e proxy eder.

Root `.env` içindeki PostgreSQL değerleri ile `backend/.env` içindeki `DB_USERNAME`, `DB_PASSWORD` ve `DB_URL` değerleri aynı veritabanını işaret etmelidir.

Sadece backend geliştirme ortamını çalıştırmak için:

```powershell
cd backend
docker compose up -d --build
```

API:

```text
http://localhost:8080
```

Önemli endpointler:

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/ws-ticket
GET  /api/restaurants/current
GET  /api/menu/table/{tableCode}
POST /api/orders
GET  /api/orders/track/{trackingCode}
POST /api/waiter-calls
POST /api/bill-requests
GET  /api/tables
GET  /api/categories
GET  /api/products
GET  /api/orders
```

Public sipariş takibi tahmin edilebilir `orderId` ile değil, güvenli `trackingCode` ile yapılır.

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

Admin panel:

```text
http://localhost:3000/admin
```

Müşteri menüsü:

```text
http://localhost:3000/menu/table/{tableCode}
```

## Production Ayarları

Production için önerilen env değerleri:

```env
JPA_DDL_AUTO=validate
FLYWAY_ENABLED=true
SEED_ENABLED=false
PUBLIC_RATE_LIMIT_PER_MINUTE=30
COOKIE_SECURE=true
CORS_ALLOWED_ORIGINS=https://your-domain.com
PUBLIC_BASE_URL=https://your-domain.com
JWT_SECRET=<64+ karakter güvenli random secret>
JWT_EXPIRATION_MINUTES=1440
```

Demo veri sadece geliştirme ortamında açılmalıdır:

```env
SEED_ENABLED=true
```

Compose içinde PostgreSQL portu host'a açılmaz; backend ve veritabanı private Docker network üzerinde konuşur.

## Auth ve WebSocket

Admin login sonrasında JWT tarayıcı JavaScript tarafında saklanmaz; backend `HttpOnly` cookie set eder. Admin WebSocket bağlantısı uzun ömürlü JWT yerine kısa ömürlü tek kullanımlık ticket kullanır:

```text
GET /api/auth/ws-ticket
ws://localhost:8080/ws/admin?ticket=...
```

Production'da WebSocket için `wss://` kullanılmalıdır.

Admin mutasyon istekleri CSRF koruması kullanır. Backend `XSRF-TOKEN` cookie üretir, frontend bunu `X-XSRF-TOKEN` header'ı olarak gönderir.

Frontend `.env` örneği:

```env
VITE_API_BASE_URL=https://your-api-domain.com
VITE_WS_BASE_URL=wss://your-api-domain.com
```

## Test

Backend:

```powershell
cd backend
.\mvnw.cmd test
```

Frontend:

```powershell
cd frontend
npm run build
```
