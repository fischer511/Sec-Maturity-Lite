# Sec-Maturity-Lite - MVP Status

## ✅ Implementirane funkcionalnosti

### Backend (FastAPI + Python)

#### 1. **Modeli in baza podatkov** ✅
- ✅ Users (uporabniki z RBAC - admin/manager/viewer)
- ✅ Organizations (organizacije)
- ✅ Assessments (ocene z različnimi statusi)
- ✅ AssessmentDomains (ocene po domenah)
- ✅ AssessmentAnswers (odgovori na vprašanja)
- ✅ AuditLogs (revizijske sledi)
- ✅ Alembic migracije za PostgreSQL

#### 2. **API Endpoints** ✅
- ✅ `/api/v1/auth/login` - prijava (z audit logom)
- ✅ `/api/v1/auth/me` - trenutni uporabnik
- ✅ `/api/v1/users/*` - upravljanje uporabnikov
- ✅ `/api/v1/orgs/*` - upravljanje organizacij
- ✅ `/api/v1/assessments/*` - CRUD za ocene
  - ✅ Create (z audit logom)
  - ✅ Save answers
  - ✅ Finalize (z audit logom)
  - ✅ Get recommendations
  - ✅ Export PDF (z audit logom)
- ✅ `/api/v1/audit/*` - branje revizijskih sledi
- ✅ `/api/v1/questions` - dostop do baze vprašanj

#### 3. **Servisi** ✅
- ✅ **questions.py** - 27 slovenskih vprašanj po 6 domenah (governance, asset, access, operations, incident, continuity)
- ✅ **scoring.py** - izračun ocen po domenah in skupne ocene (Likert 0-5, zaokroženo na 0.1)
- ✅ **recommendations.py** - YAML parser s safe evaluacijo (12 pravil, 2 na domeno)
- ✅ **pdf.py** - WeasyPrint za izvoz PDF poročil
- ✅ **audit.py** - centralizirano beleženje revizijskih dogodkov

#### 4. **Varnost** ✅
- ✅ JWT avtentikacija (HS256)
- ✅ Bcrypt hash za gesla
- ✅ RBAC vloge (admin, manager, viewer)
- ✅ Audit logging na kritičnih endpointih:
  - Login (uspeh + neuspeh)
  - Kreiranje ocen
  - Zaključevanje ocen
  - Izvoz PDF

#### 5. **Seed skripta** ✅
- ✅ Demo admin: `admin@example.com` / `Admin!234`
- ✅ Demo manager: `manager@demo.example.com` / `demo123`
- ✅ Demo organizacija: "Demo Corp"
- ✅ 2 zaključeni oceni z realističnimi podatki
- ✅ Audit logi za vse akcije

### Frontend (React + TypeScript + Vite)

#### 1. **Strani** ✅
- ✅ **LoginPage** - prijava z JWT
- ✅ **DashboardPage** - nadzorna plošča z:
  - LineChart (Recharts) - trend splošne ocene čez čas
  - RadarChart (Recharts) - zadnje ocene po domenah
  - Tabela ocen po domenah
  - Top 5 priporočil
- ✅ **AssessmentWizardPage** - večstopenjski čarovnik:
  - Navigacija po domenah s progress barom
  - Likert skala 0-5 (6 gumbov na vprašanje)
  - Polje za opombe (opcijsko)
  - Funkcije: Nazaj / Naprej / Shrani osnutek / Zaključi
- ✅ **AssessmentDetailPage** - podrobnosti ocene:
  - Skupna ocena (veliko)
  - RadarChart ocen po domenah
  - Tabela podrobnosti po domenah
  - Seznam priporočil z prioriteto
  - Prenos PDF poročila

#### 2. **Komponente** ✅
- ✅ shadcn-style UI (Card, Button, Input)
- ✅ Recharts grafi (LineChart, RadarChart)
- ✅ Responsive dizajn (Tailwind CSS)

#### 3. **State management** ✅
- ✅ Zustand store za avtentikacijo
- ✅ JWT token v localStorage
- ✅ Axios interceptor za avtomatsko dodajanje tokena

#### 4. **Routing** ✅
- `/login` - prijava
- `/dashboard` - nadzorna plošča
- `/assessments/new` - nova ocena (wizard)
- `/assessments/:id` - podrobnosti ocene
- `/` - redirect na `/dashboard`

### Docker ✅
- ✅ PostgreSQL 15 s health check
- ✅ Backend API (FastAPI + Uvicorn z hot reload)
- ✅ Frontend (Vite dev server)
- ✅ docker-compose.yml za celoten stack

---

## 📋 Izvršene naloge (od A do H)

### ✅ A. Vprašalnik (questions.py)
- 27 slovenskih vprašanj (5+5+5+4+4+4)
- 6 domen: governance, asset, access, operations, incident, continuity
- API endpoint: `/api/v1/questions`

### ✅ B. Scoring (preverjeno)
- Domain scores: povprečje odgovorov v domeni (0-5)
- Overall score: povprečje vseh domain scores (0-5)
- Zaokroženo na 0.1

### ✅ C. Priporočila (recommendations.yaml)
- 12 YAML pravil (2 na domeno)
- Safe evaluation (`score < N`)
- Prioriteta: high/medium/low

