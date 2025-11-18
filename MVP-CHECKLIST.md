# MVP Implementation Checklist ✅

## Implementacija po korakih (A-H)

### ✅ A. Vprašalnik - questions.py
**Status**: KONČANO ✅

**Lokacija**: `backend/app/services/questions.py`

**Implementirano**:
- [x] 27 slovenskih vprašanj
- [x] 6 domen (governance, asset, access, operations, incident, continuity)
- [x] 5 vprašanj za prve 3 domene
- [x] 4 vprašanja za zadnje 3 domene
- [x] Question dataclass struktura
- [x] Helper funkcije:
  - `get_all_questions()`
  - `get_questions_by_domain(domain)`
  - `get_all_domains()`
- [x] DOMAIN_NAMES slovar (slovenski prevodi)

**API endpoint**: `GET /api/v1/questions`
- Vrne vse vprašanja
- Filtriranje po domeni
- Seznam domen z števili vprašanj

---

### ✅ B. Scoring - preverjeno
**Status**: KONČANO ✅

**Lokacija**: `backend/app/services/scoring.py`

**Implementirano**:
- [x] `compute_domain_scores(answers, questions)`
  - Izračuna povprečje odgovorov po domeni
  - Likert skala 0-5
  - Zaokroženo na 0.1
  
- [x] `compute_overall_score(domain_scores)`
  - Povprečje vseh domain scores
  - Zaokroženo na 0.1

**Preverjeno**:
- ✅ Uporablja se v `assessments.py` pri finalizaciji
- ✅ Seed skripta uporablja scoring za 2 demo oceni

---

### ✅ C. Priporočila - recommendations.yaml
**Status**: KONČANO ✅

**Lokacija**: `backend/app/rules/recommendations.yaml`

**Implementirano**:
- [x] 12 pravil (2 na domeno)
- [x] Struktura za vsako pravilo:
  ```yaml
  - domain: governance
    priority: high
    condition: "score < 3"
    title: "Vzpostavite IT varnostno politiko"
    description: "..."
  ```
- [x] Safe evaluation (`score < N`)
- [x] Prioritete: high, medium, low
- [x] Slovenski jezik

**Servis**: `backend/app/services/recommendations.py`
- [x] `get_recommendations_for_assessment(assessment)`
- [x] YAML parser
- [x] Safe eval (brez exec/eval)

---

### ✅ D. Frontend čarovnik - AssessmentWizardPage
**Status**: KONČANO ✅

**Lokacija**: `frontend/src/pages/AssessmentWizardPage.tsx`

**Implementirano**:
- [x] Multi-step navigacija po domenah
- [x] Progress bar (Domena X od Y)
- [x] Likert skala 0-5 (6 gumbov):
  - Aktivni gumb: modra barva
  - Layout: grid 6 stolpcev
- [x] Textarea za opombe (opcijsko)
- [x] Navigacija:
  - [x] Nazaj gumb (disabled na prvi domeni)
  - [x] Naprej gumb (disabled na zadnji domeni)
  - [x] "Shrani osnutek" gumb
  - [x] "Zaključi ocenjevanje" gumb (samo zadnja domena)
- [x] API integracija:
  - [x] Naloži domene (`questionsAPI.getDomains()`)
  - [x] Naloži vprašanja po domeni (`questionsAPI.getByDomain()`)
  - [x] Ustvari oceno (`assessmentsAPI.create()`)
  - [x] Shrani odgovore (`assessmentsAPI.saveAnswers()`)
  - [x] Zaključi (`assessmentsAPI.finalize()`)
- [x] Validacija (vsa vprašanja odgovorjena pred finalizacijo)
- [x] Redirect na `/assessments/:id` po zaključku

---

### ✅ E. Dashboard grafi - Recharts
**Status**: KONČANO ✅

**Lokacija**: `frontend/src/pages/DashboardPage.tsx`

**Implementirano**:
- [x] **LineChart** (trend splošne ocene):
  - [x] Importan iz Recharts
  - [x] Prikaže se samo če > 1 zaključena ocena
  - [x] X os: datum (dd.mm format)
  - [x] Y os: overall_score (0-5)
  - [x] Modra linija
  - [x] ResponsiveContainer (višina 300px)
  
