# QR Menü

Spring Boot ve React ile geliştirilmiş tek restoran odaklı QR menü, sipariş, mutfak, servis isteği ve operasyon yönetimi uygulaması.

Bu sistem müşterilerin masaya özel QR kod ile menüyü açmasını, ürünleri incelemesini, sipariş vermesini, garson çağırmasını, hesap istemesini, sipariş durumunu takip etmesini ve servis sonrası puanlama yapmasını sağlar. Admin paneli ise restoran operasyonlarını, mutfak akışını, masa QR kodlarını, kategorileri, ürünleri, ekip kullanıcılarını, servis isteklerini, siparişleri ve müşteri geri bildirimlerini tek arayüzden yönetir.

## Öne Çıkanlar

- Tek restoran odaklı production modeli.
- Masa bazlı benzersiz `tableCode` değerleri ve QR menü linkleri.
- Kategori, ürün arama, ürün görselleri, sepet, ürün notu ve sipariş notu destekli public müşteri menüsü.
- Masa bazlı `localStorage` içinde saklanan güvenli `trackingCode` ile sipariş takibi.
- Sipariş durumları: `PENDING`, `PREPARING`, `READY`, `SERVED`, `CANCELLED`.
- Admin tarafından sipariş iptali ve müşteriye gösterilen iptal nedeni.
- Servis edilmiş siparişler için müşteri geri bildirimi: yemek, servis, hız, temizlik, genel puan ve isteğe bağlı yorum.
- Müşteri menüsünden garson çağırma ve hesap isteme.
- Bekleyen istekler, mutfak kartları, sipariş geçmişi, istek geçmişi ve puanlar için admin operasyon paneli.
- Masa, QR linki, kategori, ürün, restoran profili ve ekip kullanıcı yönetimi.
- Admin ürünler sekmesinde kategoriye göre filtreleme.
- Responsive admin arayüzü: desktop için tablo, mobil için kart görünümü.
- Mobil uyumlu admin navigasyonu ve kompakt kartlar.
- Türkçe, İngilizce, Almanca ve Arapça çoklu dil desteği.
- `ADMIN` ve `STAFF` rolleri.
- WebSocket ile canlı admin bildirimleri ve yedek polling yenilemesi.
- Admin panelinden etkinleştirilen bildirim sesi.
- JWT tabanlı auth, HttpOnly cookie desteği, Bearer token desteği ve CSRF koruması.
- Public müşteri endpointleri için basit rate limit.
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
- Spring Web
- Spring Security
- Spring Data JPA
- Spring WebSocket
- PostgreSQL 16
- Flyway
- Lombok
- Jakarta Validation
- JJWT
- Spring Boot Actuator
- Testler için H2

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

Tüm sistemi proje kök dizininden çalıştırmak için:

```powershell
copy .env.example .env
copy backend\.env.example backend\.env
docker compose up -d --build
```

Uygulama adresi:

```text
http://localhost:3000
```

Root Docker Compose yapısında frontend Nginx ile yayınlanır. Nginx `/api`, `/actuator` ve `/ws` isteklerini backend servisine proxy eder. Root compose dosyasında backend host portu dışarı açılmaz; uygulama normalde frontend origin üzerinden kullanılır.

## Ortam Değişkenleri

Kök `.env` dosyası PostgreSQL container için kullanılır:

```env
POSTGRES_DB=qr_menu
POSTGRES_USER=qr_menu
POSTGRES_PASSWORD=change-me
```

`backend/.env` backend servisi için kullanılır:

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

Frontend `.env` sadece API veya WebSocket origin’i frontend origin’inden farklıysa gerekir:

```env
VITE_API_BASE_URL=
VITE_WS_BASE_URL=
```

Local Vite geliştirmesinde `/api` ve `/ws` istekleri `vite.config.js` ile `localhost:8080` backendine proxy edilir. Docker production imajında aynı proxy görevini `frontend/nginx.conf` üstlenir.

