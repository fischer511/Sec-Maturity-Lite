# M2 Backlog - Razširitve in Izboljšave

## Pregled

Ta dokument vsebuje načrtovane funkcionalnosti za **Milestone 2 (M2)** - razširitev MVP aplikacije Sec-Maturity-Lite. Vse točke iz M1 MVP so že implementirane in delujoče.

---

## 🎯 M2 Prioritete

### High Priority (Kritične funkcionalnosti)
1. Večnivojski vprašalnik (NIS2 mapiranje)
2. Prilagodljiva teža domen
3. CSV Import/Export ocen
4. Brandable PDF (logo organizacije)

### Medium Priority (Pomembne izboljšave)
5. Schedules za opomnike na ponovno oceno (cron)
6. Organisations → Teams (oddelki)
7. Bolj napreden rules engine (več pogojev)

### Low Priority (Nice-to-have)
8. SSO (OIDC)
9. Telemetry (OpenTelemetry)
10. Infra IaC (Terraform) za cloud

---

## 📋 Podrobni Backlog Items

### 1️⃣ Večnivojski vprašalnik (NIS2 mapiranje)

**Cilj**: Razširiti obstoječi vprašalnik z večnivojsko strukturo, ki omogoča natančnejše mapiranje na NIS2 direktivo.

**Funkcionalnosti**:
- Hierarhična struktura: Domene → Poddomene → Vprašanja → Podvprašanja
- NIS2 artikel reference za vsako vprašanje
- ISO 27001 kontrole mapiranje
- Pogojno prikazovanje vprašanj (na osnovi prejšnjih odgovorov)
- Weighted scoring po NIS2 pomembnosti

**Tehnična implementacija**:
```python
# Backend struktura
class QuestionLevel:
    DOMAIN = 1        # Governance, Asset Management, ...
    SUBDOMAIN = 2     # Policy, Roles, Training, ...
    QUESTION = 3      # Konkretna vprašanja
    SUBQUESTION = 4   # Podrobnejša vprašanja

class Question:
    level: QuestionLevel
    parent_id: Optional[int]
    nis2_article: str  # "Article 21(2)(a)"
    iso27001_control: str  # "A.5.1.1"
    weight: float  # 1.0 default, lahko več za kritična
    conditional_logic: Optional[dict]  # {"depends_on": "Q1", "condition": "score < 3"}
```

**Frontend**:
- Dinamični wizard z nested steps
- Breadcrumb navigacija (Domena > Poddomena > Vprašanje)
- Collapse/expand podvprašanja
- Progress bar po vseh nivojih

**Acceptance Criteria**:
- ✅ Vsaj 3 nivoje globine (Domain → Subdomain → Question)
- ✅ Vsaj 50 vprašanj skupaj
- ✅ NIS2 artikel za vsako glavno vprašanje
- ✅ Pogojno prikazovanje deluje
- ✅ Weighted scoring pravilno izračuna

**Ocena časa**: 5-7 dni

---

### 2️⃣ Prilagodljiva teža domen

**Cilj**: Omogočiti organizacijam prilagajanje teže posameznih domen glede na njihovo specifično situacijo.

**Funkcionalnosti**:
- Admin/Manager lahko nastavi custom uteži za domene
- Default uteži: vseh 6 domen = 1.0 (enako pomembne)
- Custom uteži: npr. Governance=1.5, Incident=2.0, ostali=1.0
- Izračun weighted overall score
- Vizualizacija uteži v dashboard
- Zgodovina sprememb uteži (audit)

**Tehnična implementacija**:
```python
# Backend model
class DomainWeight(Base):
    __tablename__ = "domain_weights"
    
    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id: Mapped[UUID] = mapped_column(ForeignKey("orgs.id"))
    domain: Mapped[str]  # governance, asset, access, ...
    weight: Mapped[float] = mapped_column(default=1.0)  # 0.5 - 3.0 range
    set_by_user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime]
    
# Weighted scoring
def compute_weighted_overall_score(domain_scores, weights):
    total_weighted_score = sum(score * weights.get(domain, 1.0) 
                                for domain, score in domain_scores.items())
    total_weight = sum(weights.values())
    return round(total_weighted_score / total_weight, 1)
```

