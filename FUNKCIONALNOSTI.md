# Sec-Maturity-Lite - Pregled Funkcionalnosti

**Datum:** 18. november 2025  
**Verzija:** 1.0  
**Tip aplikacije:** Platforma za upravljanje varnostne zrelosti organizacij

---

## 📋 Kazalo

1. [Splošen pregled](#splošen-pregled)
2. [Avtentikacija in uporabniki](#avtentikacija-in-uporabniki)
3. [Dashboard](#dashboard)
4. [Ocene varnostne zrelosti](#ocene-varnostne-zrelosti)
5. [Domene varnosti](#domene-varnosti)
6. [Priporočila](#priporočila)
7. [Akcijski načrti (Ukrepi)](#akcijski-načrti-ukrepi)
8. [Naloge (Tasks)](#naloge-tasks)
9. [Knjižnica dokumentov](#knjižnica-dokumentov)
10. [Poročila in izvoz](#poročila-in-izvoz)
11. [Organizacije in ekipe](#organizacije-in-ekipe)
12. [Nastavitve](#nastavitve)

---

## Splošen pregled

**Sec-Maturity-Lite** je celovita spletna aplikacija za upravljanje varnostne zrelosti organizacij. Omogoča:
- Izvajanje in sledenje varnostnim ocenam
- Generiranje priporočil za izboljšave
- Upravljanje nalog in rokov
- Sledenje napredku v času
- Upravljanje dokazne dokumentacije

**Tehnologije:**
- **Backend:** FastAPI, PostgreSQL, SQLAlchemy, Alembic
- **Frontend:** React 18.2, TypeScript, Vite, Tailwind CSS
- **Deployment:** Docker Compose

---

## Avtentikacija in uporabniki

### Funkcionalnosti:
- **Prijava (Login):** JWT avtentikacija s HTTP-only cookies
- **Registracija:** Samooskrba za nove uporabnike
- **Vloge uporabnikov:**
  - **Admin:** Polni dostop do sistema
  - **Manager:** Upravljanje ocen in ekip
  - **Analyst:** Izvajanje ocen in pregled rezultatov
  - **Viewer:** Samo branje, brez urejanja

### Varnostne značilnosti:
- Kriptiranje gesel z bcrypt
- Session management
- Role-based access control (RBAC)
- Povezava uporabnika z organizacijo

**Strani:**
- `/login` - Prijava
- `/register` - Registracija
- `/profile` - Uporabniški profil

---

## Dashboard

### Glavne funkcionalnosti:
1. **Pregled organizacije**
   - Število aktivnih ocen
   - Skupna ocena zrelosti (0-100%)
   - Status poslednje ocene

2. **Radar graf domen**
   - Vizualizacija ocene vseh 10 varnostnih domen
   - Interaktiven prikaz z oznakami v slovenščini
   - Barvno kodiran glede na stopnjo zrelosti

3. **Trend zrelosti**
   - Graf trenda ocen skozi čas
   - Primerjava trenutne vs. prejšnje ocene
   - Izračun spremembe (∆%)

4. **Filtriranje po ekipah**
   - Dropdown za izbiro ekipe
   - Prikaz ocen le izbrane ekipe

5. **Hitra navigacija**
   - Gumbi za novo oceno
   - Povezava do priporočil
   - Dostop do akcijskega načrta

**Stran:** `/dashboard`

---

## Ocene varnostne zrelosti

### Assessment Wizard (Čarovnik za ocenjevanje)

**Funkcionalnosti:**
1. **Korak 1 - Osnove:**
   - Izbira organizacije
   - Izbira ekipe (opcijsko)
   - Vnos imena ocene
   - Vnos datuma ocenjevanja

2. **Korak 2-11 - Domene:**
   - 10 varnostnih domen (vsaka z lastno stranjo)
   - Prevodi imen domen v slovenščino:
     - Upravljanje in tveganja
     - Politike
     - Upravljanje sredstev
     - Nadzor dostopa
     - Spremljanje in beleženje
     - Odziv na incidente
     - Poslovna kontinuiteta
     - Ozaveščanje in usposabljanje
     - IT/OT varnost
     - Zasebnost in zakonodaja

3. **Vprašanja:**
   - Dinamično nalaganje vprašanj za vsako domeno
   - Odgovori na lestvici 0-4:
     - 0 = Ni implementirano
     - 1 = Osnovno
     - 2 = Upravljano
     - 3 = Definirano
     - 4 = Optimizirano
   - Možnost vnosa komentarjev
   - Napredek v odstotkih

4. **Korak 12 - Pregled:**
   - Povzetek vseh odgovorov
   - Ocena po domenah
   - Skupna ocena (overall_score)
   - Gumb za dokončanje

**Dodatne funkcionalnosti:**
- **CSV Uvoz:** Hitro nalaganje odgovorov iz CSV datoteke
- **Shranjevanje osnutkov:** Avtomatsko shranjevanje med procesom
- **Navigacija:** Nazaj/Naprej med domenami
- **Validacija:** Preverjanje vnosov pred dokončanjem

**Strani:**
- `/assessments/new` - Nov assessment wizard
- `/assessments` - Seznam vseh ocen
- `/assessments/:id` - Podrobnosti ocene
- `/assessments/:id/domains/:domain` - Ocenjevanje specifične domene
- `/imports` - CSV uvoz

---

## Domene varnosti

### 10 Varnostnih domen

Vsaka domena predstavlja ključno področje informacijske varnosti:

1. **Upravljanje in tveganja (Governance & Risk)**
   - Politike upravljanja
   - Upravljanje tveganj
   - Skladnost s predpisi

2. **Politike (Policies)**
   - Varnostne politike
   - Postopki in navodila
   - Dokumentacija

3. **Upravljanje sredstev (Asset Management)**
   - Inventar IT sredstev
   - Življenjski cikel sredstev
   - Varovanje podatkov

4. **Nadzor dostopa (Access Control)**
   - Upravljanje identitet
   - Avtentikacija in avtorizacija
   - Privilegirani dostopi

5. **Spremljanje in beleženje (Monitoring & Logging)**
   - SIEM sistemi
   - Log management
   - Alarmiranje

6. **Odziv na incidente (Incident Response)**
   - Proces obravnave incidentov
   - Komunikacijski načrt
   - Post-incident analiza

7. **Poslovna kontinuiteta (Business Continuity)**
   - BCP načrti
   - Disaster recovery
   - Testiranje načrtov

8. **Ozaveščanje in usposabljanje (Awareness & Training)**
   - Varnostno usposabljanje
   - Phishing simulacije
   - Kampanje ozaveščanja

9. **IT/OT varnost (IT/OT Security)**
   - Omrežna varnost
   - Varovanje končnih točk
   - Industrijske kontrolne sisteme

10. **Zasebnost in zakonodaja (Privacy & Legal)**
    - GDPR skladnost
    - Varstvo osebnih podatkov
    - Pravne obveznosti

**Strani:**
- `/assessment/domains` - Pregled vseh domen
- `/assessment/domains/:code` - Podrobnosti domene

---

## Priporočila

### Funkcionalnosti:

1. **Avtomatsko generiranje**
   - Na podlagi rezultatov zadnje zaključene ocene
   - Priporočila za vsako domeno

2. **Podatki o priporočilih:**
   - ID priporočila (npr. GOV-01)
   - Domena
   - Opis problema
   - Priporočeni ukrepi
   - Prioriteta (Critical/High/Medium/Low)

3. **Prikaz:**
   - Seznam vseh priporočil
   - Barvno kodiranje po prioriteti
   - Filtriranje po domenah
   - Iskanje po ključnih besedah

4. **Povezava z nalogami:**
   - Možnost ustvarjanja naloge iz priporočila
   - Sledenje implementaciji

**Stran:** `/reports/recommendations`

---

## Akcijski načrti (Ukrepi)

### Tri stopnje prioritet:

1. **Kritični ukrepi** (`/actions/critical`)
   - Visoka (High) in Kritična (Critical) prioriteta
   - Takojšnje ukrepanje potrebno
   - Rdeča signalizacija

2. **Srednji ukrepi** (`/actions/medium`)
   - Srednja (Medium) prioriteta
   - Pomembni za izboljšanje varnosti
   - Rumena signalizacija

3. **Nizki ukrepi** (`/actions/low`)
   - Nizka (Low) prioriteta
   - Dolgoročne izboljšave
   - Zelena signalizacija

### Prikaz nalog:
- Naslov naloge
- Status (Todo/In Progress/Completed)
- Dodeljen uporabnik (Assignee)
- Rok (Deadline) z opozorilom če je zamujeno
- Povezava do priporočila

### Časovnica (`/actions/timeline`)
- Q1-Q4 razporeditev
- Prioritizacija po časovnih okvirjih
- Vizualni prikaz načrta izvajanja

**Strani:**
- `/actions/critical` - Kritični ukrepi
- `/actions/medium` - Srednji ukrepi
- `/actions/low` - Nizki ukrepi
- `/actions/timeline` - Časovnica

---

## Naloge (Tasks)

### Sistem upravljanja nalog:

1. **Ustvarjanje nalog:**
   - Iz priporočil (gumb "Ustvari nalogo")
   - Ročno vnos nove naloge

2. **Podatki o nalogi:**
   - Naslov
   - Opis
   - Povezava s priporočilom (recommendation_id)
   - Povezava z oceno (assessment_id)
   - Prioriteta (Critical/High/Medium/Low)
   - Status (Todo/In Progress/Completed)
   - Dodeljen uporabnik (assignee_id)
   - Ustvaril (created_by)
   - Rok (due_date)
   - Datumi (created_at, updated_at)

3. **Sledenje stanju:**
   - 51 realističnih testnih nalog v bazi
   - 39 zamujenih nalog
   - Raznolike prioritete in statusi
   - Povezave z dejanskimi priporočili

4. **API endpoints:**
   - `GET /api/v1/tasks` - Seznam z filtriranjem
   - `POST /api/v1/tasks` - Nova naloga
   - `GET /api/v1/tasks/{id}` - Podrobnosti
   - `PATCH /api/v1/tasks/{id}` - Posodobitev
   - `DELETE /api/v1/tasks/{id}` - Brisanje

**Database model:**
```python
class RemediationTask:
    id: UUID
    assessment_id: UUID
    recommendation_id: str (optional)
    title: str
    description: str
    priority: TaskPriority
    status: TaskStatus
    assignee_id: UUID
    created_by: UUID
    due_date: datetime
    created_at: datetime
    updated_at: datetime
```

---

## Knjižnica dokumentov

### Popoln sistem upravljanja dokazne dokumentacije

**Funkcionalnosti:**

1. **Upload dokumentov:**
   - Podpora za vse vrste datotek
   - Maksimalna velikost: 50 MB
   - Drag & drop vmesnik
   - Avtomatska pretvorba imen datotek v UUID

2. **Kategorije dokumentov:**
   - Policy (Politike)
   - Procedure (Postopki)
   - Certificate (Certifikati)
   - Contract (Pogodbe)
   - Audit Report (Revizijska poročila)
   - Risk Assessment (Ocene tveganj)
   - Network Diagram (Omrežni diagrami)
   - Log (Dnevniki)
   - Other (Drugo)

3. **Metadata:**
   - Naslov dokumenta
   - Kategorija
   - Opis (opcijsko)
   - Oznake (tags)
   - Povezava z oceno (assessment_id)
   - Povezava z domeno (domain)
   - Verzioniranje (parent_id za revizije)
   - Naložil uporabnik (uploaded_by)
   - Datum nalaganja

4. **Iskanje in filtriranje:**
   - Polnotekstovno iskanje (title, description, filename, tags)
   - Filter po kategoriji
   - Filter po oceni
   - Filter po domeni
   - Sortiranje po datumu

5. **Akcije:**
   - Prenos dokumenta (download)
   - Brisanje dokumenta
   - Posodobitev metapodatkov
   - Pregled podrobnosti

6. **UI komponente:**
   - Moderne kartice z informacijami
   - Upload dialog z validacijo
   - Search bar
   - Category dropdown filter
   - File size formater (B/KB/MB)
   - Ikone za različne tipe datotek

**Shramba datotek:**
- Pot: `/app/uploads/{org_id}/{uuid}.{ext}`
- Unikatna imena (UUID4)
- Organizirana po organizacijah
- Varna shramba izven webroot-a

**API endpoints:**
- `POST /api/v1/documents` - Upload (multipart/form-data)
- `GET /api/v1/documents` - Seznam z filtriranjem
- `GET /api/v1/documents/{id}` - Metadata
- `GET /api/v1/documents/{id}/download` - Prenos datoteke
- `PATCH /api/v1/documents/{id}` - Posodobitev
- `DELETE /api/v1/documents/{id}` - Brisanje

**Database model:**
```python
class Document:
    id: UUID
    org_id: UUID
    assessment_id: UUID (optional)
    domain: str (optional)
    title: str
    category: DocumentCategory
    description: str (optional)
    tags: List[str]
    filename: str (original)
    file_path: str (UUID storage)
    file_size: int (bytes)
    mime_type: str
    uploaded_by: UUID
    parent_id: UUID (optional, for versioning)
    created_at: datetime
    updated_at: datetime
```

**Stran:** `/evidence/documents`

---

## Poročila in izvoz

### Funkcionalnosti:

1. **Export v CSV:**
   - Izvoz podatkov ocene
   - Vključno z odgovori in ocenami
   - Primerno za nadaljnjo analizo

2. **Export v PDF:**
   - Profesionalno formatirana poročila
   - Vključno z grafi in tabelami
   - Logo organizacije

3. **Zgodovina poročil:**
   - Seznam generiranih poročil
   - Datum generiranja
   - Prenos arhiviranih poročil

4. **Tipi poročil:**
   - Executive Summary
   - Detailed Assessment Report
   - Priporočila (Recommendations)
   - Action Plan

**Strani:**
- `/reports/export` - Generiranje poročil
- `/reports/history` - Zgodovina

---

## Organizacije in ekipe

### Organizacije:

**Funkcionalnosti:**
- Upravljanje več organizacij (multi-tenancy)
- Podatki organizacije:
  - Ime
  - Kontaktne informacije
  - Logo (branding)
  - Nastavitve

**Ekipe:**
- Organizacija lahko ima več ekip
- Ekipe omogočajo segmentacijo:
  - IT ekipa
  - HR ekipa
  - Finance ekipa
  - itd.
- Filtriranje ocen po ekipah
- Dodeljevanje nalog ekipam

**Strani:**
- `/organizations` - Seznam organizacij
- `/teams` - Upravljanje ekip

---

## Nastavitve

### Kategorije nastavitev:

1. **Podatki podjetja** (`/settings/company`)
   - Ime organizacije
   - Davčna številka
   - Naslov
   - Kontaktne informacije
   - Gumb za shranjevanje

2. **Blagovna znamka** (`/settings/branding`)
   - Upload logotipa
   - Primarne barve
   - Sekundarne barve
   - Font preferences
   - Predogled sprememb

3. **Uporabniki in dovoljenja:**
   - Upravljanje uporabniških računov
   - Dodeljevanje vlog
   - Deaktivacija uporabnikov

4. **Integracije:**
   - API ključi
   - Webhook nastavitve
   - Zunanje storitve

**Strani:**
- `/settings/company` - Podatki podjetja
- `/settings/branding` - Blagovna znamka

---

## Dodatne funkcionalnosti

### Evidence strani (Demo funkcionalnost):

Štiri strani za upravljanje različnih vrst dokazov:

1. **Politike** (`/evidence/policies`)
   - Repozitorij varnostnih politik

2. **Postopki** (`/evidence/procedures`)
   - Operativni postopki in navodila

3. **Omrežni diagrami** (`/evidence/network`)
   - Omrežne arhitekture in topologije

4. **Dnevniki** (`/evidence/logs`)
   - Varnostni dnevniki in zapisi

**Opomba:** Te strani trenutno prikazujejo demo vsebino. Realna funkcionalnost nalaganja dokumentov je implementirana v `/evidence/documents`.

### Demo podatki:

**Seed script (`backend/scripts/seed_realistic_data.py`):**
- 51 realističnih nalog
- 39 zamujenih nalog
- Raznolike prioritete in statusi
- Povezave s priporočili (GOV-01, ACC-01, OPS-01, itd.)
- Realistični datumi (od -30 do +60 dni)
- Raznolikost statusov:
  - 40% Todo
  - 40% In Progress
  - 20% Completed

---

## Tehnične lastnosti

### Backend arhitektura:

**FastAPI struktura:**
```
backend/
├── app/
│   ├── api/          # API endpoints
│   │   ├── assessments.py
│   │   ├── tasks.py
│   │   ├── documents.py
│   │   ├── recommendations.py
│   │   └── ...
│   ├── models/       # SQLAlchemy modeli
│   │   ├── assessment.py
│   │   ├── task.py
│   │   ├── document.py
│   │   └── ...
│   ├── schemas/      # Pydantic schemas
│   ├── core/         # Config, security
│   └── main.py       # FastAPI app
├── alembic/          # Database migrations
└── scripts/          # Utility scripts
```

**Ključne značilnosti:**
- RESTful API
- JWT avtentikacija
- CORS podpora
- Validation (Pydantic)
- ORM (SQLAlchemy)
- Migrations (Alembic)
- Dependency injection
- Error handling

### Frontend arhitektura:

**React struktura:**
```
frontend/
├── src/
│   ├── pages/           # Route komponente
│   │   ├── assessment/  # Assessment strani
│   │   ├── actions/     # Actions strani
│   │   ├── evidence/    # Evidence strani
│   │   ├── reports/     # Reports strani
│   │   ├── users/       # User strani
│   │   └── settings/    # Settings strani
│   ├── components/      # Ponovno uporabljive komponente
│   │   └── ui/         # shadcn/ui komponente
│   ├── lib/            # Utility funkcije
│   ├── api.ts          # API client
│   ├── store.ts        # Zustand state management
│   └── App.tsx         # Main app component
└── public/             # Static assets
```

**Ključne značilnosti:**
- TypeScript za type safety
- Vite za hitro razvijanje
- React Router za routing
- Zustand za state management
- Axios za HTTP requests
- Tailwind CSS za styling
- shadcn/ui komponente
- Recharts za grafe

### Baza podatkov:

**PostgreSQL tabele:**
- users
- organizations
- teams
- assessments
- assessment_domains
- questions
- answers
- recommendations
- remediation_tasks
- documents

**Relacije:**
- User -> Organization (many-to-one)
- Assessment -> Organization (many-to-one)
- Assessment -> Team (many-to-one, optional)
- Task -> Assessment (many-to-one)
- Task -> Recommendation (many-to-one, optional)
- Document -> Organization (many-to-one)
- Document -> Assessment (many-to-one, optional)

---

## Varnostne značilnosti

1. **Avtentikacija:**
   - JWT tokens
   - HTTP-only cookies
   - Secure session management

2. **Avtorizacija:**
   - Role-based access control (RBAC)
   - Organization isolation
   - Permission checks na API level

3. **Validacija:**
   - Input validation (Pydantic)
   - XSS protection
   - SQL injection protection (ORM)

4. **File upload varnost:**
   - MIME type validation
   - File size limits (50MB)
   - Virus scanning možnost
   - Secure storage paths

5. **CORS:**
   - Konfiguriran za specifične origine
   - Credentials support

---

## Uporabniški vmesnik

### Design principi:

1. **Profesionalni izgled:**
   - Brez nepotrebnih emojijev ✅
   - Čiste barve
   - Dosledna tipografija
   - Shadcn/ui komponente

2. **Slovenščina:**
   - Vsi teksti v slovenščini
   - Prevodi domen
   - Lokalizirani datumi

3. **Responsive design:**
   - Mobile-friendly
   - Tablet optimizacija
   - Desktop full experience

4. **Accessibility:**
   - Semantic HTML
   - ARIA labels
   - Keyboard navigation

5. **UX optimizacije:**
   - Loading states
   - Error messages
   - Success notifications
   - Intuitivna navigacija

---

## Deployment

### Docker Compose setup:

**Servisi:**
1. **db** - PostgreSQL database
2. **api** - FastAPI backend
3. **web** - Vite dev server (frontend)

**Volumes:**
- PostgreSQL data persistence
- Upload files storage
- Node modules

**Networking:**
- Internal network za servis komunikacijo
- Exposed ports:
  - 5173 - Frontend (web)
  - 8000 - Backend API
  - 5432 - PostgreSQL (internal)

**Environment variables:**
```env
DATABASE_URL=postgresql://user:pass@db:5432/secmaturity
SECRET_KEY=...
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## Prihodnje izboljšave (Roadmap)

### Možne razširitve:

1. **Napredna analitika:**
   - Benchmarking z industrijo
   - Predictive analytics
   - AI-powered priporočila

2. **Integracije:**
   - SIEM sistemi
   - Ticketing systems (Jira, ServiceNow)
   - Microsoft Teams/Slack notifikacije
   - Email alerts

3. **Avtomatizacija:**
   - Periodične ocene
   - Avtomatski reminder-ji
   - Workflow automation

4. **Poročila:**
   - Dodatni formati (Word, Excel)
   - Custom templates
   - Scheduled reports

5. **Mobilna aplikacija:**
   - Native iOS/Android
   - Push notifikacije
   - Offline mode

6. **API razširitve:**
   - Webhook support
   - Real-time updates (WebSocket)
   - GraphQL alternative

---

## Zaključek

**Sec-Maturity-Lite** je robustna, production-ready platforma za upravljanje varnostne zrelosti organizacij. Aplikacija ponuja:

✅ Celovito ocenjevanje varnosti (10 domen)  
✅ Sistem priporočil in nalog  
✅ Knjižnica dokumentov  
✅ Dashboard z analytics  
✅ Multi-tenancy (organizacije & ekipe)  
✅ Role-based access control  
✅ Profesionalen UI brez emojijev  
✅ Slovenščina po celotni aplikaciji  
✅ Docker deployment  
✅ PostgreSQL database  
✅ RESTful API  
✅ TypeScript frontend  

**Status:** Pripravljena za produkcijsko uporabo! 🎉

---

**Kontakt:** [Vaš email]  
**GitHub:** [Repository URL]  
**Licenca:** [Vaša izbira]
