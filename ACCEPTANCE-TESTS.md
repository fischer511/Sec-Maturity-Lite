# Acceptance Tests - Milestone M1 (MVP)

## Test Suite za preverjanje MVP funkcionalnosti

Vseh 10 acceptance testov mora biti opravljenih pred zaključkom M1.

---

## 1️⃣ Test: Prijava in dostop do dashboarda

**Cilj**: Preveriti, da se uporabnik lahko prijavi in vidi dashboard.

**Predpogoji**:
- Aplikacija teče (docker-compose up)
- Seed skripta je bila izvršena
- Obstaja uporabnik `admin@example.com` / `Admin!234`

**Koraki**:
1. Odpri `http://localhost:5173`
2. Vnesi email: `admin@example.com`
3. Vnesi geslo: `Admin!234`
4. Klikni "Prijava"

**Pričakovani rezultat**:
- ✅ Uporabnik je preusmerjen na `/dashboard`
- ✅ Dashboard prikazuje:
  - Navigacijo z email uporabnika
  - Gumb "Nova ocena"
  - Gumb "Odjava"
  - Vsaj osnovno vsebino (charts ali "Ni podatkov")
- ✅ JWT token je shranjen v localStorage
- ✅ API klic `/api/v1/users/me` je uspešen

**Status**: ⬜ TODO

---

## 2️⃣ Test: Admin ustvari organizacijo in managerja

**Cilj**: Preveriti, da admin lahko ustvari novo organizacijo in dodeli manager vlogo.

**Predpogoji**:
- Prijavljen kot admin

**Koraki**:
1. Klic API: `POST /api/v1/orgs` z `{"name": "Test Organization"}`
2. Pridobi `org_id` iz odgovora
3. Klic API: `POST /api/v1/users` z:
   ```json
   {
     "email": "testmanager@test.com",
     "password": "test123",
     "full_name": "Test Manager",
     "role": "manager",
     "organization_id": <org_id>
   }
   ```

**Pričakovani rezultat**:
- ✅ Organizacija je uspešno ustvarjena (HTTP 201)
- ✅ Manager je uspešno ustvarjen (HTTP 201)
- ✅ Manager ima `role: "manager"` in pravilen `organization_id`
- ✅ Manager se lahko prijavi z danimi credentials
- ✅ Audit log beleži kreiranje organizacije (opcijsko)

**Status**: ⬜ TODO

---

## 3️⃣ Test: Manager kreira ocenjevanje, vnese odgovore in finalizira

**Cilj**: Preveriti celoten lifecycle ocenjevanja.

**Predpogoji**:
- Prijavljen kot manager (`manager@demo.example.com` / `demo123`)

**Koraki**:
1. Pojdi na `/assessments/new`
2. Wizard se odpre na prvi domeni (Governance)
3. Odgovori na vseh 5 vprašanj (izberi različne ocene 0-5)
4. Klikni "Naprej" → prideš na Asset Management
5. Odgovori na vseh 5 vprašanj
6. Ponovi za vse 6 domen
7. Pri zadnji domeni klikni "Zaključi ocenjevanje"

**Pričakovani rezultat**:
- ✅ Wizard omogoča navigacijo po vseh 6 domenah
- ✅ Progress bar prikazuje trenutno domeno (X od 6)
- ✅ Likert skala 0-5 deluje (6 gumbov, aktivni gumb je moder)
- ✅ "Shrani osnutek" gumb deluje (kliče API create + saveAnswers)
- ✅ "Zaključi ocenjevanje" gumb:
  - Validira, da so vsa vprašanja odgovorjena
  - Kliče API finalize
  - Preusmeri na `/assessments/:id`
- ✅ Ocena je v statusu `finalized`
- ✅ `overall_score` in `domain_scores` so izračunani

**Status**: ⬜ TODO

---

## 4️⃣ Test: Izračun domen & overall je pravilen (unit test)

**Cilj**: Preveriti matematično pravilnost scoring funkcij.