**Frontend**:
- Settings stran za urejanje uteži
- Slider komponente (0.5x - 3.0x)
- Real-time preview weighted score
- Disclaimer: "Spremembe uteži ne vplivajo na pretekle ocene"

**Acceptance Criteria**:
- ✅ Admin lahko nastavi custom uteži
- ✅ Nove ocene uporabljajo trenutne uteži
- ✅ Pretekle ocene ostanejo nespremenjene
- ✅ Dashboard prikaže info o weighted scoring
- ✅ Audit log beleži spremembe uteži

**Ocena časa**: 3-4 dni

---

### 3️⃣ CSV Import/Export ocen

**Cilj**: Omogočiti masovni import/export podatkov za analizo v Excel, backup, ali migracijo.

**Funkcionalnosti**:

**Export**:
- CSV export vseh ocen organizacije
- CSV export posamezne ocene (detailed)
- CSV export priporočil
- CSV export audit logov
- Formats: CSV, Excel (.xlsx)

**Import**:
- CSV import odgovorov (bulk assessment creation)
- Template CSV za organizacije
- Validacija pri importu
- Preview before import
- Rollback možnost če import ne uspe

**Tehnična implementacija**:
```python
# Backend
from io import StringIO, BytesIO
import csv
import pandas as pd

# Export endpoint
@router.get("/orgs/{org_id}/assessments/export")
async def export_assessments_csv(org_id: UUID, format: str = "csv"):
    assessments = db.query(Assessment).filter(...).all()
    
    if format == "csv":
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=[...])
        writer.writeheader()
        for a in assessments:
            writer.writerow({...})
        return Response(content=output.getvalue(), media_type="text/csv")
    
    elif format == "xlsx":
        df = pd.DataFrame([...])
        output = BytesIO()
        df.to_excel(output, index=False)
        return Response(content=output.getvalue(), 
                       media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

# Import endpoint
@router.post("/orgs/{org_id}/assessments/import")
async def import_assessments_csv(org_id: UUID, file: UploadFile):
    content = await file.read()
    df = pd.read_csv(BytesIO(content))
    
    # Validate
    errors = validate_import_data(df)
    if errors:
        raise HTTPException(400, detail=errors)
    
    # Import with transaction
    with db.begin():
        for _, row in df.iterrows():
            create_assessment_from_row(row, org_id)
```

**Frontend**:
- Export gumb na dashboard
- Dialog za izbiro formata (CSV/Excel)
- Import gumb z file upload
- Preview tabela pred importom
- Progress bar za velike importe

**Acceptance Criteria**:
- ✅ Export CSV vseh ocen deluje
- ✅ Export Excel (.xlsx) deluje
- ✅ Import CSV z validacijo deluje
- ✅ Template CSV se lahko prenese
- ✅ Error handling pri neveljavnih podatkih
- ✅ Rollback če import ne uspe

**Ocena časa**: 4-5 dni

**Dependence**: pandas library

---

### 4️⃣ Schedules za opomnike na ponovno oceno (cron)

**Cilj**: Avtomatsko pošiljanje opomnikov za redno ponovno ocenjevanje (npr. vsako leto).

**Funkcionalnosti**:
- Nastavitev reassessment intervalov (3m, 6m, 12m, custom)
- Email opomnike X dni pred deadline
- Dashboard widget "Upcoming assessments"
- Admin lahko nastavi globalne politike
- Manager lahko nastavi per-org politike
- Cron job za preverjanje deadlineov

