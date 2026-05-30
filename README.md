# QR Menü

Spring Boot ve React tabanlı tek restoran QR menü, sipariş ve operasyon yönetimi uygulaması.

Bu proje bir restoranda masaya özel QR kod ile menü açılması, müşterinin sipariş vermesi, garson çağırması, hesap istemesi ve sipariş durumunu takip etmesi için tasarlanmıştır. Yönetim paneli ise restoran operasyonunu, mutfak sürecini, masa QR kodlarını, menü içeriğini, ekip kullanıcılarını, servis isteklerini ve müşteri puanlarını tek ekrandan yönetir.

## Mevcut Özellikler

- Tek restoran odaklı backend modeli.
- Masa bazlı benzersiz `tableCode` ve QR menü linki.
- Public müşteri menüsü: kategori, ürün arama, ürün görselleri ve sepet.
- Sipariş oluşturma, ürün notu ve sipariş notu.
- Güvenli `trackingCode` ile müşteri sipariş takibi.
- Sipariş durumları: `PENDING`, `PREPARING`, `READY`, `SERVED`, `CANCELLED`.
- Admin tarafından sipariş iptali ve müşteriye gösterilen iptal nedeni.
- Servis edilen sipariş için müşteri geri bildirimi: yemek, servis, hız, temizlik ve genel puan.
- Garson çağırma ve hesap isteme.
- Admin operasyon paneli: bekleyen istekler, mutfak, sipariş geçmişi, istek geçmişi, puanlar.
- Admin menü yönetimi: masalar, QR linkleri, kategoriler, ürünler, restoran bilgisi ve ekip.
- `ADMIN` ve `STAFF` rolleri.
- WebSocket ile admin canlı bildirimleri.
- Bildirim sesi aktivasyonu ve WebSocket kapalıyken periyodik yedek yenileme.
- JWT tabanlı auth, HttpOnly cookie, Bearer token desteği ve CSRF koruması.
- Public endpointler için basit rate limit.
- PostgreSQL, Flyway migration, Docker ve Docker Compose desteği.

## Proje Yapısı

```text
qr-menu/
|-- backend/
|   |-- src/main/java/com/qrmenu/
|   |-- src/main/resources/db/migration/
|   |-- docker-compose.yml
|   |-- Dockerfile
|   `-- pom.xml
|-- frontend/
|   |-- src/
|   |-- nginx.conf
|   |-- Dockerfile
|   `-- package.json
|-- docker-compose.yml
|-- .env.example
`-- README.md
```

## Teknolojiler

Backend:

- Java 17
- Spring Boot 3.3.5
- Spring Web, Spring Security, Spring Data JPA
- Spring WebSocket
- PostgreSQL 16
- Flyway
- Lombok
- Jakarta Validation
- JJWT
- Spring Boot Actuator
- H2 test veritabanı

Frontend:

- React 18
- Vite 6
- React Router 7
- Ant Design 5
- Ant Design Icons
- Axios
- qrcode.react
- Nginx production image

## Hızlı Başlangıç

Tüm sistemi PostgreSQL, backend ve frontend olarak kök dizinden çalıştırmak için:

```powershell
copy .env.example .env
copy backend\.env.example backend\.env
docker compose up -d --build
```

Uygulama:

```text
http://localhost:3000
```

Root Docker Compose yapısında frontend Nginx ile yayınlanır. Nginx `/api`, `/actuator` ve `/ws` isteklerini backend servisine proxy eder. Backend host portu root compose dosyasında dışarı açılmaz; uygulama normalde frontend origin üzerinden kullanılır.

## Ortam Değişkenleri

Kök `.env` PostgreSQL container için kullanılır:

```env
POSTGRES_DB=qr_menu
POSTGRES_USER=qr_menu
POSTGRES_PASSWORD=change-me
```

`backend/.env` backend ayarları için kullanılır:

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
COOKIE_SECURE=true
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
PUBLIC_BASE_URL=http://localhost:3000
JWT_SECRET=change-this-to-a-long-random-secret-in-production
JWT_EXPIRATION_MINUTES=1440
```

Frontend `.env` sadece API veya WebSocket farklı origin üzerindeyse doldurulur:

```env
VITE_API_BASE_URL=
VITE_WS_BASE_URL=
```

Local Vite kullanımında `/api` ve `/ws` istekleri `vite.config.js` proxy ayarlarıyla `localhost:8080` backendine gider. Docker production imajında aynı proxy görevini `frontend/nginx.conf` üstlenir.

## Backend Geliştirme

Sadece backend compose yapısını çalıştırmak için:

```powershell
cd backend
copy .env.example .env
docker compose up -d --build
```

Backend API:

```text
http://localhost:8080
```