**Predpogoji**:
- Backend pytest okolje je pripravljeno

**Koraki**:
1. Zaženi `docker-compose exec api pytest tests/test_scoring.py -v`

**Test case 1 - Domain score**:
```python
# Vprašanja: Q1=3, Q2=4, Q3=2 (governance)
# Pričakovan domain score: (3+4+2)/3 = 3.0
```

**Test case 2 - Overall score**:
```python
# Domain scores: governance=3.0, asset=4.0, access=3.5
# Pričakovan overall score: (3.0+4.0+3.5)/3 = 3.5
```

**Test case 3 - Zaokroževanje**:
```python
# Domain score: 3.47 → zaokroži na 3.5
# Overall score: 2.93 → zaokroži na 2.9
```

**Pričakovani rezultat**:
- ✅ Vsi unit testi v `test_scoring.py` so PASSED
- ✅ Funkcija `compute_domain_scores()` pravilno povprečuje
- ✅ Funkcija `compute_overall_score()` pravilno povprečuje
- ✅ Zaokroževanje na 0.1 deluje

**Status**: ⬜ TODO

---

## 5️⃣ Test: Dashboard prikaže trend po treh ocenjevanjih (line chart)

**Cilj**: Preveriti LineChart za trend overall_score čez čas.

**Predpogoji**:
- Prijavljen kot manager
- Obstajajo vsaj 3 zaključene ocene z različnimi datumi

**Koraki**:
1. Če še ni 3 ocen:
   - Ustvari 3 ocene z različnimi rezultati (npr. overall_score: 2.5, 3.2, 3.8)
   - Ročno spremeni `created_at` v bazi za različne datume (npr. -14d, -7d, danes)
2. Pojdi na `/dashboard`

**Pričakovani rezultat**:
- ✅ LineChart je viden (ni skriven)
- ✅ X os prikazuje datume (format: dd.mm)
- ✅ Y os prikazuje overall_score (0-5)
- ✅ Modra linija povezuje 3 točke
- ✅ Tooltip prikazuje vrednosti ob hover
- ✅ Legenda prikazuje "Skupna ocena"
- ✅ Graf uporablja Recharts knjižnico

**Status**: ⬜ TODO

---

## 6️⃣ Test: Radar chart prikaže profil domen zadnjega ocenjevanja

**Cilj**: Preveriti RadarChart za prikaz domain scores.

**Predpogoji**:
- Prijavljen kot manager
- Obstaja vsaj 1 zaključena ocena

**Koraki**:
1. Pojdi na `/dashboard`
2. Poišči sekcijo "Ocene po domenah"

**Pričakovani rezultat**:
- ✅ RadarChart je viden
- ✅ Graf ima 6 osi (domene):
  - Upravljanje
  - Upravljanje sredstev
  - Nadzor dostopa
  - Varnost operacij
  - Upravljanje incidentov
  - Poslovna kontinuiteta
- ✅ Modra polnitev (fillOpacity 0.6) prikazuje profil
- ✅ Vse osi so ustrezno skalirane (0-5)
- ✅ Tooltip prikazuje vrednosti ob hover
- ✅ Legenda prikazuje "Ocena"
- ✅ Graf prikazuje podatke **zadnje** zaključene ocene

**Status**: ⬜ TODO

---

## 7️⃣ Test: Endpoint vrne priporočila glede na YAML pravila

**Cilj**: Preveriti recommendations servis in API endpoint.

**Predpogoji**:
- Obstaja zaključena ocena z različnimi domain scores
- YAML pravila so definirana v `app/rules/recommendations.yaml`

**Koraki**:
1. Ustvari oceno kjer ima governance domain score < 3 (npr. 2.5)
2. Ustvari oceno kjer ima asset domain score < 3 (npr. 2.0)
3. Finaliziraj oceno
4. Klic API: `GET /api/v1/assessments/{id}/recommendations`