**Tehnična implementacija**:
```python
# Backend model
class AssessmentSchedule(Base):
    __tablename__ = "assessment_schedules"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    organization_id: Mapped[UUID] = mapped_column(ForeignKey("orgs.id"))
    interval_months: Mapped[int]  # 3, 6, 12, etc.
    reminder_days_before: Mapped[int] = mapped_column(default=14)  # 14 dni pred
    last_assessment_date: Mapped[Optional[datetime]]
    next_assessment_due: Mapped[Optional[datetime]]
    enabled: Mapped[bool] = mapped_column(default=True)

# Cron job (Celery or APScheduler)
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()

@scheduler.scheduled_job('cron', hour=9, minute=0)  # Vsak dan ob 9:00
def check_assessment_reminders():
    today = datetime.now()
    
    # Najdi vse org, ki potrebujejo reminder
    schedules = db.query(AssessmentSchedule).filter(
        AssessmentSchedule.enabled == True,
        AssessmentSchedule.next_assessment_due <= today + timedelta(days=reminder_days_before)
    ).all()
    
    for schedule in schedules:
        send_reminder_email(schedule.organization_id)
        log_audit(db, "assessment.reminder_sent", None, schedule.organization_id)

# Email template
def send_reminder_email(org_id):
    org = db.query(Organization).get(org_id)
    managers = db.query(User).filter(
        User.org_id == org_id, 
        User.role.in_(["admin", "manager"])
    ).all()
    
    for manager in managers:
        send_email(
            to=manager.email,
            subject=f"Reminder: Assessment due for {org.name}",
            body=f"Your next cybersecurity maturity assessment is due in {days} days..."
        )
```

**Frontend**:
- Settings stran za schedule configuration
- Dashboard widget "Upcoming Assessments" (card)
- Notifications bell icon z številom
- Snooze option za opomnike

**Acceptance Criteria**:
- ✅ Admin lahko nastavi interval za org
- ✅ Cron job teče vsak dan
- ✅ Email opomniki se pošljejo
- ✅ Dashboard prikaže upcoming assessments
- ✅ Audit log beleži poslane opomnike

**Ocena časa**: 4-5 dni

**Dependence**: Email service (SMTP), APScheduler ali Celery

---

### 5️⃣ Organisations → Teams (oddelki)

**Cilj**: Razširiti hierarhijo iz organizacij na teams/oddelke za večje podjetje.

**Funkcionalnosti**:
- Organizacija lahko ima več Teams (IT, HR, Finance, ...)
- Team-level assessments (ne samo org-level)
- Team managers (restricted access)
- Aggregacija rezultatov: Team → Organization
- Team comparison view
- RBAC: team_manager vloga

**Tehnična implementacija**:
```python
# Backend model
class Team(Base):
    __tablename__ = "teams"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    organization_id: Mapped[UUID] = mapped_column(ForeignKey("orgs.id"))
    name: Mapped[str]  # "IT Department", "HR", ...
    description: Mapped[Optional[str]]
    created_at: Mapped[datetime]
    
    # Relationships
    members: Mapped[List["User"]] = relationship(back_populates="team")
    assessments: Mapped[List["Assessment"]] = relationship(back_populates="team")

# Update User model
class User(Base):
    # ... existing fields
    team_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("teams.id"))
    team: Mapped[Optional["Team"]] = relationship(back_populates="members")

# Update Assessment model
class Assessment(Base):
    # ... existing fields
    team_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("teams.id"))
    team: Mapped[Optional["Team"]] = relationship(back_populates="assessments")

# RBAC
class UserRole(str, Enum):
    ADMIN = "admin"
    ORG_MANAGER = "org_manager"  # Renamed from "manager"
    TEAM_MANAGER = "team_manager"  # New role
    VIEWER = "viewer"

# Team aggregation
def compute_org_score_from_teams(org_id: UUID):
    teams = db.query(Team).filter(Team.organization_id == org_id).all()
    team_scores = []
    
    for team in teams:
        latest = db.query(Assessment).filter(
            Assessment.team_id == team.id,
            Assessment.status == "finalized"
        ).order_by(Assessment.finalized_at.desc()).first()
        
        if latest:
            team_scores.append(latest.overall_score)
    
    return round(sum(team_scores) / len(team_scores), 1) if team_scores else 0
```