Backend testi:

```powershell
cd backend
.\mvnw.cmd test
```

Backend lokal Maven ile çalıştırılacaksa PostgreSQL erişilebilir olmalı ve `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` değerleri buna göre ayarlanmalıdır.

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

Production build:

```powershell
cd frontend
npm run build
```

Preview:

```powershell
cd frontend
npm run preview
```

## Uygulama URL'leri

```text
GET  http://localhost:3000/login
GET  http://localhost:3000/admin
GET  http://localhost:3000/menu/table/{tableCode}
GET  http://localhost:8080/
GET  http://localhost:8080/actuator/health
```

`/kitchen` route'u artık ayrı bir ekran değil, `/admin` paneline yönlendirilir. Mutfak paneli admin içinde bir operasyon bölümü olarak çalışır.

## Kullanıcı Rolleri

`ADMIN`:

- Restoran bilgisini düzenler.
- Masa ve QR linklerini yönetir.
- Kategori ve ürünleri yönetir.
- Kullanıcı ekler, günceller ve siler.
- Operasyon, mutfak, sipariş geçmişi, servis istekleri ve puanları görür.

`STAFF`:

- Operasyon panelini kullanır.
- Aktif siparişleri ve mutfak akışını yönetir.
- Garson çağrıları ve hesap isteklerini kapatır.
- Sipariş geçmişi, istek geçmişi ve puanları görür.
- Masa, menü, restoran ve ekip yönetimi sekmelerine erişemez.

## Ana API Endpointleri