**Pričakovani rezultat**:
- ✅ API vrne seznam priporočil (JSON array)
- ✅ Vsako priporočilo vsebuje:
  - `domain` (str)
  - `domain_label` (str, slovenski)
  - `priority` (high/medium/low)
  - `title` (str)
  - `description` (str)
- ✅ Za governance score < 3 se prikaže ustrezno priporočilo iz YAML
- ✅ Za asset score < 3 se prikaže ustrezno priporočilo iz YAML
- ✅ Če je domain score ≥ 3, se priporočila ne prikažejo
- ✅ YAML parser uporablja safe evaluation (brez exec/eval)
- ✅ Vsaj 2 pravili na domeno obstajata v YAML

**Status**: ⬜ TODO

---

## 8️⃣ Test: PDF se uspešno generira in vsebuje obvezne elemente

**Cilj**: Preveriti PDF export funkcionalnost.

**Predpogoji**:
- Obstaja zaključena ocena z ID

**Koraki**:
1. Pojdi na `/assessments/:id` (detail page)
2. Klikni gumb "Prenesi PDF poročilo"
3. Preveri preneseno PDF datoteko

**Pričakovani rezultat**:
- ✅ PDF datoteka se uspešno prenese (format: `assessment-{id}.pdf`)
- ✅ PDF vsebuje **obvezne elemente**:
  - **Header**: "Sec-Maturity Assessment Report" (ali podobno)
  - **Datum**: Created at, Finalized at
  - **Domain scores**: Tabela z vsemi 6 domenami in njihovimi ocenami
  - **Overall score**: Skupna ocena (številka)
  - **Top 5 priporočil**: Seznam priporočil z naslovom in prioriteto
- ✅ PDF je čitljiv in oblikovan (ne prazna stran)
- ✅ WeasyPrint servis deluje brez napak
- ✅ Audit log beleži `assessment.pdf_exported`

**Status**: ⬜ TODO

---

## 9️⃣ Test: RBAC prepreči viewerju ustvarjanje ocenjevanja

**Cilj**: Preveriti, da viewer vloga ne more izvajati privilegiranih akcij.

**Predpogoji**:
- Obstaja uporabnik z vlogo `viewer`
- (Če ne: ustvari z `role: "viewer"` preko seed ali API)

**Koraki**:
1. Prijavi se kot viewer uporabnik
2. Poskusi API klic: `POST /api/v1/orgs/{orgId}/assessments` z:
   ```json
   {"version": 1}
   ```

**Pričakovani rezultat**:
- ✅ API vrne HTTP 403 Forbidden
- ✅ Sporočilo napake: "Not enough permissions" (ali podobno)
- ✅ Ocena **NI** ustvarjena v bazi
- ✅ Viewer lahko:
  - Prebere seznam ocen (`GET /assessments`)
  - Prebere posamezno oceno (`GET /assessments/:id`)
  - Prebere priporočila (`GET /assessments/:id/recommendations`)
- ✅ Viewer **NE MORE**:
  - Ustvariti nove ocene (`POST /assessments`)
  - Finalizirati ocen (`POST /assessments/:id/finalize`)
  - Ustvariti organizacij (`POST /orgs`)
  - Ustvariti uporabnikov (`POST /users`)

**Status**: ⬜ TODO

---

## 🔟 Test: Audit log beleži ključne dogodke

**Cilj**: Preveriti, da se vsi pomembni dogodki beležijo v audit_logs.

**Predpogoji**:
- Aplikacija teče
- Baza je prazna ali resetirana

**Koraki**:
1. **Login success**:
   - Prijavi se kot `admin@example.com`
   - Preveri: `SELECT * FROM audit_logs WHERE action = 'auth.login_success'`
   
2. **Login failed**:
   - Poskusi prijavo z napačnim geslom
   - Preveri: `SELECT * FROM audit_logs WHERE action = 'auth.login_failed'`
   
3. **Create assessment**:
   - Ustvari novo oceno preko API
   - Preveri: `SELECT * FROM audit_logs WHERE action = 'assessment.created'`
   