**Frontend**:
- Teams management stran (CRUD teams)
- Team selector v wizard
- Team comparison dashboard (side-by-side radar charts)
- Organization-level dashboard (aggregated)
- Team-level dashboard (filtered)

**Acceptance Criteria**:
- ✅ Org admin lahko ustvari teams
- ✅ Team manager lahko ustvari assessment za svoj team
- ✅ Team manager ne vidi drugih teams
- ✅ Org dashboard prikaže aggregated score
- ✅ Team comparison view deluje

**Ocena časa**: 6-8 dni

---

### 6️⃣ SSO (OIDC)

**Cilj**: Integracija Single Sign-On z OpenID Connect za enterprise organizacije.

**Funkcionalnosti**:
- Login z Microsoft Entra ID (Azure AD)
- Login z Google Workspace
- Login z Okta
- Generic OIDC provider support
- Just-in-time (JIT) user provisioning
- Attribute mapping (email, name, groups → roles)
- Fallback na email/password login

**Tehnična implementacija**:
```python
# Backend
from authlib.integrations.starlette_client import OAuth

oauth = OAuth()

# Microsoft Entra ID
oauth.register(
    name='microsoft',
    client_id=settings.MICROSOFT_CLIENT_ID,
    client_secret=settings.MICROSOFT_CLIENT_SECRET,
    server_metadata_url='https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

# Google
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

@router.get("/auth/login/{provider}")
async def login_sso(provider: str, request: Request):
    redirect_uri = request.url_for('auth_callback', provider=provider)
    return await oauth.create_client(provider).authorize_redirect(request, redirect_uri)

@router.get("/auth/callback/{provider}")
async def auth_callback(provider: str, request: Request):
    token = await oauth.create_client(provider).authorize_access_token(request)
    user_info = token.get('userinfo')
    
    # JIT provisioning
    user = db.query(User).filter(User.email == user_info['email']).first()
    if not user:
        user = User(
            email=user_info['email'],
            full_name=user_info.get('name'),
            role='viewer',  # Default role
            sso_provider=provider,
            sso_subject=user_info['sub']
        )
        db.add(user)
        db.commit()
    
    # Generate JWT
    access_token = create_access_token(user.id)
    return {"access_token": access_token, "token_type": "bearer"}
```

**Frontend**:
- SSO gumbi na login strani ("Sign in with Microsoft", "Sign in with Google")
- Settings za SSO configuration (admin only)
- Attribute mapping UI
- SSO status indicator

**Acceptance Criteria**:
- ✅ Microsoft Entra ID login deluje
- ✅ Google Workspace login deluje
- ✅ JIT provisioning ustvari uporabnika
- ✅ Attribute mapping za role deluje
- ✅ Fallback na email/password deluje

**Ocena časa**: 5-7 dni

**Dependence**: Authlib, OIDC provider registrations

---

### 7️⃣ Bolj napreden rules engine (več pogojev)

**Cilj**: Razširiti obstoječi YAML recommendations engine z naprednejšimi pogoji in akcijami.

**Funkcionalnosti**:
- Multi-condition rules (AND, OR, NOT operators)
- Cross-domain conditions (če je governance < 3 IN asset < 2.5)
- Time-based rules (če ni bilo ocene > 6 mesecev)
- Score trends (če se score zmanjšuje)
- Custom scripting (Python sandboxed)
- Rule categories (compliance, best-practice, custom)
- Rule versioning