Auth ve sistem:

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/ws-ticket
GET  /api/csrf
GET  /
GET  /actuator/health
```

Restoran:

```text
GET  /api/restaurants
GET  /api/restaurants/current
GET  /api/restaurants/public
GET  /api/restaurants/{id}
POST /api/restaurants
PUT  /api/restaurants/{id}
DELETE /api/restaurants/{id}
```

Not: Uygulama tek restoran modundadır. Public servis tarafında restoran oluşturma ve silme kapatılıdır; `POST /api/restaurants` ve `DELETE /api/restaurants/{id}` hata döner.

Menü, masa, kategori ve ürün:

```text
GET    /api/menu/table/{tableCode}
GET    /api/tables?restaurantId={id}
POST   /api/tables
PUT    /api/tables/{id}
DELETE /api/tables/{id}
GET    /api/categories?restaurantId={id}
POST   /api/categories
PUT    /api/categories/{id}
DELETE /api/categories/{id}
GET    /api/products?restaurantId={id}
POST   /api/products
PUT    /api/products/{id}
DELETE /api/products/{id}
```

Sipariş:

```text
POST  /api/orders
GET   /api/orders?restaurantId={id}
GET   /api/orders?tableId={id}
GET   /api/orders/{id}
GET   /api/orders/track/{trackingCode}
PATCH /api/orders/{id}/status
```

Servis istekleri:

```text
POST  /api/waiter-calls
GET   /api/waiter-calls?restaurantId={id}
PATCH /api/waiter-calls/{id}/status
POST  /api/bill-requests
GET   /api/bill-requests?restaurantId={id}
PATCH /api/bill-requests/{id}/status
```

Geri bildirim ve kullanıcılar:

```text
POST   /api/feedback/order/{trackingCode}
GET    /api/feedback?restaurantId={id}
GET    /api/users
GET    /api/users/{id}
POST   /api/users
PUT    /api/users/{id}
DELETE /api/users/{id}
```

## Müşteri Akışı

1. Müşteri `PUBLIC_BASE_URL/menu/table/{tableCode}` linkinden menüye girer.
2. Backend `tableCode` ile masayı ve aktif menü içeriğini bulur.
3. Müşteri ürünleri sepete ekler; ürün bazlı not ve sipariş notu yazabilir.
4. `POST /api/orders` ile sipariş oluşur ve backend benzersiz `trackingCode` üretir.
5. Frontend bu `trackingCode` değerini masa koduna bağlı olarak `localStorage` içinde saklar.
6. Sipariş takibi `GET /api/orders/track/{trackingCode}` ile yapılır.
7. Sipariş `SERVED` olduğunda müşteri puan/yorum formunu görebilir.
8. Sipariş `CANCELLED` olursa iptal nedeni müşteri ekranında gösterilir.

Müşteri ayrıca menü ekranından garson çağırabilir veya hesap isteyebilir. Bu istekler public endpointlerle oluşturulur ve admin paneline canlı bildirim olarak düşer.

## Sipariş Takibi ve localStorage

Müşteri siparişleri `qr_menu_table_orders:{tableCode}` anahtarıyla saklanır.

- Sayfa yenilendiğinde aktif tracking code'lar backendden tekrar çekilir.
- `PENDING`, `PREPARING`, `READY` ve henüz puanlanmamış `SERVED` siparişler takipte kalır.
- `CANCELLED` siparişler ve puanı gönderilmiş `SERVED` siparişler localStorage kaydından temizlenir.
- Gizli sekme veya farklı cihaz kullanılırsa önceki localStorage kaydı bulunmayabilir.

## Admin Operasyon Paneli

`/admin` paneli login gerektirir.

Panel bölümleri:

- Operasyon: bekleyen garson/hesap istekleri ve mutfak kartları.
- Sipariş Geçmişi: tüm siparişler ve kalem detayları.
- İstek Geçmişi: garson çağrıları ve hesap istekleri.
- Puanlar: ortalama puanlar ve müşteri yorumları.
- Masalar ve QR: masa listesi, QR linki, QR kod modal'ı.
- Kategoriler: menü kategori yönetimi.
- Ürünler: fiyat, görsel URL, kategori, satış durumu ve sıra yönetimi.
- Ekip: admin/personel kullanıcıları.
- Restoran: restoran adı, telefon, adres ve aktiflik.

Admin panel WebSocket bağlantısı açık değilse veri 15 saniyede bir yedek olarak yenilenir.

## WebSocket Bildirimleri

Canlı bildirimler `/ws/admin` WebSocket endpointi ile gelir. Bağlantı doğrudan JWT ile değil, kısa ömürlü ticket ile kurulur:

```text
GET /api/auth/ws-ticket
ws://localhost:3000/ws/admin?ticket=...
```

Backend `AdminNotificationService` şu olaylarda bildirim yayınlar:

- `ORDER_CREATED`
- `WAITER_CALL_CREATED`
- `BILL_REQUEST_CREATED`

Bildirimler restoran ID'sine göre ilgili admin/personel oturumlarına gönderilir. Teslimat hatası sipariş veya istek oluşturma akışını bozmaz.

Tarayıcı ses politikaları nedeniyle bildirim sesi için admin panelde önce `Sesi Aç` butonuna basılmalıdır. Mobil cihazlarda sessiz mod, kilit ekranı veya arka plan sekmesi sesi engelleyebilir.

## Auth, Cookie ve CSRF

Login sonrası backend JWT üretir:

- `qr_menu_token` HttpOnly cookie olarak set edilir.
- Frontend aynı token'ı `localStorage` içinde API istekleri için saklar.
- Axios isteklerinde token varsa `Authorization: Bearer <token>` header'ı gönderilir.

CSRF davranışı:

- Bearer token ile gelen stateless istekler CSRF kontrolünden muaftır.
- Cookie-only mutasyonlarda `XSRF-TOKEN` cookie ve `X-XSRF-TOKEN` header'ı kullanılır.
- `/api/csrf` token üretir.
- Public müşteri mutasyonları CSRF ignore listesindedir: sipariş, feedback, garson çağrısı ve hesap isteği.

Public endpointler için `PUBLIC_RATE_LIMIT_PER_MINUTE` ile dakika bazlı basit rate limit uygulanır.

## QR Mantığı

Her masa için benzersiz `tableCode` bulunur. QR linki şu formattadır:

```text
{PUBLIC_BASE_URL}/menu/table/{tableCode}
```

Örnek:

```text
http://localhost:3000/menu/table/r1-t7-a1b2c3d4
```

`PUBLIC_BASE_URL` doğru ayarlanmazsa admin panelde üretilen QR linkleri yanlış domaini gösterebilir.

## Veritabanı ve Migration

Flyway migration dosyaları:

```text
backend/src/main/resources/db/migration/V1__init_schema.sql
backend/src/main/resources/db/migration/V2__add_order_tracking_code.sql
backend/src/main/resources/db/migration/V3__restaurant_settings_and_order_cancellation.sql
backend/src/main/resources/db/migration/V4__create_feedbacks.sql
```

Ana tablolar:

- `restaurants`
- `restaurant_tables`
- `categories`
- `products`
- `orders`
- `order_items`
- `waiter_calls`
- `bill_requests`
- `users`
- `feedbacks`

`JPA_DDL_AUTO=validate` önerilir. Şemayı Flyway yönetir.

## Demo Veri

Demo seed sadece `SEED_ENABLED=true` iken çalışır.

Seeder örnek olarak:

- `Semua Restorant` restoranını,
- 8 masa ve QR kodlarını,
- başlangıç, ana yemek, içecek ve tatlı kategorilerini,
- örnek ürünleri,
- bir admin kullanıcıyı oluşturur.

Production ortamında `SEED_ENABLED=false` kullanılmalıdır. Gerçek admin ve restoran verileri kontrollü şekilde oluşturulmalıdır.

## Docker Notları

Root compose:

```powershell
docker compose up -d --build
```

Loglar:

```powershell
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