4. **Finalize assessment**:
   - Finaliziraj oceno preko API
   - Preveri: `SELECT * FROM audit_logs WHERE action = 'assessment.finalized'`
   
5. **Export PDF**:
   - Izvozi PDF preko API
   - Preveri: `SELECT * FROM audit_logs WHERE action = 'assessment.pdf_exported'`

**Pričakovani rezultat**:
- ✅ **Login success** log vsebuje:
  - `action`: "auth.login_success"
  - `user_id`: ID prijavljenega uporabnika
  - `metadata`: {"email": "admin@example.com"}
  
- ✅ **Login failed** log vsebuje:
  - `action`: "auth.login_failed"
  - `user_id`: NULL
  - `metadata`: {"email": "napacen@email.com"}
  
- ✅ **Create assessment** log vsebuje:
  - `action`: "assessment.created"
  - `user_id`: ID uporabnika
  - `organization_id`: ID organizacije
  - `metadata`: {"assessment_id": X, "version": 1}
  
- ✅ **Finalize assessment** log vsebuje:
  - `action`: "assessment.finalized"
  - `user_id`: ID uporabnika
  - `organization_id`: ID organizacije
  - `metadata`: {"assessment_id": X, "overall_score": Y}
  
- ✅ **Export PDF** log vsebuje:
  - `action`: "assessment.pdf_exported"
  - `user_id`: ID uporabnika
  - `organization_id`: ID organizacije
  - `metadata`: {"assessment_id": X}
  
- ✅ Vsi logi imajo pravilen `timestamp`
- ✅ API endpoint `GET /api/v1/audit` vrne vse loge

**Status**: ⬜ TODO

---

## 📊 Test Summary

| Test # | Opis | Status | Prioriteta |
|--------|------|--------|-----------|
| 1 | Prijava in dashboard | ⬜ TODO | CRITICAL |
| 2 | Admin ustvari org/managerja | ⬜ TODO | HIGH |
| 3 | Manager lifecycle ocenjevanja | ⬜ TODO | CRITICAL |
| 4 | Scoring unit tests | ⬜ TODO | CRITICAL |
| 5 | Dashboard LineChart | ⬜ TODO | HIGH |
| 6 | Dashboard RadarChart | ⬜ TODO | HIGH |
| 7 | Recommendations API | ⬜ TODO | HIGH |
| 8 | PDF export | ⬜ TODO | MEDIUM |
| 9 | RBAC enforcement | ⬜ TODO | HIGH |
| 10 | Audit logging | ⬜ TODO | MEDIUM |

---

## 🚀 Kako izvesti teste

### Manualni testi (1, 2, 3, 5, 6, 8)
```bash
# Zagon aplikacije
docker-compose up --build

# Migracije
docker-compose exec api alembic upgrade head

# Seed
docker-compose exec api python -m app.seed

# Testiranje v brskalniku
http://localhost:5173
```

### Unit testi (4)
```bash
# Backend pytest
docker-compose exec api pytest tests/test_scoring.py -v
docker-compose exec api pytest tests/test_recommendations.py -v
```

### API testi (7, 9, 10)
```bash
# Uporabi Postman, curl ali Python requests
# Primer:
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

### Baza check (10)
```bash
# Psql v Docker containerju
docker-compose exec db psql -U postgres -d secmaturity -c "SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;"
```

---

## ✅ Definition of Done

Milestone M1 je **KONČAN**, ko:
- ✅ Vseh 10 acceptance testov je PASSED
- ✅ Ni blocker ali critical bugov
- ✅ Dokumentacija (README.md, MVP-STATUS.md) je posodobljena
- ✅ Docker Compose build je uspešen brez napak
- ✅ Demo podatki (seed) delujejo brez napak

---

## 📝 Test Execution Log

| Datum | Tester | Test # | Rezultat | Opombe |
|-------|--------|--------|----------|--------|
| _TBD_ | _Name_ | 1-10 | ⬜ | Začetek testiranja |

---

**Verzija**: 1.0  
**Datum**: 8. november 2025  
**Status**: Ready for Testing
