# QR Menü

Spring Boot + React tabanlı tek restoran QR menü uygulaması.

Bu proje **Semua Restorant** için tasarlanmıştır. Müşteri masadaki QR kodu okutarak kendi masasına özel menü ekranına girer; ürünleri sepete ekler, sipariş verir, garson çağırır, hesap ister ve sipariş durumunu takip eder. Yönetim paneli tek restoranın operasyon, mutfak, masa, QR, kategori, ürün, kullanıcı ve servis isteği süreçlerini yönetir.

## Özellikler

- Tek restoran odaklı yapı
- Masa bazlı QR menü linkleri
- Kategori ve ürün yönetimi
- Müşteri menüsü, sepet ve sipariş oluşturma
- Sipariş durumu takibi
- Sayfa yenilense bile aktif müşteri sipariş takibinin korunması
- Garson çağırma ve hesap isteme
- Admin ve personel paneli
- Mutfak operasyon ekranı
- WebSocket ile canlı bildirim
- Admin bildirim sesi
- JWT tabanlı auth
- CSRF koruması
- PostgreSQL + Flyway migration
- Docker ve Docker Compose desteği
- Render deployment uyumlu yapı

## Klasör Yapısı

```text
qr-menu/
+-- backend/
+-- frontend/
+-- .env.example
+-- docker-compose.yml
+-- README.md
```

## Teknolojiler

Backend:

- Java 17
- Spring Boot
- Spring Web
- Spring Data JPA
- Spring Security
- PostgreSQL
- Flyway
- Lombok
- Validation
- WebSocket
- Docker

Frontend:

- React
- Vite
- Ant Design
- Axios
- qrcode.react
- Nginx production image

## Hızlı Başlangıç

Tüm sistemi frontend + backend + PostgreSQL olarak root klasörden çalıştırmak için:

```powershell
copy .env.example .env
copy backend\.env.example backend\.env
docker compose up -d --build
```

Uygulama:

```text
http://localhost:3000
```

Root compose yapısında frontend Nginx ile çalışır. Nginx `/api`, `/actuator` ve `/ws` isteklerini backend servisine proxy eder.

## Ortam Değişkenleri

Root `.env` PostgreSQL container ayarları için kullanılır:

```env
POSTGRES_DB=qr_menu
POSTGRES_USER=qr_menu
POSTGRES_PASSWORD=change-me
```

`backend/.env` backend uygulama ayarları için kullanılır:

```env
POSTGRES_DB=qr_menu
POSTGRES_USER=qr_menu
POSTGRES_PASSWORD=change-me
DB_URL=jdbc:postgresql://postgres:5432/qr_menu
DB_USERNAME=qr_menu
DB_PASSWORD=change-me
SERVER_PORT=8080
JPA_DDL_AUTO=validate
FLYWAY_ENABLED=true
SEED_ENABLED=false
PUBLIC_RATE_LIMIT_PER_MINUTE=30
COOKIE_SECURE=false
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
PUBLIC_BASE_URL=http://localhost:3000
JWT_SECRET=change-this-to-a-long-random-secret-in-production
JWT_EXPIRATION_MINUTES=1440
```

Root `.env` içindeki `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` değerleri ile `backend/.env` içindeki `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` aynı veritabanını işaret etmelidir.

## Backend Geliştirme

Sadece backend geliştirme ortamını çalıştırmak için:

```powershell
cd backend
copy .env.example .env
docker compose up -d --build
```

Backend API:

```text
http://localhost:8080
```

Backend testleri:

```powershell
cd backend
.\mvnw.cmd test
```

## Frontend Geliştirme

```powershell
cd frontend
npm install
npm run dev
```

Frontend geliştirme adresi:

```text
http://localhost:5173
```

Frontend production build:

```powershell
cd frontend
npm run build
```

`frontend/.env.example`:

```env
# Local Vite kullanımında boş bırakılabilir.
# API farklı origin üzerinde yayınlanıyorsa doldurulur.
VITE_API_BASE_URL=
VITE_WS_BASE_URL=
```

Root Docker Compose kullanımında frontend Nginx aynı origin üzerinden `/api` ve `/ws` proxy ettiği için frontend env değerleri boş kalabilir.

## Ana URL'ler

Admin panel:

```text
http://localhost:3000/admin
```

Müşteri menüsü:

```text
http://localhost:3000/menu/table/{tableCode}
```

API bilgi ekranı:

```text
http://localhost:8080/
```

Health check:

```text
http://localhost:8080/actuator/health
```

## Önemli API Endpointleri

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/ws-ticket
GET  /api/csrf

GET  /api/restaurants/current

GET  /api/menu/table/{tableCode}

POST /api/orders
GET  /api/orders
GET  /api/orders/{id}
GET  /api/orders/track/{trackingCode}
PATCH /api/orders/{id}/status

POST /api/waiter-calls
GET  /api/waiter-calls
PATCH /api/waiter-calls/{id}/status

POST /api/bill-requests
GET  /api/bill-requests
PATCH /api/bill-requests/{id}/status

GET  /api/tables
POST /api/tables
PUT  /api/tables/{id}
DELETE /api/tables/{id}

GET  /api/categories
POST /api/categories
PUT  /api/categories/{id}
DELETE /api/categories/{id}

GET  /api/products
POST /api/products
PUT  /api/products/{id}
DELETE /api/products/{id}

GET  /api/users
POST /api/users
PUT  /api/users/{id}
DELETE /api/users/{id}
```

Public sipariş takibi tahmin edilebilir `orderId` ile değil, güvenli `trackingCode` ile yapılır.

## Müşteri Sipariş Takibi

Müşteri sipariş verdiğinde backend bir `trackingCode` üretir. Frontend bu tracking code değerini masa koduna bağlı olarak `localStorage` içinde saklar.

Davranış:

- Müşteri sayfayı yenilerse aktif siparişler tekrar backend'den çekilir.
- Sipariş `PENDING`, `PREPARING` veya `READY` durumundaysa takip ekranında kalır.
- Sipariş `SERVED` veya `CANCELLED` durumuna geçerse tracking code temizlenir.
- Temizlenen sipariş sonraki refresh sonrası tekrar gösterilmez.

Bu yapı müşterinin Masa 7 gibi bir masada verdiği siparişi hazırlık bitene kadar takip edebilmesini sağlar.

## Auth, Yetki ve CSRF

Login sonrası backend JWT üretir ve `qr_menu_token` HttpOnly cookie set eder. Frontend ayrıca API isteklerinde kullanmak üzere JWT'yi localStorage içinde saklar.

Admin/personel API istekleri:

- `Authorization: Bearer <token>` ile gelen stateless API istekleri CSRF kontrolünden muaftır.
- Cookie-only mutasyon istekleri CSRF korumasındadır.
- CSRF token `/api/csrf` endpointinden alınabilir.
- Frontend gerektiğinde `X-XSRF-TOKEN` header'ı gönderir.

Roller:

- `ADMIN`: restoran, masa, QR, kategori, ürün, kullanıcı ve operasyon yönetimi.
- `STAFF`: sipariş, mutfak, garson çağrısı ve hesap isteği operasyonları.

## WebSocket ve Bildirim Sesi

Admin panel canlı bildirimler için WebSocket kullanır.

Ticket endpoint:

```text
GET /api/auth/ws-ticket
```

WebSocket örneği:

```text
ws://localhost:3000/ws/admin?ticket=...
```

Production ortamında WebSocket `wss://` üzerinden çalışmalıdır.

Bildirim sesi:

- Admin panelde önce `Sesi Aç` butonuna basılmalıdır.
- Tarayıcılar kullanıcı etkileşimi olmadan ses başlatmayı engelleyebilir.
- Mobil cihazlarda telefon sessiz modda olmamalıdır.
- Sekme arka plandaysa veya cihaz kilitliyse mobil tarayıcılar sesi engelleyebilir.

## QR Mantığı

Her masa için benzersiz `tableCode` üretilir. QR linki şu formattadır:

```text
{PUBLIC_BASE_URL}/menu/table/{tableCode}
```

Örnek:

```text
http://localhost:3000/menu/table/r1-t7-xxxx
```

Müşteri bu linke girdiğinde sistem hangi masadan sipariş verildiğini `tableCode` üzerinden anlar.

## Demo Veri ve Seeder

Demo veri sadece geliştirme ortamında açılmalıdır:

```env
SEED_ENABLED=true
```

Production ortamında:

```env
SEED_ENABLED=false
```

Production veritabanında admin kullanıcı ve gerçek restoran verileri kontrollü şekilde oluşturulmalıdır.

## Production Ayarları

Önerilen backend production env değerleri:

```env
JPA_DDL_AUTO=validate
FLYWAY_ENABLED=true
SEED_ENABLED=false
PUBLIC_RATE_LIMIT_PER_MINUTE=30
COOKIE_SECURE=true
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
PUBLIC_BASE_URL=https://your-frontend-domain.com
JWT_SECRET=<64+ karakter güçlü random secret>
JWT_EXPIRATION_MINUTES=1440
```

Frontend production env örneği:

```env
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_WS_BASE_URL=wss://your-backend-domain.com
```

Frontend ve backend aynı domain altında reverse proxy ile yayınlanıyorsa bu frontend env değerleri boş bırakılabilir.

## Render Deploy Notları

Backend için:

- PostgreSQL database oluştur.
- Backend service env değerlerini Render dashboard üzerinden gir.
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` Render PostgreSQL bilgilerini göstermelidir.
- `COOKIE_SECURE=true` kullanılmalıdır.
- `CORS_ALLOWED_ORIGINS` frontend domainini içermelidir.
- `PUBLIC_BASE_URL` frontend domaini olmalıdır.
- `JWT_SECRET` güçlü ve uzun bir değer olmalıdır.
- `SEED_ENABLED=false` olmalıdır.
- `JPA_DDL_AUTO=validate`, `FLYWAY_ENABLED=true` önerilir.

Frontend için:

- Static site veya Docker/Nginx yapısı kullanılabilir.
- API farklı domain ise `VITE_API_BASE_URL` backend URL olmalıdır.
- WebSocket farklı domain ise `VITE_WS_BASE_URL` `wss://...` olmalıdır.
- Mobil bildirim sesi için kullanıcı admin panelde `Sesi Aç` butonuna basmalıdır.

Deploy sonrası kontrol listesi:

- `/actuator/health` UP dönüyor mu?
- Admin login çalışıyor mu?
- Masa QR linki doğru domaini gösteriyor mu?
- Sipariş oluşturma çalışıyor mu?
- Sipariş durumu admin panelden güncelleniyor mu?
- Garson çağırma ve hesap isteme çalışıyor mu?
- WebSocket canlı bildirim geliyor mu?
- Bildirim sesi PC ve mobilde test edildi mi?
- Mobil cihaz sessiz modda değil mi?

## Docker Notları

Root compose ile PostgreSQL portu host'a açılmaz. Backend ve PostgreSQL private Docker network üzerinden konuşur.

Root compose:

```powershell
docker compose up -d --build
```

Log takip:

```powershell
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

Servisleri durdurma:

```powershell
docker compose down
```

Veritabanı volume dahil sıfırlama:

```powershell
docker compose down -v
```

## Test ve Build

Backend test:

```powershell
cd backend
.\mvnw.cmd test
```

Frontend build:

```powershell
cd frontend
npm run build
```

Docker build:

```powershell
docker compose build
```

## Güvenlik Notları

- Production'da varsayılan `JWT_SECRET` kullanılmamalıdır.
- Production'da `COOKIE_SECURE=true` olmalıdır.
- Production'da `SEED_ENABLED=false` olmalıdır.
- Admin parolaları güçlü olmalıdır.
- PostgreSQL dış dünyaya açılmamalıdır.
- CORS sadece gerçek frontend domainiyle sınırlandırılmalıdır.
- Render veya benzeri platformlarda env değerleri repository'ye commit edilmemelidir.

## Sık Karşılaşılan Durumlar

`docker compose up` root klasörde çalışmıyor:

- Komut `qr-menu/` kök klasöründe çalıştırılmalıdır.
- Sadece backend compose kullanılacaksa `backend/` klasöründe çalıştırılmalıdır.

Admin işlem butonları çalışmıyor:

- Backend ve frontend son sürüm deploy edilmiş olmalıdır.
- JWT süresi dolmuşsa tekrar login olunmalıdır.
- API domaini frontend env içinde doğru olmalıdır.
- CORS ayarında frontend domaini bulunmalıdır.

WebSocket çalışıyor ama ses yok:

- Admin panelde `Sesi Aç` butonuna basılmalıdır.
- Mobil cihaz sessiz modda olmamalıdır.
- Sekme önde açık olmalıdır.

Müşteri siparişi refresh sonrası görünmüyor:

- Sipariş `SERVED` veya `CANCELLED` ise takip kaydı temizlenir.
- Aynı cihaz ve aynı tarayıcı kullanılmalıdır.
- Gizli sekmede localStorage kalıcı olmayabilir.