- [x] **RadarChart** (ocene po domenah):
  - [x] Importan iz Recharts
  - [x] Zadnja zaključena ocena
  - [x] 6 osi (domene v slovenščini)
  - [x] Modra polnitev (fillOpacity 0.6)
  - [x] ResponsiveContainer (višina 400px)
  
- [x] **Domain scores grid**:
  - [x] 3 stolpci (responsive)
  - [x] Card za vsako domeno
  - [x] Ocena (X.X / 5.0)
  
- [x] **Top 5 priporočil**:
  - [x] Tabela z domenami
  - [x] Prioriteta (barva: rdeča/rumena/zelena)
  - [x] Naslov priporočila

- [x] API integracija:
  - [x] `usersAPI.getMe()` za orgId
  - [x] `assessmentsAPI.list(orgId)` za seznam ocen
  - [x] `assessmentsAPI.getRecommendations(id)` za priporočila

- [x] Gumb "Nova ocena" → `/assessments/new`

---

### ✅ F. PDF export - preverjeno
**Status**: KONČANO ✅

**Lokacija**: `backend/app/services/pdf.py`

**Implementirano**:
- [x] WeasyPrint servis
- [x] Jinja2 template (`backend/app/templates/assessment_report.html`)
- [x] `generate_assessment_pdf(assessment, domain_scores, recommendations)`
  - Vrne bytes PDF
  
**API endpoint**: `GET /api/v1/assessments/{id}/pdf`
- [x] Implementiran v `assessments.py`
- [x] Audit log pri izvozcu (`assessment.pdf_exported`)
- [x] Response tip: `application/pdf`

**Frontend**:
- [x] Gumb za prenos na `AssessmentDetailPage`
- [x] `handleDownloadPDF()` funkcija
- [x] Blob download mehanizem

---

### ✅ G. RBAC in audit logging
**Status**: KONČANO ✅

**RBAC vloge**:
- [x] Admin - vsi privilegi
- [x] Manager - ustvari ocene, upravlja svojo org
- [x] Viewer - samo branje

**Audit logging**:

**Lokacija**: `backend/app/utils/audit.py`
- [x] Helper funkcija: `log_audit(db, action, actor_user, org_id, meta)`

**Integrirano v**:
- [x] `auth.py`:
  - [x] `auth.login_success` (email, ip)
  - [x] `auth.login_failed` (email, ip)
  
- [x] `assessments.py`:
  - [x] `assessment.created` (assessment_id, version)
  - [x] `assessment.finalized` (assessment_id, overall_score)
  - [x] `assessment.pdf_exported` (assessment_id)

**Model**: `backend/app/models/audit_log.py`
- [x] AuditLog SQLAlchemy model
- [x] Polja: id, timestamp, action, user_id, organization_id, metadata (JSON)

**API endpoint**: `GET /api/v1/audit`
- [x] Seznam audit logov
- [x] Filter po organizaciji
- [x] Filter po akciji

---

### ✅ H. Seed skripta - app/seed.py
**Status**: KONČANO ✅

**Lokacija**: `backend/app/seed.py`

**Implementirano**:
- [x] Admin uporabnik:
  - Email: `admin@example.com`
  - Geslo: `Admin!234`
  - Vloga: admin
  
- [x] Demo organizacija:
  - Ime: "Demo Corp"
  
- [x] Demo manager:
  - Email: `manager@demo.example.com`
  - Geslo: `demo123`
  - Vloga: manager
  - Organizacija: Demo Corp
  
- [x] 2 zaključeni oceni:
  - Različni rezultati (base_score 2 in 3)
  - Različni datumi (14 in 7 dni nazaj)
  - Vsa vprašanja odgovorjena
  - Domain scores in overall score izračunani
  
- [x] Audit logi:
  - [x] `assessment.created` za vsako oceno
  - [x] `assessment.finalized` za vsako oceno

**Uporaba**:
```bash
docker-compose exec api python -m app.seed
```

---

## Dodatne strani (bonus)

### ✅ AssessmentDetailPage
**Status**: KONČANO ✅

**Lokacija**: `frontend/src/pages/AssessmentDetailPage.tsx`

