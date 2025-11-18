# Sec-Maturity-Lite

SaaS orodje za samooceno kibernetske zrelosti (NIS2/ISO 27001 osnove). Organizacije rešijo vprašalnik → izračun stanja (0–5) po domenah → dashboard s trendi → avtomatska priporočila → export PDF.

## Tech Stack

- **Backend**: FastAPI, Python 3.11, SQLAlchemy, Alembic, PostgreSQL, Pydantic v2, Uvicorn, JWT
- **Frontend**: React + Vite, TypeScript, Tailwind CSS, shadcn/ui, Zustand, Recharts
- **PDF Export**: WeasyPrint (server-side)
- **Packaging**: Docker Compose

## 🚀 Quick Start (Lokalni zagon)

### Predpogoji
- Docker Desktop instaliran in zagnan
- Docker Compose na voljo

### Koraki za hitri zagon

#### 1️⃣ Kopiraj .env datoteko
```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```bash
# Linux/Mac
cp .env.example .env
```

**Opcijsko**: Uredi `.env` in nastavi svoje skrivnosti (JWT_SECRET, gesla).

#### 2️⃣ Zagon vseh servisov
```powershell
docker-compose up --build
```

To bo zagnalo:
- PostgreSQL (port 5432)
- Backend API (port 8000)
- Frontend (port 5173)

#### 3️⃣ Migracije baze (v novem terminalu)
```powershell
docker-compose exec api alembic upgrade head
```

#### 4️⃣ Seed demo podatkov
```powershell
docker-compose exec api python -m app.seed
```

To ustvari:
- Admin uporabnika
- Demo organizacijo
- Demo manager uporabnika
- 2 zaključeni oceni z realističnimi podatki

#### 5️⃣ Dostop do aplikacije

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Dokumentacija**: http://localhost:8000/docs (Swagger UI)

#### 6️⃣ Prijava

Uporabi demo račun:
- **Email**: `admin@example.com`
- **Geslo**: `Admin!234`

**Alternative credentials** (manager role):
- **Email**: `manager@demo.example.com`
- **Geslo**: `demo123`

---

### ⚡ Hitri ukazi

```powershell
# Zagon
docker-compose up --build

# Stop
docker-compose down

# Stop + izbrisi volume (reset baze)
docker-compose down -v

# Preglej loge
docker-compose logs -f api
docker-compose logs -f web

# Vstopi v backend container
docker-compose exec api bash

# Poženi backend teste
docker-compose exec api pytest -v
```

## Project Structure

```
sec-maturity-lite/
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── api/       # API routers
│   │   ├── core/      # Config, security, dependencies
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── services/  # Business logic
│   │   ├── rules/     # Recommendation rules (YAML)
│   │   └── main.py
│   ├── alembic/       # Database migrations
│   └── tests/         # Pytest tests
├── frontend/          # React + Vite app
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── store/     # Zustand state
│       └── lib/
└── deploy/            # Docker Compose setup
```

## Development

### Backend

Run tests:
```powershell
docker-compose exec api pytest
```

Format code:
```powershell
docker-compose exec api black app/
docker-compose exec api ruff check app/
```

Create migration:
```powershell
docker-compose exec api alembic revision --autogenerate -m "description"
```

### Frontend

Install dependencies locally (optional, for IDE):
```powershell
cd frontend
npm install
```

Run tests:
```powershell
docker-compose exec web npm test
```

Format code:
```powershell
docker-compose exec web npm run lint
docker-compose exec web npm run format
```

## Features (M1 MVP)

- ✅ User authentication (JWT)
- ✅ RBAC: Admin, Manager, Viewer
- ✅ Organizations management
- ✅ Assessment questionnaire (6 domains, 24 questions)
- ✅ Scoring: domain scores (0-5) + overall score
- ✅ Trend tracking over time
- ✅ Recommendations engine (YAML rules)
- ✅ PDF export
- ✅ Audit log
- ✅ Demo mode (anonymized sample data)

## API Documentation

Full API documentation available at http://localhost:8000/docs after starting the services.

## Domains

1. **Governance** - ISMS policies, roles, risk management
2. **Asset Management** - Inventory, classification
3. **Access Control** - Authentication, authorization, MFA
4. **Operations & Monitoring** - Logging, monitoring, patch management
5. **Incident Response** - Detection, response, recovery
6. **Business Continuity** - Backup, DR, BCP

## License

Proprietary - All rights reserved