## Backend Geliştirme

Backend compose yapısını çalıştırmak için:

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

Backend Maven ile lokal çalıştırılacaksa PostgreSQL erişilebilir olmalı ve `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` değerleri lokal veritabanına göre ayarlanmalıdır.

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

## Uygulama Route’ları

```text
GET http://localhost:3000/login
GET http://localhost:3000/admin
GET http://localhost:3000/menu/table/{tableCode}
GET http://localhost:8080/
GET http://localhost:8080/actuator/health
```

`/kitchen` artık ayrı bir ekran değildir. Mutfak operasyonları `/admin` paneli içinde yönetilir.

## Roller

`ADMIN` kullanıcıları:

- Restoran adını, telefonunu ve adresini düzenler.
- Masa ve QR linklerini yönetir.
- Kategori ve ürünleri yönetir.
- Ürünleri kategoriye göre filtreler.
- Kullanıcıları yönetir.
- Operasyon, mutfak, siparişler, servis istekleri ve puanları görür ve yönetir.

`STAFF` kullanıcıları:

- Operasyon panelini kullanır.
- Aktif siparişleri ve mutfak durumunu yönetir.
- Garson çağrılarını ve hesap isteklerini kapatır.
- Sipariş geçmişini, istek geçmişini ve puanları görür.
- Masa, menü, restoran ve ekip yönetimi sekmelerine erişemez.

## Tek Restoran Modu

Uygulama bilinçli olarak tek restoran üzerine tasarlanmıştır.

- Public restoran oluşturma kapalıdır.
- Restoran silme kapalıdır.
- Restoran admin arayüzünden pasife alınamaz.
- Backend restoran güncellemelerinde dışarıdan `active=false` gönderilse bile restoran aktif tutulur.