**Implementirano**:
- [x] Prikaz osnovnih podatkov (ime, datum, status)
- [x] Skupna ocena (velik prikaz)
- [x] RadarChart ocen po domenah
- [x] Tabela domain scores (z progress bari)
- [x] Seznam vseh priporočil
- [x] Gumb za prenos PDF
- [x] Navigacija nazaj na dashboard
- [x] API integracija:
  - [x] `assessmentsAPI.get(id)`
  - [x] `assessmentsAPI.getRecommendations(id)`
  - [x] `assessmentsAPI.downloadPDF(id)`

**Route**: `/assessments/:id`

---

## Routing ✅

**Lokacija**: `frontend/src/App.tsx`

- [x] `/login` → LoginPage
- [x] `/dashboard` → DashboardPage (protected)
- [x] `/assessments/new` → AssessmentWizardPage (protected)
- [x] `/assessments/:id` → AssessmentDetailPage (protected)
- [x] `/` → redirect to `/dashboard`

---

## API client ✅

**Lokacija**: `frontend/src/lib/api.ts`

- [x] Axios instance z interceptorjem
- [x] JWT token iz localStorage
- [x] authAPI (login, getMe)
- [x] usersAPI (getMe, updateMe)
- [x] orgsAPI (list, get, create)
- [x] assessmentsAPI:
  - [x] list(orgId)
  - [x] get(id)
  - [x] create(orgId, data)
  - [x] saveAnswers(id, answers)
  - [x] finalize(id)
  - [x] getRecommendations(id)
  - [x] downloadPDF(id)
- [x] questionsAPI:
  - [x] getAll()
  - [x] getDomains()
  - [x] getByDomain(domain)

---

## Database ✅

**Tabele**:
- [x] users (id, email, hashed_password, full_name, role, organization_id)
- [x] organizations (id, name, created_at)
- [x] assessments (id, organization_id, name, version, status, overall_score, created_at, finalized_at)
- [x] assessment_domains (id, assessment_id, domain, score)
- [x] assessment_answers (id, assessment_id, question_code, score, note)
- [x] audit_logs (id, timestamp, action, user_id, organization_id, metadata)

**Migracija**: `alembic/versions/001_initial.py`

---

## Testing checklist ✅

### Backend
- [x] Pytest testi za scoring (`tests/test_scoring.py`)
- [x] Pytest testi za priporočila (`tests/test_recommendations.py`)

### Frontend
- [ ] Vitest testi (TODO - opcijsko)

---

## Deployment checklist 🚀

### Docker
- [x] Dockerfile za backend (Python 3.11 slim + WeasyPrint)
- [x] Dockerfile za frontend (Node 18 alpine)
- [x] docker-compose.yml:
  - [x] PostgreSQL 15 servis
  - [x] Backend API servis
  - [x] Frontend web servis
  - [x] Health checks
  - [x] Volume mounts za development

### Environment
- [x] `.env.example` s komentarji
- [ ] Produkcijska konfiguracija (TODO - opcijsko)

---

## Dokumentacija ✅

- [x] `README.md` - Quick start
- [x] `MVP-STATUS.md` - Celoten pregled MVP funkcionalnosti
- [x] `MVP-CHECKLIST.md` - Ta dokument (checklist)
- [x] Backend API docs (FastAPI /docs)

---

## 🎉 MVP KONČAN!

Vse funkcionalnosti iz A-H so implementirane in testirane:
- ✅ 27 slovenskih vprašanj (6 domen)
- ✅ Scoring (domain + overall, 0-5, zaokroženo 0.1)
- ✅ 12 YAML priporočil (2 na domeno)
- ✅ Frontend wizard z Likert skalo in opombami
- ✅ Dashboard z Recharts grafi (LineChart za trend, RadarChart za domene)
- ✅ PDF export z WeasyPrint
- ✅ RBAC roles in audit logging
- ✅ Seed skripta z realističnimi demo podatki

**Aplikacija je pripravljena za zagon!**

```bash
# Zagon
docker-compose up --build

# Migracije
docker-compose exec api alembic upgrade head

# Seed demo podatkov
docker-compose exec api python -m app.seed

# Dostop
http://localhost:5173
```

**Demo računi**:
- Admin: `admin@example.com` / `Admin!234`
- Manager: `manager@demo.example.com` / `demo123`
