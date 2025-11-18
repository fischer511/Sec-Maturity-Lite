# 🚀 Quick Start Reference Card

## Hitri ukazi za lokalni zagon

### 1. Pripravi .env
```powershell
# Windows
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

### 2. Zagon Docker Compose
```powershell
docker-compose up --build
```

### 3. Migracije (novi terminal)
```powershell
docker-compose exec api alembic upgrade head
```

### 4. Seed demo podatkov
```powershell
docker-compose exec api python -m app.seed
```

---

## 🌐 URLs

| Servis | URL | Opis |
|--------|-----|------|
| **Frontend** | http://localhost:5173 | React aplikacija |
| **Backend API** | http://localhost:8000 | FastAPI server |
| **API Docs** | http://localhost:8000/docs | Swagger UI |
| **ReDoc** | http://localhost:8000/redoc | API dokumentacija |

---

## 🔐 Demo računi

| Vloga | Email | Geslo | Opombe |
|-------|-------|-------|--------|
| **Admin** | `admin@example.com` | `Admin!234` | Polni dostop |
| **Manager** | `manager@demo.example.com` | `demo123` | Lahko kreira ocene |

---

## ⚡ Koristni ukazi

### Docker
```powershell
# Stop vseh servisov
docker-compose down

# Stop + izbriši volume (reset baze)
docker-compose down -v

# Preglej loge API
docker-compose logs -f api

# Preglej loge frontend
docker-compose logs -f web

# Vstopi v backend container
docker-compose exec api bash

# Vstopi v DB container
docker-compose exec db psql -U postgres -d sec_maturity
```

### Backend
```powershell
# Poženi teste
docker-compose exec api pytest -v

# Specifični test file
docker-compose exec api pytest tests/test_scoring.py -v

# Coverage report
docker-compose exec api pytest --cov=app tests/

# Nova migracija
docker-compose exec api alembic revision --autogenerate -m "opis spremembe"

# Upgrade na zadnjo verzijo
docker-compose exec api alembic upgrade head

# Downgrade za 1 verzijo
docker-compose exec api alembic downgrade -1
```

### Frontend
```powershell
# Vstopi v frontend container
docker-compose exec web sh

# Instalacija novih paketov (znotraj containerja)
npm install <package-name>

# Build za produkcijo
docker-compose exec web npm run build
```

### Baza
```powershell
# Psql konzola
docker-compose exec db psql -U postgres -d sec_maturity

# Izvoz baze
docker-compose exec db pg_dump -U postgres sec_maturity > backup.sql

# Uvoz baze
cat backup.sql | docker-compose exec -T db psql -U postgres -d sec_maturity

# Seznam tabel
docker-compose exec db psql -U postgres -d sec_maturity -c "\dt"

# Preglej audit loge
docker-compose exec db psql -U postgres -d sec_maturity -c "SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;"
```

---

## 🧪 Acceptance Testing

```powershell
# 1. Zagon aplikacije
docker-compose up --build

# 2. Migracije
docker-compose exec api alembic upgrade head

# 3. Seed
docker-compose exec api python -m app.seed

# 4. Odpri browser
start http://localhost:5173

# 5. Prijava
# Email: admin@example.com
# Geslo: Admin!234

# 6. Backend testi
docker-compose exec api pytest -v

# 7. Preveri audit loge
docker-compose exec db psql -U postgres -d sec_maturity -c "SELECT action, COUNT(*) FROM audit_logs GROUP BY action;"
```

---

## 🔧 Troubleshooting

### Port že v uporabi
```powershell
# Windows - preveri kateri proces uporablja port
netstat -ano | findstr :5173
netstat -ano | findstr :8000
netstat -ano | findstr :5432

# Kill process (zamenjaj PID)
taskkill /PID <PID> /F
```

### Docker volume permissions
```powershell
# Reset vseh volumov
docker-compose down -v
docker volume prune

# Rebuild brez cache
docker-compose build --no-cache
docker-compose up
```

### Frontend dependency issues
```powershell
# Izbris node_modules in reinstall
docker-compose exec web rm -rf node_modules
docker-compose exec web npm install
```

### Backend Python errors
```powershell
# Preveri logs
docker-compose logs api

# Restart samo API
docker-compose restart api

# Rebuild samo backend
docker-compose up --build -d api
```

---

## 📁 Pomembne datoteke

| Datoteka | Opis |
|----------|------|
| `README.md` | Glavna dokumentacija |
| `MVP-STATUS.md` | Pregled implementiranih funkcionalnosti |
| `MVP-CHECKLIST.md` | Podroben checklist implementacije |
| `ACCEPTANCE-TESTS.md` | 10 acceptance testov za M1 |
| `docker-compose.yml` | Docker orchestration |
| `.env.example` | Vzorčna konfiguracija |
| `backend/app/main.py` | FastAPI entry point |
| `frontend/src/App.tsx` | React Router |

---

## 📊 Demo podatki po seed

Po izvršitvi `python -m app.seed` boš imel:

- ✅ 1 admin uporabnika
- ✅ 1 demo organizacijo ("Demo Corp")
- ✅ 1 manager uporabnika (v Demo Corp)
- ✅ 2 zaključeni oceni z različnimi rezultati
- ✅ 27 vprašanj v 6 domenah (v kodi, ne v bazi)
- ✅ 12 YAML priporočil (2 na domeno)
- ✅ Audit loge za vse akcije

---

## 🎯 Workflow za novo funkcionalnost

1. **Backend**:
   ```powershell
   # Nova migracija
   docker-compose exec api alembic revision --autogenerate -m "add_new_feature"
   docker-compose exec api alembic upgrade head
   
   # Dodaj model, schema, service, API endpoint
   # Restart API
   docker-compose restart api
   
   # Test
   docker-compose exec api pytest tests/test_new_feature.py -v
   ```

2. **Frontend**:
   ```powershell
   # Dodaj novo stran/komponento v src/
   # Hot reload avtomatsko posodobi
   
   # Če dodaš nove dependence
   docker-compose exec web npm install <package>
   docker-compose restart web
   ```

3. **Testiranje**:
   ```powershell
   # Backend
   docker-compose exec api pytest -v
   
   # Frontend (manual v brskalniku)
   start http://localhost:5173
   
   # API docs
   start http://localhost:8000/docs
   ```

---

**Verzija**: 1.0  
**Datum**: 8. november 2025  
**Avtor**: Sec-Maturity-Lite Team
