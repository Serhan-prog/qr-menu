# QR Menu

Spring Boot backend ve ileride React frontend icin ayrilmis QR menu projesi.

## Klasor Yapisi

```text
root/
├── backend/
└── frontend/
```

## Backend Calistirma

1. Docker servislerini baslatin:

```bash
cd backend
docker compose up --build
```

2. Lokal Maven ile calistirmak icin once PostgreSQL calistirin, sonra:

```bash
cd backend
./mvnw spring-boot:run
```

Windows PowerShell:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

API varsayilan olarak `http://localhost:8080` adresinde calisir.

## Temel Endpointler

- `GET/POST /api/restaurants`
- `GET/POST /api/tables`
- `GET/POST /api/categories`
- `GET/POST /api/products`
- `POST /api/orders`
- `PATCH /api/orders/{id}/status`
- `POST /api/waiter-calls`
- `POST /api/bill-requests`
- `GET /api/menu/table/{tableCode}`

Masa QR linki response icinde `qrUrl` alaniyla doner. `PUBLIC_BASE_URL` degiskeni frontend adresine gore ayarlanabilir.