### ✅ D. Frontend čarovnik
- Multi-step navigacija po domenah
- Likert skala 0-5 (6 gumbov)
- Opombe (textarea)
- Shrani osnutek / Zaključi

### ✅ E. Dashboard grafi
- **LineChart** (Recharts) - trend splošne ocene čez čas (samo če > 1 ocena)
- **RadarChart** (Recharts) - zadnje ocene po domenah
- Top 5 priporočil

### ✅ F. PDF izvoz (preverjeno)
- WeasyPrint servis
- API endpoint: `/api/v1/assessments/{id}/pdf`
- Frontend gumb za prenos na detail strani

### ✅ G. RBAC in audit logging
- RBAC vloge: admin, manager, viewer
- Audit logs dodani na:
  - `auth.login` (success + failed)
  - `assessment.created`
  - `assessment.finalized`
  - `assessment.pdf_exported`
- Helper funkcija: `log_audit(db, action, actor_user, org_id, meta)`

### ✅ H. Seed skripta
- Admin + demo manager
- Demo organizacija
- 2 zaključeni oceni z različnimi rezultati
- Audit logi za vse akcije

---

## 🚀 Kako zagnati

### Predpogoji
- Docker Desktop
- Git

### Navodila

1. **Kloniraj repo** (če še ni):
```bash
cd c:\xampp\htdocs\Sec-Maturity-Lite
```

2. **Zaženi Docker Compose**:
```bash
docker-compose up --build
```

3. **Poženite migracije** (v novem terminalu):
```bash
docker-compose exec api alembic upgrade head
```

4. **Poženite seed** (opcijsko - za demo podatke):
```bash
docker-compose exec api python -m app.seed
```

5. **Dostopajte do aplikacije**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Demo računi
- **Admin**: `admin@example.com` / `Admin!234`
- **Manager**: `manager@demo.example.com` / `demo123`

---

## 📊 Struktura projekta

```
Sec-Maturity-Lite/
├── backend/
│   ├── app/
│   │   ├── api/          # API routers (auth, users, orgs, assessments, audit, questions)
│   │   ├── core/         # Config, security, database, deps
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic (scoring, recommendations, pdf, questions)
│   │   ├── utils/        # Audit helper
│   │   ├── rules/        # recommendations.yaml
│   │   ├── templates/    # Jinja2 templates za PDF
│   │   ├── main.py       # FastAPI app
│   │   └── seed.py       # Seed skripta
│   ├── alembic/          # Database migrations
│   ├── tests/            # Pytest tests
│   ├── requirements.txt  # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/   # UI komponente (Card, Button, Input)
│   │   ├── lib/          # API client (axios)
│   │   ├── pages/        # Login, Dashboard, Wizard, Detail
│   │   ├── store/        # Zustand store (auth)
│   │   ├── App.tsx       # Router
│   │   └── main.tsx      # Entry point
│   ├── package.json      # NPM dependencies
│   └── Dockerfile
├── deploy/
│   └── postgres/
│       └── init.sql      # DB init (opcijsko)
└── docker-compose.yml    # Orchestration
```

---

## ⏭️ Naslednji koraki (opcijsko)

### Še nepokrito iz MVP (manjše):
1. **RBAC enforcement** - pregled vseh endpointov za pravilno uporabo role-based guards
2. **Testi** - frontend Vitest testi (backend pytest že obstaja)
3. **Deployment** - produkcijska konfiguracija (Docker, env vars, secrets)

### Nove funkcionalnosti (za prihodnost):
- Seznam vseh ocen na dashboardu (table z datumi, statusom, rezultati)
- Urejanje osnutkov (draft assessments)
- Primerjava ocen (comparison view)
- Export v druge formate (Excel, JSON)
- Email obvestila
- Multi-tenancy izboljšave

---

## 🔧 Tehnologije

### Backend
- FastAPI 0.104+ (Python async web framework)
- SQLAlchemy 2.0 (ORM)
- Alembic (database migrations)
- Pydantic v2 (validation)
- PyJWT (JWT tokens)
- Passlib + Bcrypt (password hashing)
- WeasyPrint (PDF generation)
- PyYAML (YAML parsing)
- PostgreSQL 15 (database)

### Frontend
- React 18 (UI library)
- TypeScript 5.2 (type safety)
- Vite 5 (build tool)
- Tailwind CSS 3.3 (styling)
- Zustand 4.4 (state management)
- Recharts 2.10 (charts)
- Axios 1.6 (HTTP client)
- React Router 6 (routing)

### DevOps
- Docker + Docker Compose
- Hot reload (dev mode)
- Health checks

---

## 📝 Licenca

MIT (ali po vaši izbiri)

---

**MVP ZAKLJUČEN! 🎉**

Vsi 8 korakov (A-H) implementirani:
- ✅ 27 slovenskih vprašanj
- ✅ Scoring (domain + overall)
- ✅ 12 YAML priporočil
- ✅ Frontend wizard z Likert skalo
- ✅ Dashboard z Recharts grafi (LineChart, RadarChart)
- ✅ PDF izvoz
- ✅ RBAC + audit logging
- ✅ Seed skripta z demo podatki

Aplikacija je pripravljena za testiranje in lokalni razvoj!