Bu davranış, tek restoranın ve tüm QR menü linklerinin yanlışlıkla çevrim dışı kalmasını engeller.

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
GET    /api/restaurants
GET    /api/restaurants/current
GET    /api/restaurants/public
GET    /api/restaurants/{id}
POST   /api/restaurants
PUT    /api/restaurants/{id}
DELETE /api/restaurants/{id}
```

Not: Tek restoran production modunda `POST /api/restaurants` ve `DELETE /api/restaurants/{id}` hata döner.

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
GET    /api/products?restaurantId={id}&categoryId={id}
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

1. Müşteri masa QR kodundan `{PUBLIC_BASE_URL}/menu/table/{tableCode}` adresini açar.
2. Backend `tableCode` ile masayı ve aktif menü içeriğini çözer.
3. Müşteri kategorileri gezer, ürün arar ve ürünleri sepete ekler.
4. Sipariş öncesinde ürün notu ve sipariş notu ekleyebilir.
5. `POST /api/orders` siparişi oluşturur ve güvenli bir `trackingCode` döner.
6. Frontend `trackingCode` değerini `qr_menu_table_orders:{tableCode}` anahtarıyla `localStorage` içinde saklar.
7. Müşteri sipariş durumunu `GET /api/orders/track/{trackingCode}` ile takip eder.
8. Sipariş iptal edilirse iptal nedeni müşteri ekranında gösterilir.
9. Sipariş servis edildiğinde müşteri puan ve yorum gönderebilir.

Müşteri ayrıca menü ekranından garson çağırabilir veya hesap isteyebilir. Bu istekler public endpointlerle oluşturulur ve admin paneline canlı bildirim olarak düşer.

## Sipariş Takibi ve localStorage

Müşteri sipariş takibi şu anahtarı kullanır:

```text
qr_menu_table_orders:{tableCode}
```

- Aktif tracking code’lar sayfa yenilendikten sonra tekrar yüklenir.
- `PENDING`, `PREPARING`, `READY` ve henüz puanlanmamış `SERVED` siparişler takipte kalır.
- `CANCELLED` siparişler ve puanlanmış `SERVED` siparişler local takipten kaldırılır.
- Gizli sekme, farklı cihaz veya farklı tarayıcı önceki takip verisine sahip olmayabilir.

## Admin Paneli

`/admin` paneli login gerektirir.

Admin bölümleri:

- Genel Bakış: metrikler, bekleyen servis istekleri ve mutfak kartları.
- Sipariş Geçmişi: kalem detayları ve iptal nedenleriyle tüm siparişler.
- İstek Geçmişi: garson çağrıları ve hesap istekleri.
- Puanlar: müşteri puanları ve yorumları.
- Masalar ve QR: masa listesi, QR linki ve QR kod/PDF modalı.
- Kategoriler: menü kategori yönetimi.
- Ürünler: kategori dropdown’ı ve kategori filtresiyle ürün yönetimi.
- Ekip: admin ve personel kullanıcıları.
- Restoran: restoran adı, telefon ve adres.

Admin paneli geniş ekranlarda tablo, mobil ekranlarda kart düzeni kullanır. WebSocket bağlantısı yoksa admin verileri yedek olarak 15 saniyede bir yenilenir.

## Çoklu Dil Desteği

Frontend şu dilleri destekler:

- Türkçe
- İngilizce
- Almanca
- Arapça

Dil seçimi hem admin panelini hem de müşteri menüsünü etkiler. Restoran adı, kategori adı, ürün adı, ürün açıklaması, notlar ve yorumlar gibi kullanıcı tarafından girilen veriler otomatik çevrilmez.

## WebSocket Bildirimleri

Canlı bildirimler şu akışla gelir:

```text
GET /api/auth/ws-ticket
ws://localhost:3000/ws/admin?ticket=...
```

WebSocket bağlantısı JWT’yi doğrudan URL’de taşımak yerine kısa ömürlü ticket kullanır. `AdminNotificationWebSocketHandler` ticket’ı doğrular, oturumu mevcut restoranla ilişkilendirir ve bildirimleri sadece ilgili restoran oturumlarına gönderir.

Backend bildirim event tipleri:

- `ORDER_CREATED`
- `WAITER_CALL_CREATED`
- `BILL_REQUEST_CREATED`
- `FEEDBACK_CREATED`

Bildirim teslimat hataları sipariş, istek veya geri bildirim oluşturma akışını bozmaz.

Tarayıcı ses politikaları nedeniyle admin kullanıcısının bildirim sesi için önce panelde `Sesi Aç` butonuna basması gerekir. Mobil sessiz mod, kilit ekranı veya arka plan sekmeleri sesi engelleyebilir.

## Auth, Cookie ve CSRF

Login sonrası backend JWT üretir:

- `qr_menu_token` HttpOnly cookie olarak set edilir.
- Frontend aynı token’ı API istekleri için `localStorage` içinde de saklar.
- Axios, token varsa `Authorization: Bearer <token>` header’ı gönderir.

CSRF davranışı:

- Bearer token ile gelen stateless istekler CSRF kontrolünden muaftır.
- Cookie-only mutasyonlarda `XSRF-TOKEN` cookie ve `X-XSRF-TOKEN` header’ı kullanılır.
- `/api/csrf` CSRF token üretir.
- Logout sırasında hem `qr_menu_token` hem de `XSRF-TOKEN` cookie’leri temizlenir.
- Public müşteri mutasyonları CSRF korumasından hariçtir: sipariş, feedback, garson çağrısı ve hesap isteği.

Public endpointler `PUBLIC_RATE_LIMIT_PER_MINUTE` ile sınırlandırılır.

## QR Link Mantığı

Her masanın benzersiz bir `tableCode` değeri vardır. QR linkleri şu formatı kullanır:

```text
{PUBLIC_BASE_URL}/menu/table/{tableCode}
```

Örnek:

```text
http://localhost:3000/menu/table/r1-t7-a1b2c3d4
```

`PUBLIC_BASE_URL` yanlışsa admin panelde üretilen QR linkleri yanlış domaini gösterebilir.

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

`JPA_DDL_AUTO=validate` önerilir. Şema değişiklikleri Flyway ile yönetilir.

## Demo Veri

Demo seed sadece şu ayar açıkken çalışır:

```env
SEED_ENABLED=true
```

Seeder şunları oluşturur:

- `QR Menü Restoranı`
- 8 masa ve QR kodları
- Başlangıç, ana yemek, içecek ve tatlı kategorileri
- Örnek ürünler
- Bir admin kullanıcısı

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

`backend/` içindeki compose dosyası backend portunu `${SERVER_PORT}:8080` olarak açar ve frontend build context’i için `../frontend` klasörünü kullanır.

## Production Kontrol Listesi

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

Production öncesi kontrol:

- `/actuator/health` `UP` dönüyor mu?
- `COOKIE_SECURE=true` mi?
- `JWT_SECRET` güçlü ve repository dışında mı?
- `CORS_ALLOWED_ORIGINS` sadece gerçek frontend domainini içeriyor mu?
- `PUBLIC_BASE_URL` QR menü domainiyle aynı mı?
- Admin login çalışıyor mu?
- Masa QR linkleri müşteri menüsünü açıyor mu?
- Sipariş oluşturma ve durum güncelleme çalışıyor mu?
- İptal nedeni müşteri ekranında görünüyor mu?
- Garson çağrısı ve hesap isteği admin paneline düşüyor mu?
- Servis sonrası feedback çalışıyor mu?
- WebSocket bildirimleri ve yedek polling çalışıyor mu?
- Bildirim sesi desktop ve mobilde test edildi mi?

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

- Production’da varsayılan `JWT_SECRET` kullanılmaz.
- Production’da `COOKIE_SECURE=true` kullanılmalıdır.
- Production’da `SEED_ENABLED=false` kullanılmalıdır.
- PostgreSQL public internete açılmamalıdır.
- CORS sadece gerçek frontend domainleriyle sınırlandırılmalıdır.
- Admin ve personel parolaları güçlü olmalıdır.
- `.env` dosyaları commit edilmemelidir.
- Public sipariş takibi tahmin edilebilir ID ile değil, `trackingCode` ile yapılır.
- WebSocket bağlantıları kısa ömürlü ticket kullanır; ticket tek kullanımlık tüketilir.

## Sorun Giderme

`docker compose up` çalışmıyor:

- Komutu `qr-menu/` kök dizininden çalıştırın.
- Sadece backend compose dosyasını kullanıyorsanız `backend/` dizininden çalıştırın.
- `.env` ve `backend/.env` dosyalarının var olduğundan emin olun.

Admin paneli 401 dönüyor:

- Login token süresi dolmuş olabilir; tekrar giriş yapın.
- `VITE_API_BASE_URL` doğru backend originini göstermelidir.
- `CORS_ALLOWED_ORIGINS` frontend originini içermelidir.

WebSocket bağlanmıyor:

- `/api/auth/ws-ticket` authenticated kullanıcı için çalışmalıdır.
- Reverse proxy `/ws` için `Upgrade` ve `Connection` header’larını geçirmelidir.
- HTTPS production ortamında `wss://` kullanılmalıdır.

Bildirim sesi çalmıyor:

- Admin panelde `Sesi Aç` butonuna basın.
- Mobil sessiz modu kontrol edin.
- Arka plan sekmeleri ve kilit ekranı tarayıcı sesini engelleyebilir.

Müşteri siparişi yenilemeden sonra görünmüyor:

- Aynı cihaz ve tarayıcıyı kullanın.
- Gizli sekmeler `localStorage` verisini kalıcı tutmayabilir.
- `CANCELLED` siparişler ve puanlanmış `SERVED` siparişler takipten kaldırılır.

QR linki yanlış domaini açıyor:

- `PUBLIC_BASE_URL` değerini kontrol edin.
- QR domain ayarı değiştiyse backend’i yeniden başlatın veya yeniden deploy edin.