**Tehnična implementacija**:
```yaml
# Enhanced recommendations.yaml
recommendations:
  - id: "REC-001"
    version: "1.0"
    category: "compliance"
    priority: "critical"
    title: "Vzpostavite IT varnostno politiko"
    description: "NIS2 zahteva pisno politiko..."
    nis2_article: "Article 21(2)(a)"
    
    conditions:
      operator: "AND"
      rules:
        - domain: "governance"
          operator: "<"
          value: 3.0
        - domain: "asset"
          operator: "<"
          value: 2.5
        - type: "time_since_last_assessment"
          operator: ">"
          value: 180  # dni
    
    actions:
      - type: "recommendation"
        severity: "high"
      - type: "email_notify"
        recipients: ["admin", "manager"]
      - type: "create_task"
        title: "Review security policy"
        due_days: 30

  - id: "REC-002"
    version: "1.0"
    category: "best-practice"
    priority: "medium"
    title: "Trend se slabša"
    
    conditions:
      operator: "AND"
      rules:
        - type: "score_trend"
          domain: "governance"
          direction: "decreasing"
          period_assessments: 3
        - type: "custom_script"
          script: |
            # Sandboxed Python
            latest_score = assessment.domain_scores['governance']
            prev_score = previous_assessments[-1].domain_scores['governance']
            return latest_score < prev_score - 0.5
```

```python
# Backend rules engine
from typing import Any, Dict, List
import operator as op
from datetime import datetime, timedelta

class RulesEngine:
    OPERATORS = {
        '<': op.lt,
        '<=': op.le,
        '>': op.gt,
        '>=': op.ge,
        '==': op.eq,
        '!=': op.ne,
    }
    
    def evaluate_condition(self, condition: Dict, context: Dict) -> bool:
        cond_type = condition.get('type', 'domain_score')
        
        if cond_type == 'domain_score':
            domain = condition['domain']
            operator_str = condition['operator']
            value = condition['value']
            
            score = context['domain_scores'].get(domain, 0)
            return self.OPERATORS[operator_str](score, value)
        
        elif cond_type == 'time_since_last_assessment':
            last_date = context.get('last_assessment_date')
            if not last_date:
                return True  # No previous assessment
            
            days_ago = (datetime.now() - last_date).days
            operator_str = condition['operator']
            value = condition['value']
            return self.OPERATORS[operator_str](days_ago, value)
        
        elif cond_type == 'score_trend':
            domain = condition['domain']
            direction = condition['direction']
            period = condition['period_assessments']
            
            prev_assessments = context.get('previous_assessments', [])[:period]
            if len(prev_assessments) < period:
                return False
            
            scores = [a.domain_scores[domain] for a in prev_assessments]
            if direction == 'decreasing':
                return all(scores[i] > scores[i+1] for i in range(len(scores)-1))
            elif direction == 'increasing':
                return all(scores[i] < scores[i+1] for i in range(len(scores)-1))
        
        elif cond_type == 'custom_script':
            # Sandboxed exec
            script = condition['script']
            sandbox = {
                'assessment': context['assessment'],
                'previous_assessments': context.get('previous_assessments', []),
                '__builtins__': {}  # Disable dangerous builtins
            }
            try:
                exec(script, sandbox)
                return sandbox.get('result', False)
            except Exception:
                return False
        
        return False
    
    def evaluate_rule(self, rule: Dict, context: Dict) -> bool:
        conditions = rule['conditions']
        operator_logic = conditions.get('operator', 'AND')
        rules_list = conditions.get('rules', [])
        
        results = [self.evaluate_condition(r, context) for r in rules_list]
        
        if operator_logic == 'AND':
            return all(results)
        elif operator_logic == 'OR':
            return any(results)
        elif operator_logic == 'NOT':
            return not any(results)
        
        return False
```

**Frontend**:
- Visual rules builder (drag-and-drop)
- Rule testing tool (preview recommendations)
- Rule versioning UI
- Rule import/export

**Acceptance Criteria**:
- ✅ Multi-condition rules (AND/OR) delujejo
- ✅ Cross-domain conditions delujejo
- ✅ Time-based rules delujejo
- ✅ Score trend detection deluje
- ✅ Custom scripts so sandboxed (varno)
- ✅ Rule actions se izvajajo

**Ocena časa**: 7-10 dni

---

### 8️⃣ Brandable PDF (logo organizacije)

