# Copilot Chat — Repo spec za Sec‑Maturity‑Lite

**Vloga**: Deluj kot arhitekt in glavni developer (full-stack). Postavi celoten monorepo in izgeneriraj začetno delujočo kodo za M1 (MVP) verzijo v 10 dneh.

## Cilj produkta
- **Ime**: Sec‑Maturity‑Lite
- **Namen**: SaaS orodje za samooceno kibernetske zrelosti (osnove NIS2 / ISO 27001)
- **Potek**: organizacija izpolni vprašalnik → izračun (0–5) po domenah → dashboard z trendi → avtomatska priporočila → export PDF
- **RBAC**: Admin, Manager, Viewer
- **Features**: Audit log, Anonymized demo mode

## Tech Stack
- **Backend**: Python 3.11, FastAPI, SQLAlchemy, Alembic, Pydantic v2, Uvicorn, PyJWT, bcrypt
- **Frontend**: React + Vite, TypeScript, Tailwind CSS, shadcn/ui, Zustand, Recharts
- **PDF**: WeasyPrint (server-side, Jinja2 templating)
- **DB**: PostgreSQL 15
- **Packaging**: Docker Compose
- **Tests**: pytest (backend), Vitest + React Testing Library (frontend)
- **Lint/format**: ruff & black (Python), eslint & prettier (TypeScript)

## Data Model (SQLAlchemy)

### User
- id: UUID (PK)
- email: str (unique)
- password_hash: str
- role: enum('admin', 'manager', 'viewer')
- org_id: UUID (FK -> Org.id, nullable)
- created_at: datetime

### Org
- id: UUID (PK)
- name: str
- created_at: datetime

### Assessment
- id: UUID (PK)
- org_id: UUID (FK -> Org.id)
- created_by: UUID (FK -> User.id)
- version: int
- assessed_at: datetime
- overall_score: float

### AssessmentDomain
- id: UUID (PK)
- assessment_id: UUID (FK -> Assessment.id)
- domain: str
- score: float

### AssessmentAnswer
- id: UUID (PK)
- assessment_id: UUID (FK -> Assessment.id)
- domain: str
- question_code: str
- score: int (0..5)
- note: text (optional)

### AuditLog
- id: UUID (PK)
- actor_user_id: UUID (FK -> User.id, nullable)
- org_id: UUID (FK -> Org.id, nullable)
- action: str
- meta: JSON
- created_at: datetime

## API Endpoints (/api/v1)

### Auth
- `POST /auth/login` → { access_token, token_type }
- `GET /auth/me` → current user

### Users
- `POST /users` (admin) → create user
- `GET /users/me`
- `PATCH /users/me`

### Orgs
- `POST /orgs` (admin)
- `GET /orgs/:id`
- `GET /orgs` (admin list)
- `PATCH /orgs/:id`

### Assessments
- `POST /orgs/:org_id/assessments`
- `GET /orgs/:org_id/assessments`
- `GET /assessments/:id`
- `POST /assessments/:id/answers`
- `POST /assessments/:id/finalize`
- `GET /assessments/:id/pdf`
- `GET /assessments/:id/recommendations`

### Audit
- `GET /audit` (admin)

## Services

### scoring.py
- `compute_domain_scores(answers)` → dict[domain->float]
- `compute_overall_score(domain_scores)` → float
- Values: 0–5, rounded to 0.1

### recommendations.py
- Load YAML rules from `app/rules/recommendations.yaml`
- Parse simple comparisons: `score < N`
- Return list of matched recommendations

### pdf.py
- Render Jinja2 HTML → PDF (WeasyPrint)
- Include: org name, date, radar chart, domain scores, recommendations

### seed.py
- Create admin user
- Create demo org with sample assessments

## Recommendation YAML Example

```yaml
governance:
  - if: "score < 3"
    then:
      id: GOV-01
      title: "Vzpostavi ISMS jedro"
      details: "Politika, vloge, register sredstev, ocena tveganj."
access:
  - if: "score < 3"
    then:
      id: ACC-02
      title: "Uvedi MFA za kritične sisteme"
      details: "MFA za VPN, admin, e-pošto."
```

## Frontend Pages
- `/login`
- `/dashboard` (overall score, domain cards, recent assessments)
- `/assessments/new` (wizard: 6 domains → questions, Likert 0–5)
- `/assessments/:id` (view assessment, charts, recommendations, export PDF)
- `/admin/audit`
- `/demo` (create demo org + sample data)

## UI Components (shadcn/ui)
- Card, Button, Input, Select, Textarea, Tabs, Table, Dialog, Toast
- Charts: LineChart, RadarChart, BarChart (Recharts)

## Security
- JWT in `Authorization: Bearer <token>`
- Password hashing: bcrypt
- CORS: allow frontend origin
- Rate-limit: auth endpoints (per IP)

## Docker Compose
- **db**: postgres:15
- **api**: FastAPI app (port 8000)
- **web**: Vite dev server (port 5173)

## Acceptance Criteria (M1)
- Docker Compose starts all services
- Admin user seeded
- Login works (JWT)
- Create org, assessment, POST answers, finalize
- Domain & overall scores computed
- Recommendations returned
- PDF export works
- Basic frontend pages functional
- Unit tests pass (scoring, recommendations)

## Run Instructions
1. `Copy-Item .env.example .env`
2. `docker-compose up --build`
3. `docker-compose exec api alembic upgrade head`
4. `docker-compose exec api python -m app.seed`
5. Open http://localhost:5173