Durdurma:

```powershell
docker compose down
```

Volume dahil sıfırlama:

```powershell
docker compose down -v
```

Backend klasöründeki compose dosyası backend portunu `${SERVER_PORT}:8080` olarak host'a açar ve frontend build context'ini `../frontend` olarak kullanır.

## Production Ayarları

Backend için önerilen ayarlar:

```env
JPA_DDL_AUTO=validate
FLYWAY_ENABLED=true
SEED_ENABLED=false
PUBLIC_RATE_LIMIT_PER_MINUTE=30
COOKIE_SECURE=true
CORS_ALLOWED_ORIGINS=https://frontend-domain.com
PUBLIC_BASE_URL=https://frontend-domain.com
JWT_SECRET=<64+ karakter güçlü random secret>
JWT_EXPIRATION_MINUTES=1440
```

Frontend ve backend aynı domain altında reverse proxy ile yayınlanıyorsa:

```env
VITE_API_BASE_URL=
VITE_WS_BASE_URL=
```

API farklı domaindeyse:

```env
VITE_API_BASE_URL=https://api-domain.com
VITE_WS_BASE_URL=wss://api-domain.com
```

Production kontrol listesi:

- `/actuator/health` `UP` dönüyor mu?
- `COOKIE_SECURE=true` mi?
- `JWT_SECRET` güçlü ve repository dışında mı?
- `CORS_ALLOWED_ORIGINS` sadece gerçek frontend domainini içeriyor mu?
- `PUBLIC_BASE_URL` QR kodlar için doğru domain mi?
- Admin login çalışıyor mu?
- Masa QR linki müşteri menüsünü açıyor mu?
- Sipariş oluşturma ve durum güncelleme çalışıyor mu?
- İptal nedeni müşteri ekranında görünüyor mu?
- Garson çağrısı ve hesap isteği admin paneline düşüyor mu?
- WebSocket bildirimi ve yedek polling çalışıyor mu?
- Bildirim sesi masaüstü ve mobilde test edildi mi?
- Müşteri puanı `SERVED` sipariş sonrası alınabiliyor mu?

## Test ve Build

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

Docker:

```powershell
docker compose build
```

## Güvenlik Notları

- Production'da varsayılan `JWT_SECRET` kullanılmaz.
- Production'da `COOKIE_SECURE=true` kullanılır.
- Production'da `SEED_ENABLED=false` kullanılır.
- PostgreSQL dış dünyaya açılmaz.
- CORS sadece gerçek frontend domainleriyle sınırlandırılır.
- Admin ve personel parolaları güçlü olmalıdır.
- `.env` dosyaları repository'ye commit edilmez.
- Public sipariş takibi tahmin edilebilir ID ile değil, `trackingCode` ile yapılır.
- WebSocket bağlantısı ticket ile açılır; ticket tek kullanımlık olarak tüketilir.

## Sık Karşılaşılan Durumlar

`docker compose up` çalışmıyor:

- Komutun `qr-menu/` kök klasöründe çalıştığından emin olun.
- Sadece backend compose kullanılıyorsa `backend/` klasörüne geçin.
- `.env` ve `backend/.env` dosyalarının var olduğunu kontrol edin.

Admin panel isteklerde 401 alıyor:

- Login token'ı süresi dolmuş olabilir; tekrar giriş yapın.
- Frontend `VITE_API_BASE_URL` doğru backend originini göstermeli.
- Backend `CORS_ALLOWED_ORIGINS` frontend originini içermeli.

WebSocket bağlanmıyor:

- `/api/auth/ws-ticket` authenticated olarak çalışmalı.
- Reverse proxy `/ws` için `Upgrade` ve `Connection` header'larını geçirmeli.
- HTTPS production ortamında WebSocket adresi `wss://` olmalı.

Bildirim sesi gelmiyor:

- Admin panelde `Sesi Aç` butonuna basın.
- Mobil cihaz sessiz modda olmamalı.
- Mobil tarayıcılarda arka plan sekmesi veya kilit ekranı sesi engelleyebilir.

Müşteri siparişi yenilemeden sonra görünmüyor:

- Aynı cihaz ve aynı tarayıcı kullanılmalı.
- Gizli sekmede localStorage kalıcı olmayabilir.
- Sipariş `CANCELLED` ise veya `SERVED` sonrası puan gönderildiyse takip kaydı temizlenir.

QR linki yanlış domain açıyor:

- Backend `PUBLIC_BASE_URL` değerini kontrol edin.
- Docker/Nginx veya deployment domaini değiştiyse backend yeniden deploy edilmelidir.