**Cilj**: Omogočiti organizacijam prilagajanje PDF poročil z lastnim logotipom in barvami.

**Funkcionalnosti**:
- Upload org logo (PNG, SVG)
- Custom primary color
- Custom header/footer text
- Org address in footer
- Watermark option (draft, confidential)
- PDF template variants (basic, detailed, executive)

**Tehnična implementacija**:
```python
# Backend model
class OrganizationBranding(Base):
    __tablename__ = "org_branding"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    organization_id: Mapped[UUID] = mapped_column(ForeignKey("orgs.id"), unique=True)
    logo_url: Mapped[Optional[str]]  # S3/local path
    primary_color: Mapped[str] = mapped_column(default="#2563eb")  # Hex color
    header_text: Mapped[Optional[str]]
    footer_text: Mapped[Optional[str]]
    address: Mapped[Optional[str]]
    watermark_text: Mapped[Optional[str]]

# PDF generation with branding
def generate_branded_pdf(assessment: Assessment, template: str = "detailed"):
    org = assessment.organization
    branding = db.query(OrganizationBranding).filter(
        OrganizationBranding.organization_id == org.id
    ).first()
    
    context = {
        'assessment': assessment,
        'organization': org,
        'branding': branding or {},
        'logo_url': branding.logo_url if branding else None,
        'primary_color': branding.primary_color if branding else '#2563eb',
        'header_text': branding.header_text if branding else org.name,
        'footer_text': branding.footer_text if branding else f'© {org.name}',
        'watermark': branding.watermark_text if branding else None,
    }
    
    template_file = f"assessment_report_{template}.html"
    html_content = jinja_env.get_template(template_file).render(context)
    
    pdf_bytes = HTML(string=html_content).write_pdf()
    return pdf_bytes

# Logo upload endpoint
@router.post("/orgs/{org_id}/branding/logo")
async def upload_logo(org_id: UUID, file: UploadFile):
    # Validate image
    if file.content_type not in ['image/png', 'image/jpeg', 'image/svg+xml']:
        raise HTTPException(400, "Only PNG, JPEG, SVG allowed")
    
    # Save to S3 or local storage
    file_path = f"logos/{org_id}/{file.filename}"
    # ... save logic
    
    # Update branding
    branding = get_or_create_branding(org_id)
    branding.logo_url = file_path
    db.commit()
    
    return {"logo_url": file_path}
```

**Jinja2 Template**:
```html
<!-- assessment_report_detailed.html -->
<!DOCTYPE html>
<html>
<head>
    <style>
        :root {
            --primary-color: {{ primary_color }};
        }
        .header {
            background-color: var(--primary-color);
            color: white;
            padding: 20px;
        }
        .logo {
            max-height: 60px;
        }
        {% if watermark %}
        body::before {
            content: "{{ watermark }}";
            position: fixed;
            opacity: 0.1;
            font-size: 100px;
            transform: rotate(-45deg);
        }
        {% endif %}
    </style>
</head>
<body>
    <div class="header">
        {% if logo_url %}
        <img src="{{ logo_url }}" class="logo" alt="Logo">
        {% endif %}
        <h1>{{ header_text }}</h1>
    </div>
    
    <!-- ... report content ... -->
    
    <div class="footer">
        <p>{{ footer_text }}</p>
        {% if branding.address %}
        <p>{{ branding.address }}</p>
        {% endif %}
    </div>
</body>
</html>
```

**Frontend**:
- Branding settings stran (admin only)
- Logo upload component (drag-and-drop)
- Color picker za primary color
- Template selector (basic/detailed/executive)
- PDF preview

**Acceptance Criteria**:
- ✅ Org lahko naloži logo
- ✅ Org lahko nastavi primary color
- ✅ PDF vsebuje logo in barve
- ✅ Watermark option deluje
- ✅ 3 template variante obstajajo

**Ocena časa**: 4-5 dni

**Dependence**: File storage (S3 ali local), image processing

---

### 9️⃣ Telemetry (OpenTelemetry)

**Cilj**: Implementirati observability z OpenTelemetry za monitoring, tracing in metrics.

**Funkcionalnosti**:
- Distributed tracing (API calls, DB queries)
- Metrics (request rate, latency, error rate)
- Logs aggregation
- Custom metrics (assessments created, login attempts)
- Export to Jaeger/Zipkin/Prometheus
- Grafana dashboards

**Tehnična implementacija**:
```python
# Backend - OpenTelemetry setup
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

# Tracer setup
trace.set_tracer_provider(TracerProvider())
jaeger_exporter = JaegerExporter(
    agent_host_name="jaeger",
    agent_port=6831,
)
trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(jaeger_exporter)
)

# Metrics setup
prometheus_reader = PrometheusMetricReader()
metrics.set_meter_provider(
    MeterProvider(metric_readers=[prometheus_reader])
)

# Instrument FastAPI
FastAPIInstrumentor.instrument_app(app)
SQLAlchemyInstrumentor().instrument(engine=engine)

# Custom metrics
meter = metrics.get_meter(__name__)
assessment_counter = meter.create_counter(
    "assessments.created",
    description="Number of assessments created",
)
login_counter = meter.create_counter(
    "auth.logins",
    description="Number of login attempts",
)

# Usage in code
@router.post("/assessments")
async def create_assessment(...):
    with tracer.start_as_current_span("create_assessment"):
        assessment = Assessment(...)
        db.add(assessment)
        db.commit()
        
        assessment_counter.add(1, {"org_id": str(org_id)})
        
        return assessment
```

**docker-compose.yml additions**:
```yaml
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # Jaeger UI
      - "6831:6831/udp"  # Jaeger agent
  
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./deploy/prometheus.yml:/etc/prometheus/prometheus.yml
  
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

**Acceptance Criteria**:
- ✅ Distributed tracing vidno v Jaeger
- ✅ Metrics vidne v Prometheus
- ✅ Grafana dashboard deluje
- ✅ Custom metrics (assessments, logins) delujejo
- ✅ Latency tracking deluje

**Ocena časa**: 3-4 dni

**Dependence**: Jaeger, Prometheus, Grafana

---

### 🔟 Infra IaC (Terraform) za cloud

**Cilj**: Infrastructure as Code za deploy v Azure, AWS ali GCP.

**Funkcionalnosti**:
- Terraform modules za vse komponente
- Multi-cloud support (Azure, AWS, GCP)
- Production-ready setup (high availability, backup, monitoring)
- Auto-scaling
- SSL/TLS certificates (Let's Encrypt)
- CI/CD pipeline (GitHub Actions)

**Terraform struktura**:
```hcl
# terraform/main.tf
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "sec-maturity-${var.environment}"
  location = var.location
}

# PostgreSQL
resource "azurerm_postgresql_flexible_server" "main" {
  name                = "sec-maturity-db-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  
  sku_name   = "B_Standard_B1ms"
  storage_mb = 32768
  version    = "15"
  
  backup_retention_days = 7
  geo_redundant_backup_enabled = var.environment == "production"
}

# Container Apps (Backend)
resource "azurerm_container_app" "api" {
  name                = "sec-maturity-api-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.main.id
  
  template {
    container {
      name   = "api"
      image  = var.api_image
      cpu    = 0.5
      memory = "1Gi"
      
      env {
        name  = "DATABASE_URL"
        value = "postgresql://..."
      }
    }
  }
  
  ingress {
    external_enabled = true
    target_port      = 8000
  }
}

# Static Web App (Frontend)
resource "azurerm_static_web_app" "frontend" {
  name                = "sec-maturity-web-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = "westeurope"
  sku_tier            = var.environment == "production" ? "Standard" : "Free"
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "sec-maturity-insights-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  application_type    = "web"
}
```

**CI/CD Pipeline** (GitHub Actions):
```yaml
# .github/workflows/deploy.yml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
      
      - name: Terraform Init
        run: terraform init
        working-directory: ./terraform
      
      - name: Terraform Plan
        run: terraform plan
        working-directory: ./terraform
        env:
          ARM_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
          ARM_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
          ARM_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          ARM_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
      
      - name: Terraform Apply
        if: github.ref == 'refs/heads/main'
        run: terraform apply -auto-approve
        working-directory: ./terraform
      
      - name: Build & Push Docker Images
        run: |
          docker build -t ${{ secrets.ACR_NAME }}.azurecr.io/api:${{ github.sha }} ./backend
          docker push ${{ secrets.ACR_NAME }}.azurecr.io/api:${{ github.sha }}
      
      - name: Deploy Frontend
        run: |
          cd frontend
          npm install
          npm run build
          az staticwebapp deploy --name sec-maturity-web-prod --resource-group sec-maturity-prod
```

**Acceptance Criteria**:
- ✅ Terraform plan deluje brez napak
- ✅ Infrastructure se deployina v Azure/AWS/GCP
- ✅ Database backup deluje
- ✅ SSL certifikat je aktiven
- ✅ CI/CD pipeline uspešno deploya
- ✅ Auto-scaling deluje

**Ocena časa**: 5-7 dni

**Dependence**: Cloud account (Azure/AWS/GCP), Terraform

---

## 📊 M2 Roadmap

### Faza 1 - Quick Wins (2-3 tedne)
1. Prilagodljiva teža domen (3-4 dni)
2. Brandable PDF (4-5 dni)
3. CSV Import/Export (4-5 dni)

**Deliverable**: Organizacije lahko prilagodijo uteži, PDF-je, in izvozijo podatke

---

### Faza 2 - Core Features (3-4 tedne)
4. Večnivojski vprašalnik (5-7 dni)
5. Schedules za opomnike (4-5 dni)
6. Teams/oddelki (6-8 dni)

**Deliverable**: Enterprise-ready multi-level assessments z avtomatskimi opomniki

---

### Faza 3 - Advanced (2-3 tedne)
7. Bolj napreden rules engine (7-10 dni)
8. Telemetry (3-4 dni)

**Deliverable**: Napreden decision engine in full observability

---

### Faza 4 - Enterprise (2-3 tedne)
9. SSO (OIDC) (5-7 dni)
10. Infra IaC (Terraform) (5-7 dni)

**Deliverable**: Production-ready enterprise deployment

---

## 🎯 Skupna ocena časa M2

- **Faza 1**: 2-3 tedne
- **Faza 2**: 3-4 tedne
- **Faza 3**: 2-3 tedne
- **Faza 4**: 2-3 tedne

**Skupaj**: **9-13 tednov** (2-3 mesece) za celoten M2

---

## 🔧 Tehnološke odvisnosti

### Nove knjižnice
- `pandas` - CSV/Excel processing
- `authlib` - OIDC/SSO
- `apscheduler` - Cron jobs
- `opentelemetry-api`, `opentelemetry-sdk` - Telemetry
- `boto3` ali `azure-storage-blob` - File storage

### Nova infrastruktura
- SMTP server (Sendgrid, AWS SES, ...)
- File storage (S3, Azure Blob)
- Jaeger, Prometheus, Grafana (observability)
- Cloud account (Azure/AWS/GCP)

---

## 📝 Prioritizacija

**Če je čas omejen, priporočam:**

### Must-have (High ROI):
1. Večnivojski vprašalnik - jedro funkcionalnosti
2. CSV Import/Export - uporabniška zahteva
3. Brandable PDF - enterprise potreba

### Should-have (Medium ROI):
4. Prilagodljiva teža - dodana vrednost
5. Teams - enterprise scalability
6. Schedules - automation

### Nice-to-have (Low ROI):
7. Rules engine - napredna funkcionalnost
8. SSO - enterprise varnost
9. Telemetry - operativna prednost
10. IaC - deployment automation

---

**Verzija**: 1.0  
**Datum**: 8. november 2025  
**Status**: Ready for Planning
