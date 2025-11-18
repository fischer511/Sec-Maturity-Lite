# M2 Implementation Guide - Konkretna Navodila

## 🎯 Pregled

Ta dokument vsebuje **konkretne korake, stack izbiro, in copy-paste Copilot prompte** za implementacijo vseh 10 M2 funkcionalnosti.

---

## 📦 Stack (Privzeto)

### Backend
- **FastAPI** (Python 3.11+)
- **PostgreSQL** 15
- **SQLAlchemy** 2.0 + Alembic
- **APScheduler** (urniki/cron)
- **Pydantic** v2
- **Celery + Redis** (opcijsko, za težje jobe)

### Frontend
- **React** 18 + **Vite** 5
- **TypeScript** 5.2
- **Tailwind CSS**
- **shadcn/ui** komponente

### Auth/SSO
- **Keycloak** (OIDC) - lahko zamenjate z Auth0/Azure AD

### PDF
- **WeasyPrint** (že implementiran)
- **Playwright/Puppeteer** (alternativa)

### Telemetry
- **OpenTelemetry SDK** (OTel)
- **OTLP exporter** → Grafana Tempo/OTel Collector

### IaC
- **Terraform** za AWS (VPC, RDS, ECS Fargate, ALB, S3, ACM)

---

## 🗄️ Model Podatkov (M2 Razširitev)

### Novi Entity-ji & Polja

```python
# organisations (razširitev obstoječe tabele)
class Organization(Base):
    __tablename__ = "orgs"
    
    id: UUID
    name: str
    logo_url: Optional[str]  # NEW - za brandable PDF
    oidc_client_id: Optional[str]  # NEW - za SSO
    primary_color: str = "#2563eb"  # NEW - branding
    created_at: datetime

# teams (NOVO)
class Team(Base):
    __tablename__ = "teams"
    
    id: UUID
    org_id: UUID  # FK → organisations
    name: str
    description: Optional[str]
    created_at: datetime

# users (razširitev obstoječe tabele)
class User(Base):
    __tablename__ = "users"
    
    id: UUID
    org_id: UUID
    team_id: Optional[UUID]  # NEW - FK → teams
    oidc_sub: Optional[str]  # NEW - OIDC subject identifier
    email: str
    full_name: str
    role: UserRole  # admin, org_manager, team_manager, viewer
    created_at: datetime

# domains (NOVO - replace hardcoded)
class Domain(Base):
    __tablename__ = "domains"
    
    id: UUID
    key: str  # governance, asset, access, ...
    title: str  # "Governance & Risk", "Asset Management", ...
    description: Optional[str]
    order: int  # prikaz v UI
    created_at: datetime

# questionnaires (NOVO - versioning)
class Questionnaire(Base):
    __tablename__ = "questionnaires"
    
    id: UUID
    org_id: Optional[UUID]  # NULL = global, ali per-org custom
    version: str  # "1.0", "2.0-NIS2", ...
    title: str
    is_active: bool
    levels: int  # max nesting depth (1-4)
    created_at: datetime

# questions (NOVO - multi-level)
class Question(Base):
    __tablename__ = "questions"
    
    id: UUID
    questionnaire_id: UUID  # FK → questionnaires
    domain_id: UUID  # FK → domains
    parent_question_id: Optional[UUID]  # FK → questions (self-reference)
    level: int  # 1 = root, 2 = child, 3 = grandchild, ...
    code: str  # "GOV-Q1", "GOV-Q1-A", ...
    text: str
    type: str  # likert, boolean, text, multiple_choice
    options_json: Optional[dict]  # {"choices": ["A", "B", "C"]}
    conditional_logic: Optional[dict]  # {"show_if": {"parent_score": "<3"}}
    nis2_article: Optional[str]  # "Article 21(2)(a)"
    iso27001_control: Optional[str]  # "A.5.1.1"
    order: int
    created_at: datetime

# weights (NOVO - prilagodljive teže)
class DomainWeight(Base):
    __tablename__ = "weights"
    
    id: UUID
    questionnaire_id: UUID  # FK → questionnaires
    domain_id: UUID  # FK → domains
    weight: float  # 0.5 - 2.0, default 1.0
    set_by_user_id: UUID  # FK → users (audit)
    created_at: datetime

# assessments (razširitev obstoječe tabele)
class Assessment(Base):
    __tablename__ = "assessments"
    
    id: UUID
    org_id: UUID
    team_id: Optional[UUID]  # NEW - FK → teams
    questionnaire_id: UUID  # NEW - FK → questionnaires
    version: int  # deprecated, use questionnaire_id
    state: str  # draft, in_progress, finalized
    created_at: datetime
    due_at: Optional[datetime]  # NEW - za reminders
    completed_at: Optional[datetime]

# responses (NOVO - replace assessment_answers)
class Response(Base):
    __tablename__ = "responses"
    
    id: UUID
    assessment_id: UUID  # FK → assessments
    question_id: UUID  # FK → questions
    value_json: dict  # {"score": 3, "note": "...", "selected": ["A", "B"]}
    created_by: UUID  # FK → users
    created_at: datetime

# scores (NOVO - calculated scores cache)
class Score(Base):
    __tablename__ = "scores"
    
    id: UUID
    assessment_id: UUID  # FK → assessments
    domain_id: UUID  # FK → domains
    raw_score: float  # avg without weights
    weighted_score: float  # with domain weights applied
    calculated_at: datetime

# recommendations (NOVO - rules engine output)
class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id: UUID
    assessment_id: UUID  # FK → assessments
    domain_id: Optional[UUID]  # FK → domains (nullable for global)
    title: str
    body: str
    severity: str  # critical, high, medium, low
    rule_id: Optional[str]  # reference to rule that triggered
    nis2_article: Optional[str]
    created_at: datetime

# schedules (NOVO - reminder scheduler)
class Schedule(Base):
    __tablename__ = "schedules"
    
    id: UUID
    org_id: UUID  # FK → organisations
    cron: str  # "0 9 * * 1" = every Monday 9am
    interval_months: int  # 3, 6, 12
    reminder_days_before: int  # 14 = remind 14 days before due
    next_run_at: datetime
    channel: str  # email, webhook, slack
    template_id: Optional[str]
    enabled: bool
    created_at: datetime

# imports (NOVO - CSV import tracking)
class Import(Base):
    __tablename__ = "imports"
    
    id: UUID
    org_id: UUID  # FK → organisations
    kind: str  # csv, excel
    status: str  # pending, processing, completed, failed
    storage_key: str  # S3 path or local file path
    rows_total: int
    rows_processed: int
    rows_failed: int
    error_json: Optional[dict]
    created_by: UUID  # FK → users
    created_at: datetime
    completed_at: Optional[datetime]

# rules (NOVO - rules engine)
class Rule(Base):
    __tablename__ = "rules"
    
    id: UUID
    name: str
    description: str
    conditions_json: dict  # {"operator": "AND", "rules": [...]}
    action_json: dict  # {"type": "recommendation", "severity": "high", ...}
    severity: str
    enabled: bool
    created_at: datetime
```

---

## 🛠️ Implementacija po Točkah

---

### 1️⃣ Večnivojski vprašalnik (NIS2 mapiranje)

#### **Cilj**: Podpora za multi-level vprašanja z `parent_question_id` in branching logiko.

#### **Koraki**:

1. **Migracija**: Dodaj tabele `domains`, `questionnaires`, `questions`, `responses`
2. **Backend**: Endpoints za drevo vprašanj
3. **Frontend**: Komponenta `QuestionTree` z drill-down

#### **Backend Copilot Prompt**:

```
Generate FastAPI models and SQLAlchemy schemas for questionnaires, questions (with parent_question_id, level), assessments, and responses. 

Provide CRUD endpoints:
- GET /api/questionnaires - list all active questionnaires
- GET /api/questionnaires/{id} - get questionnaire details
- GET /api/questionnaires/{id}/tree - return questions grouped by domain and nested by parent_question_id (JSON tree structure)
- POST /api/assessments - create assessment from questionnaire
- POST /api/assessments/{id}/responses - save answer and return next questions based on conditional logic

Use SQLAlchemy 2.0 mapped_column syntax, Pydantic v2 schemas, and include docstrings.
```

#### **Frontend Copilot Prompt**:

```
Build a React TypeScript component QuestionTree that renders a multi-level questionnaire with branching logic.

Features:
- Fetch GET /api/questionnaires/:id/tree on mount
- Display domains as collapsible sections
- Render parent questions first (level=1)
- When parent is answered, show child questions (level=2+) below it
- Show progress indicator (questions answered / total)
- Save answers via POST /api/assessments/:id/responses on each answer
- Use Tailwind CSS and shadcn/ui components (Accordion, Button, RadioGroup)

Export as default function QuestionTree({ assessmentId }: Props).
```

#### **Endpoints**:

```python
# backend/app/api/questionnaires.py
@router.get("/{id}/tree")
async def get_questionnaire_tree(
    id: UUID,
    db: Session = Depends(get_db)
) -> QuestionnaireTreeResponse:
    """
    Returns nested question tree grouped by domains.
    
    Response structure:
    {
      "questionnaire": {...},
      "domains": [
        {
          "id": "...",
          "title": "Governance",
          "questions": [
            {
              "id": "...",
              "code": "GOV-Q1",
              "text": "...",
              "level": 1,
              "children": [
                {
                  "id": "...",
                  "code": "GOV-Q1-A",
                  "text": "...",
                  "level": 2,
                  "conditional_logic": {"show_if": {"parent_score": "<3"}},
                  "children": []
                }
              ]
            }
          ]
        }
      ]
    }
    """
    pass
```

---

### 2️⃣ Prilagodljiva teža domen

#### **Cilj**: Admin lahko nastavi custom uteži (0.5-2.0) za vsako domeno.

#### **Koraki**:

1. **Migracija**: Tabela `weights`
2. **Backend**: Endpoints za CRUD weights + weighted scoring
3. **Frontend**: Admin UI z sliderji

#### **Backend Copilot Prompt**:

```
Implement domain weights for scoring in FastAPI + PostgreSQL.

Add:
- weights table (questionnaire_id, domain_id, weight FLOAT default 1.0)
- PUT /api/questionnaires/{id}/weights - update weights (array of {domain_id, weight})
- GET /api/questionnaires/{id}/weights - get current weights
- Modify POST /api/assessments/{id}/score to apply weights:
  * weighted_score = raw_score * domain_weight
  * overall_weighted = sum(domain_weighted) / sum(weights)

Use SQLAlchemy, Pydantic schemas, and return both raw and weighted scores in response.
```

#### **Frontend Copilot Prompt**:

```
Create a React component DomainWeightSettings for admin to adjust domain weights.

Features:
- Fetch GET /api/questionnaires/:id/weights on mount
- Display each domain with a slider (range 0.5 - 2.0, step 0.1)
- Show weight value (e.g., "1.5x") next to slider
- Preview weighted overall score calculation
- Save button calls PUT /api/questionnaires/:id/weights
- Use shadcn/ui Slider and Card components

Export as default function DomainWeightSettings({ questionnaireId }: Props).
```

#### **Scoring Logic**:

```python
# backend/app/services/scoring.py
def compute_weighted_scores(
    assessment_id: UUID,
    db: Session
) -> Dict[str, float]:
    """
    Calculate weighted scores for each domain.
    
    Formula:
    - raw_score = avg(responses in domain)
    - weight = domain_weight (default 1.0)
    - weighted_score = raw_score * weight
    - overall = sum(weighted_scores) / sum(weights)
    """
    assessment = db.query(Assessment).get(assessment_id)
    weights = db.query(DomainWeight).filter(
        DomainWeight.questionnaire_id == assessment.questionnaire_id
    ).all()
    
    weight_map = {w.domain_id: w.weight for w in weights}
    
    # Calculate per domain
    domain_scores = {}
    for domain in db.query(Domain).all():
        responses = db.query(Response).join(Question).filter(
            Response.assessment_id == assessment_id,
            Question.domain_id == domain.id
        ).all()
        
        if not responses:
            continue
        
        raw = sum(r.value_json.get('score', 0) for r in responses) / len(responses)
        weight = weight_map.get(domain.id, 1.0)
        weighted = raw * weight
        
        domain_scores[domain.key] = {
            'raw': round(raw, 2),
            'weighted': round(weighted, 2),
            'weight': weight
        }
    
    # Overall weighted
    total_weighted = sum(d['weighted'] for d in domain_scores.values())
    total_weight = sum(d['weight'] for d in domain_scores.values())
    overall = total_weighted / total_weight if total_weight > 0 else 0
    
    return {
        'domains': domain_scores,
        'overall_raw': round(sum(d['raw'] for d in domain_scores.values()) / len(domain_scores), 2),
        'overall_weighted': round(overall, 2)
    }
```

---

### 3️⃣ CSV Import/Export ocen

#### **Cilj**: Export rezultatov v CSV/Excel, import bulk odgovorov.

#### **Koraki**:

1. **Backend**: Export streaming CSV, Import validation + upsert
2. **Frontend**: Download/Upload komponente

#### **Backend Copilot Prompt**:

```
Add CSV export and import for assessments in FastAPI.

Export:
- GET /api/assessments/{id}/export.csv - stream CSV with headers:
  * domain, question_code, question_text, answer_score, note, raw_score, weighted_score
- Use StreamingResponse with CSV writer
- Include summary row at end (overall scores)

Import:
- POST /api/imports - accept multipart/form-data file upload
- Save to S3 or local storage (./uploads/{uuid}.csv)
- Create Import record (status=pending)
- Background task (or Celery):
  * Parse CSV, validate columns
  * Map question_code to question_id
  * Check org permissions
  * Upsert Response records
  * Update Import status (completed/failed)
- Return import_id and summary

Use pandas for CSV parsing, pydantic for validation, and SQLAlchemy for upsert.
```

#### **Frontend Copilot Prompt**:

```
Create React components for CSV export/import:

1. ExportButton component:
   - Button "Export CSV"
   - On click: download /api/assessments/:id/export.csv
   - Show loading state during download

2. ImportDialog component:
   - Button "Import CSV" opens dialog
   - File upload (drag-and-drop or click)
   - Validate file type (.csv, .xlsx)
   - POST /api/imports with multipart form
   - Show progress (pending → processing → completed)
   - Display summary: rows_total, rows_processed, rows_failed
   - Show errors if any

Use shadcn/ui Dialog, Button, Progress, and axios for API calls.
```

#### **CSV Format Example**:

```csv
domain,question_code,question_text,answer_score,note,raw_score,weighted_score
governance,GOV-Q1,"Ali ima vaša organizacija dokumentirano politiko...",3,"Imamo dokument",2.8,2.8
governance,GOV-Q2,"Ali je imenovan odgovorni za informacijsko varnost...",4,"",2.8,2.8
asset,ASS-Q1,"Ali imate celovit seznam vseh informacijskih sredstev...",2,"Delno",3.2,3.2
```

---

### 4️⃣ Schedules za "opomnike na ponovno oceno" (cron)

#### **Cilj**: Avtomatsko pošiljanje emailov za reassessment na X mesecev.

#### **Koraki**:

1. **Migracija**: Tabela `schedules`
2. **Backend**: APScheduler job, email sending
3. **Frontend**: Admin UI za schedule management

#### **Backend Copilot Prompt**:

```
Integrate APScheduler with FastAPI for assessment reminders.

Setup:
- Add APScheduler to FastAPI lifespan events
- Configure job to run every 10 minutes
- Job logic:
  * Find assessments where completed_at + interval_months < now + reminder_days_before
  * Find matching schedules (org_id, enabled=true, channel=email)
  * Send email via SMTP (use Jinja2 template)
  * Log sent reminders in audit_logs

Endpoints:
- POST /api/orgs/{org_id}/schedules - create schedule
- GET /api/orgs/{org_id}/schedules - list schedules
- PUT /api/schedules/{id} - update schedule
- DELETE /api/schedules/{id} - delete schedule

Use APScheduler BackgroundScheduler, smtplib for email, and Jinja2 for templates.
```

#### **Frontend Copilot Prompt**:

```
Create a React component ScheduleManager for org admins.

Features:
- List all schedules (GET /api/orgs/:orgId/schedules)
- Add new schedule form:
  * Interval: dropdown (3 months, 6 months, 12 months)
  * Reminder days before: input (default 14)
  * Channel: dropdown (email, webhook)
  * Email template: select predefined templates
- Edit/Delete schedule
- Toggle enabled/disabled switch
- Show next_run_at timestamp

Use shadcn/ui Table, Form, Select, Switch components.
```

#### **Email Template**:

```jinja2
{# templates/reminder_email.html #}
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background: #2563eb; color: white; padding: 20px; }
    .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Reminder: Cybersecurity Maturity Assessment Due</h1>
  </div>
  
  <div style="padding: 20px;">
    <p>Hello {{ user.full_name }},</p>
    
    <p>Your organization <strong>{{ org.name }}</strong> is due for a cybersecurity maturity reassessment.</p>
    
    <p>Last assessment completed: <strong>{{ last_assessment_date }}</strong></p>
    <p>Next assessment due: <strong>{{ due_date }}</strong></p>
    
    <p>
      <a href="{{ app_url }}/assessments/new" class="button">Start New Assessment</a>
    </p>
    
    <p>Thank you,<br>Sec-Maturity Team</p>
  </div>
</body>
</html>
```

---

### 5️⃣ Organisations → Teams (oddelki)

#### **Cilj**: Podpora za oddelke znotraj organizacije, team-level assessments.

#### **Koraki**:

1. **Migracija**: Tabela `teams`, `team_id` v `users` in `assessments`
2. **Backend**: RBAC enforcement, team aggregation
3. **Frontend**: Team selector, team comparison dashboard

#### **Backend Copilot Prompt**:

```
Extend the data model with teams (departments) for FastAPI + PostgreSQL.

Add:
- teams table (id, org_id FK, name, description)
- team_id column to users and assessments
- RBAC middleware:
  * admin: see all orgs
  * org_manager: see all teams in their org
  * team_manager: see only their team
  * viewer: read-only their team

Endpoints:
- GET /api/orgs/{org_id}/teams - list teams
- POST /api/orgs/{org_id}/teams - create team
- GET /api/teams/{id}/summary - aggregate scores from team's assessments
- GET /api/teams/{id}/assessments - list team assessments

Use SQLAlchemy relationships, Pydantic schemas, and dependency injection for RBAC checks.
```

#### **Frontend Copilot Prompt**:

```
Create React components for team management:

1. TeamManager component:
   - List teams (GET /api/orgs/:orgId/teams)
   - Add team dialog (name, description)
   - Edit/Delete team

2. TeamSelector component:
   - Dropdown to select team (for filtering)
   - Show "All Teams" option for org_manager

3. TeamComparisonDashboard component:
   - Fetch summaries for all teams (GET /api/teams/:id/summary)
   - Display side-by-side radar charts (one per team)
   - Use Recharts RadarChart
   - Highlight best/worst performing teams

Use shadcn/ui components (Select, Dialog, Card, Table).
```

#### **RBAC Helper**:

```python
# backend/app/core/rbac.py
from fastapi import HTTPException, Depends
from app.core.deps import get_current_user
from app.models.user import User, UserRole

def check_team_access(
    team_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify user has access to team."""
    if user.role == UserRole.ADMIN:
        return  # Admin sees all
    
    team = db.query(Team).get(team_id)
    if not team:
        raise HTTPException(404, "Team not found")
    
    if user.role == UserRole.ORG_MANAGER:
        if team.org_id != user.org_id:
            raise HTTPException(403, "Access denied")
    
    elif user.role == UserRole.TEAM_MANAGER:
        if team.id != user.team_id:
            raise HTTPException(403, "Access denied")
    
    elif user.role == UserRole.VIEWER:
        if team.id != user.team_id:
            raise HTTPException(403, "Access denied")
```

---

### 6️⃣ SSO (OIDC)

#### **Cilj**: Integracija z Keycloak za enterprise SSO.

#### **Koraki**:

1. **Keycloak Setup**: Realm, client, redirect URIs
2. **Backend**: JWKS discovery, JWT validation, user provisioning
3. **Frontend**: PKCE flow, login redirect

#### **Backend Copilot Prompt**:

```
Add OIDC authentication with Keycloak to FastAPI.

Features:
- JWT validation middleware using PyJWT
- JWKS discovery from /.well-known/openid-configuration
- Validate aud (audience), iss (issuer), exp (expiration)
- On first login (sub not found):
  * Upsert user by sub and email
  * Map groups claim to role (e.g., "sec-admins" → admin)
  * Assign org_id by email domain mapping
- Return custom JWT (or pass-through Keycloak token)

Endpoints:
- GET /api/auth/oidc/login - redirect to Keycloak authorize URL
- GET /api/auth/oidc/callback?code=... - exchange code for token, validate, upsert user, return JWT
- GET /api/auth/me - return current user (from JWT)

Use python-jose[cryptography] for JWT, requests for JWKS fetch, and Pydantic for config.
```

#### **Frontend Copilot Prompt**:

```
Add OIDC login flow to React TypeScript app.

Features:
- Login button "Sign in with Keycloak"
- On click: redirect to GET /api/auth/oidc/login
- Backend redirects to Keycloak
- User authenticates, Keycloak redirects to /api/auth/oidc/callback
- Backend returns JWT
- Frontend stores JWT in localStorage
- Redirect to /dashboard

Use oidc-client-ts library or simple window.location redirect.
Add axios interceptor to include JWT in Authorization header.
```

#### **Keycloak Config**:

```yaml
# docker-compose.yml
services:
  keycloak:
    image: quay.io/keycloak/keycloak:23.0
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    command: start-dev
    ports:
      - "8080:8080"
```

**Realm Export** (import via Keycloak UI):

```json
{
  "realm": "sec-maturity",
  "enabled": true,
  "clients": [
    {
      "clientId": "sec-maturity-app",
      "enabled": true,
      "publicClient": false,
      "redirectUris": ["http://localhost:5173/*", "http://localhost:8000/api/auth/oidc/callback"],
      "webOrigins": ["http://localhost:5173"],
      "protocol": "openid-connect"
    }
  ],
  "groups": [
    {"name": "sec-admins"},
    {"name": "sec-managers"},
    {"name": "sec-viewers"}
  ]
}
```

---

### 7️⃣ Naprednejši rules engine (več pogojev)

#### **Cilj**: JSON-based rules za avtomatsko generiranje priporočil.

#### **Koraki**:

1. **Migracija**: Tabela `rules`, `recommendations`
2. **Backend**: Rules evaluator, recommendation generator
3. **Frontend**: Rules builder UI

#### **Backend Copilot Prompt**:

```
Implement a JSON-based rules engine for generating recommendations in FastAPI.

Rules format:
{
  "name": "Low Governance Score",
  "conditions": {
    "operator": "AND",
    "rules": [
      {"type": "domain_score", "domain": "governance", "operator": "<", "value": 3.0},
      {"type": "question_value", "question_code": "GOV-Q1", "operator": "==", "value": 0}
    ]
  },
  "action": {
    "type": "recommendation",
    "title": "Establish IT Security Policy",
    "body": "NIS2 requires documented security policy...",
    "severity": "high",
    "nis2_article": "Article 21(2)(a)"
  }
}

Features:
- Evaluate rules after assessment finalization
- Support operators: <, <=, >, >=, ==, !=
- Support AND/OR/NOT combinators
- Generate recommendations records
- CRUD endpoints for rules

Endpoints:
- GET /api/rules - list all rules
- POST /api/rules - create rule
- PUT /api/rules/{id} - update rule
- DELETE /api/rules/{id} - delete rule
- POST /api/assessments/{id}/evaluate-rules - trigger evaluation

Use SQLAlchemy, Pydantic, and Python operator module.
```

#### **Frontend Copilot Prompt**:

```
Create a React visual rules builder component.

Features:
- Drag-and-drop interface for building rules
- Condition types: domain_score, question_value
- Operators: <, >, ==, !=
- AND/OR group combinators
- Action configuration: title, body, severity
- Save rule via POST /api/rules
- Test rule: select assessment, click "Test", show matched recommendations

Use react-dnd or @dnd-kit/core for drag-and-drop.
Use shadcn/ui components for form inputs.
```

#### **Rules Evaluator**:

```python
# backend/app/services/rules_engine.py
import operator as op
from typing import Dict, List, Any

class RulesEngine:
    OPERATORS = {
        '<': op.lt,
        '<=': op.le,
        '>': op.gt,
        '>=': op.ge,
        '==': op.eq,
        '!=': op.ne,
    }
    
    def evaluate_rule(self, rule: Rule, context: Dict[str, Any]) -> bool:
        """Evaluate single rule against context."""
        conditions = rule.conditions_json
        return self._evaluate_conditions(conditions, context)
    
    def _evaluate_conditions(self, conditions: Dict, context: Dict) -> bool:
        """Recursively evaluate conditions."""
        operator_logic = conditions.get('operator', 'AND')
        rules_list = conditions.get('rules', [])
        
        results = [self._evaluate_condition(r, context) for r in rules_list]
        
        if operator_logic == 'AND':
            return all(results)
        elif operator_logic == 'OR':
            return any(results)
        elif operator_logic == 'NOT':
            return not any(results)
        
        return False
    
    def _evaluate_condition(self, condition: Dict, context: Dict) -> bool:
        """Evaluate single condition."""
        cond_type = condition['type']
        
        if cond_type == 'domain_score':
            domain = condition['domain']
            op_str = condition['operator']
            value = condition['value']
            
            score = context['domain_scores'].get(domain, 0)
            return self.OPERATORS[op_str](score, value)
        
        elif cond_type == 'question_value':
            question_code = condition['question_code']
            op_str = condition['operator']
            value = condition['value']
            
            answer = context['responses'].get(question_code, {}).get('score', 0)
            return self.OPERATORS[op_str](answer, value)
        
        return False
    
    def generate_recommendations(
        self,
        assessment_id: UUID,
        db: Session
    ) -> List[Recommendation]:
        """Evaluate all rules and generate recommendations."""
        assessment = db.query(Assessment).get(assessment_id)
        
        # Build context
        context = self._build_context(assessment, db)
        
        # Get all enabled rules
        rules = db.query(Rule).filter(Rule.enabled == True).all()
        
        recommendations = []
        for rule in rules:
            if self.evaluate_rule(rule, context):
                rec = Recommendation(
                    assessment_id=assessment_id,
                    title=rule.action_json['title'],
                    body=rule.action_json['body'],
                    severity=rule.action_json['severity'],
                    rule_id=str(rule.id),
                    nis2_article=rule.action_json.get('nis2_article')
                )
                db.add(rec)
                recommendations.append(rec)
        
        db.commit()
        return recommendations
```

---

### 8️⃣ Brandable PDF (logo org)

#### **Cilj**: Custom logo, barve, watermark v PDF poročilih.

#### **Koraki**:

1. **Backend**: Logo upload, Jinja2 template z branding
2. **Frontend**: Branding settings UI

#### **Backend Copilot Prompt**:

```
Generate a branded PDF report with WeasyPrint in FastAPI.

Features:
- Upload org logo: POST /api/orgs/{org_id}/logo (multipart file)
- Store logo in S3 or ./static/logos/{org_id}.png
- Update org.logo_url in database
- PDF template (Jinja2 + WeasyPrint):
  * Title page: org logo, org name, assessment date, questionnaire version
  * Summary: overall score, domain scores (table)
  * Domain charts: render RadarChart as inline SVG or use Chart.js server-side
  * Recommendations: list by severity (critical → low)
  * Appendix: all questions and answers
  * Footer: org.name, page numbers, "Confidential" watermark

Endpoint:
- GET /api/assessments/{id}/pdf - generate and stream PDF

Use WeasyPrint, Jinja2, and Pillow for image processing.
```

#### **Frontend Copilot Prompt**:

```
Create a React component BrandingSettings for org admins.

Features:
- Logo upload (drag-and-drop or click)
- Image preview
- Primary color picker (hex color)
- Header/footer text inputs
- Watermark text (optional)
- Save button: POST /api/orgs/:orgId/branding
- PDF preview: download test PDF

Use shadcn/ui components (Card, Input, Button).
Use react-colorful for color picker.
```

#### **PDF Template**:

```html
<!-- backend/templates/assessment_pdf.html -->
<!DOCTYPE html>
<html>
<head>
  <style>
    @page {
      size: A4;
      margin: 2cm;
      @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
      }
    }
    
    :root {
      --primary-color: {{ branding.primary_color or '#2563eb' }};
    }
    
    .cover {
      page-break-after: always;
      text-align: center;
      padding-top: 30%;
    }
    
    .logo {
      max-width: 200px;
      margin-bottom: 40px;
    }
    
    .header {
      background-color: var(--primary-color);
      color: white;
      padding: 20px;
      margin-bottom: 30px;
    }
    
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 100px;
      opacity: 0.1;
      z-index: -1;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    
    th {
      background-color: var(--primary-color);
      color: white;
    }
  </style>
</head>
<body>
  {% if branding.watermark_text %}
  <div class="watermark">{{ branding.watermark_text }}</div>
  {% endif %}
  
  <!-- Cover Page -->
  <div class="cover">
    {% if branding.logo_url %}
    <img src="{{ branding.logo_url }}" class="logo" alt="Logo">
    {% endif %}
    
    <h1>Cybersecurity Maturity Assessment</h1>
    <h2>{{ org.name }}</h2>
    <p>Date: {{ assessment.completed_at.strftime('%d.%m.%Y') }}</p>
    <p>Version: {{ questionnaire.version }}</p>
  </div>
  
  <!-- Summary Page -->
  <div class="header">
    <h1>Executive Summary</h1>
  </div>
  
  <p><strong>Overall Score:</strong> {{ overall_score }} / 5.0</p>
  
  <h2>Domain Scores</h2>
  <table>
    <thead>
      <tr>
        <th>Domain</th>
        <th>Raw Score</th>
        <th>Weight</th>
        <th>Weighted Score</th>
      </tr>
    </thead>
    <tbody>
      {% for domain_key, scores in domain_scores.items() %}
      <tr>
        <td>{{ domain_names[domain_key] }}</td>
        <td>{{ scores.raw }}</td>
        <td>{{ scores.weight }}x</td>
        <td>{{ scores.weighted }}</td>
      </tr>
      {% endfor %}
    </tbody>
  </table>
  
  <!-- Recommendations -->
  <div style="page-break-before: always;">
    <div class="header">
      <h1>Recommendations</h1>
    </div>
    
    {% for rec in recommendations %}
    <div style="margin-bottom: 20px; border-left: 4px solid 
         {% if rec.severity == 'critical' %}#dc2626
         {% elif rec.severity == 'high' %}#ea580c
         {% elif rec.severity == 'medium' %}#ca8a04
         {% else %}#16a34a{% endif %};
         padding-left: 15px;">
      <h3>{{ rec.title }}</h3>
      <p><strong>Severity:</strong> {{ rec.severity.upper() }}</p>
      {% if rec.nis2_article %}
      <p><strong>NIS2 Reference:</strong> {{ rec.nis2_article }}</p>
      {% endif %}
      <p>{{ rec.body }}</p>
    </div>
    {% endfor %}
  </div>
  
  <!-- Appendix -->
  <div style="page-break-before: always;">
    <div class="header">
      <h1>Detailed Responses</h1>
    </div>
    
    {% for domain_key, questions in responses_by_domain.items() %}
    <h2>{{ domain_names[domain_key] }}</h2>
    <table>
      <thead>
        <tr>
          <th>Question</th>
          <th>Score</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        {% for q in questions %}
        <tr>
          <td>{{ q.text }}</td>
          <td>{{ q.score }} / 5</td>
          <td>{{ q.note or '-' }}</td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
    {% endfor %}
  </div>
</body>
</html>
```

---

### 9️⃣ Telemetry (OpenTelemetry)

#### **Cilj**: Distributed tracing, metrics, logs za observability.

#### **Koraki**:

1. **Backend**: OpenTelemetry SDK, OTLP exporter
2. **Infrastructure**: OTel Collector, Grafana Tempo/Prometheus
3. **Frontend**: Custom events (opcijsko)

#### **Backend Copilot Prompt**:

```
Add OpenTelemetry tracing and metrics to FastAPI application.

Setup:
- Install: opentelemetry-api, opentelemetry-sdk, opentelemetry-instrumentation-fastapi, opentelemetry-instrumentation-sqlalchemy, opentelemetry-exporter-otlp
- Configure TracerProvider with OTLP exporter (endpoint from env var OTEL_EXPORTER_OTLP_ENDPOINT)
- Instrument FastAPI app and SQLAlchemy engine
- Add custom spans for:
  * Assessment scoring (app.services.scoring.compute_scores)
  * PDF generation (app.services.pdf.generate_pdf)
  * Rules evaluation (app.services.rules_engine.evaluate_rules)
- Add custom metrics:
  * assessments_created_total (counter)
  * login_attempts_total (counter)
  * pdf_generation_duration_seconds (histogram)

Use OpenTelemetry SDK, context propagation, and span attributes.
```

#### **docker-compose.yml additions**:

```yaml
services:
  otel-collector:
    image: otel/opentelemetry-collector:0.91.0
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./deploy/otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317"  # OTLP gRPC
      - "4318:4318"  # OTLP HTTP
  
  tempo:
    image: grafana/tempo:latest
    command: ["-config.file=/etc/tempo.yaml"]
    volumes:
      - ./deploy/tempo.yaml:/etc/tempo.yaml
    ports:
      - "3200:3200"  # Tempo UI
      - "4317"  # OTLP gRPC receiver
  
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./deploy/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
  
  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
    ports:
      - "3000:3000"
    volumes:
      - ./deploy/grafana-datasources.yaml:/etc/grafana/provisioning/datasources/datasources.yaml
```

#### **OpenTelemetry Config**:

```python
# backend/app/telemetry.py
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
import os

def setup_telemetry(app, engine):
    """Initialize OpenTelemetry tracing and metrics."""
    
    # Tracer
    trace_provider = TracerProvider()
    otlp_exporter = OTLPSpanExporter(
        endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317"),
        insecure=True
    )
    trace_provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
    trace.set_tracer_provider(trace_provider)
    
    # Metrics
    metric_reader = PeriodicExportingMetricReader(
        OTLPMetricExporter(
            endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317"),
            insecure=True
        )
    )
    meter_provider = MeterProvider(metric_readers=[metric_reader])
    metrics.set_meter_provider(meter_provider)
    
    # Instrument
    FastAPIInstrumentor.instrument_app(app)
    SQLAlchemyInstrumentor().instrument(engine=engine)
    
    return trace.get_tracer(__name__), metrics.get_meter(__name__)
```

**Usage**:

```python
# backend/app/services/scoring.py
from app.telemetry import tracer, meter

# Custom span
@tracer.start_as_current_span("compute_scores")
def compute_scores(assessment_id: UUID, db: Session):
    span = trace.get_current_span()
    span.set_attribute("assessment_id", str(assessment_id))
    
    # ... scoring logic
    
    span.set_attribute("overall_score", overall)
    return scores

# Custom metric
assessments_counter = meter.create_counter(
    "assessments_created_total",
    description="Total assessments created"
)

assessments_counter.add(1, {"org_id": str(org_id)})
```

---

### 🔟 IaC (Terraform) za cloud

#### **Cilj**: Terraform modules za production AWS deployment.

#### **Koraki**:

1. **Terraform Modules**: VPC, RDS, ECS Fargate, ALB, S3, ACM
2. **CI/CD**: GitHub Actions workflow
3. **Secrets**: AWS Secrets Manager

#### **Terraform Copilot Prompt**:

```
Create Terraform modules for deploying Sec-Maturity Lite to AWS.

Modules:
1. VPC: 
   - 2 public subnets, 2 private subnets (multi-AZ)
   - Internet Gateway, NAT Gateway
   - Route tables

2. RDS PostgreSQL:
   - Engine: postgres 15
   - Instance: db.t3.micro (or db.t4g.small for prod)
   - Multi-AZ: true for prod, false for staging
   - Backup retention: 7 days
   - Encrypted storage
   - Security group: allow 5432 from ECS tasks

3. ECS Fargate (Backend):
   - Cluster: sec-maturity-{env}
   - Task Definition: FastAPI container (512 CPU, 1024 MEM)
   - Service: 2 tasks (min), 10 tasks (max), auto-scaling
   - Security group: allow 8000 from ALB
   - Environment: DATABASE_URL (from Secrets Manager), JWT_SECRET, etc.

4. ALB:
   - Application Load Balancer (internet-facing)
   - Target group: ECS tasks on port 8000
   - Listener: HTTPS (port 443) with ACM certificate
   - Redirect HTTP (80) → HTTPS (443)

5. ACM:
   - Certificate for domain (*.example.com)
   - DNS validation (Route53)

6. S3:
   - Bucket: sec-maturity-static-{env}
   - Public read for static assets
   - CloudFront distribution (optional)

7. Secrets Manager:
   - Secret: sec-maturity/{env}/db-password
   - Secret: sec-maturity/{env}/jwt-secret

Outputs:
- alb_dns_name
- rds_endpoint
- ecs_cluster_name

Use Terraform 1.6+, AWS provider 5.x, and variables for env (dev/staging/prod).
```

#### **Directory Structure**:

```
infra/
├── modules/
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── rds/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── ecs/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── alb/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── s3/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   │   └── ...
│   └── prod/
│       └── ...
└── README.md
```

#### **Example Module (VPC)**:

```hcl
# infra/modules/vpc/main.tf
variable "environment" {
  type = string
}

variable "cidr_block" {
  type    = string
  default = "10.0.0.0/16"
}

resource "aws_vpc" "main" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "sec-maturity-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.cidr_block, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  map_public_ip_on_launch = true

  tags = {
    Name = "sec-maturity-public-${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.cidr_block, 8, count.index + 100)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "sec-maturity-private-${count.index + 1}"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "sec-maturity-igw"
  }
}

resource "aws_eip" "nat" {
  count  = 1
  domain = "vpc"
}

resource "aws_nat_gateway" "main" {
  count         = 1
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "sec-maturity-nat"
  }
}

data "aws_availability_zones" "available" {}

output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}
```

#### **CI/CD Workflow**:

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main, staging, dev]

env:
  AWS_REGION: eu-west-1
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.eu-west-1.amazonaws.com

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.6.0
      
      - name: Terraform Init
        run: terraform init
        working-directory: infra/environments/${{ github.ref_name }}
      
      - name: Terraform Plan
        run: terraform plan -out=tfplan
        working-directory: infra/environments/${{ github.ref_name }}
      
      - name: Terraform Apply
        if: github.ref == 'refs/heads/main'
        run: terraform apply -auto-approve tfplan
        working-directory: infra/environments/${{ github.ref_name }}

  build-and-push:
    runs-on: ubuntu-latest
    needs: terraform
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to ECR
        run: aws ecr get-login-password --region ${{ env.AWS_REGION }} | docker login --username AWS --password-stdin ${{ env.ECR_REGISTRY }}
      
      - name: Build and Push Backend
        run: |
          docker build -t ${{ env.ECR_REGISTRY }}/sec-maturity-api:${{ github.sha }} ./backend
          docker push ${{ env.ECR_REGISTRY }}/sec-maturity-api:${{ github.sha }}
      
      - name: Build and Push Frontend
        run: |
          docker build -t ${{ env.ECR_REGISTRY }}/sec-maturity-web:${{ github.sha }} ./frontend
          docker push ${{ env.ECR_REGISTRY }}/sec-maturity-web:${{ github.sha }}
      
      - name: Update ECS Service
        run: |
          aws ecs update-service \
            --cluster sec-maturity-${{ github.ref_name }} \
            --service sec-maturity-api \
            --force-new-deployment
```

---

## 🎯 "Super-Prompt" za Copilot

Prilepi ta prompt v prazen `README-dev.md` in kopiraj delčke po potrebi:

```markdown
# Copilot Context

You are my coding pair for a **FastAPI + PostgreSQL + React/TS project** called **"Sec-Maturity Lite (M2)"**.

## Implement:

1. **Multi-level questionnaire with branching**
   - SQLAlchemy models: `questionnaires`, `questions` (with `parent_question_id`, `level`)
   - Endpoint: `GET /questionnaires/:id/tree` (nested JSON)

2. **Domain weight sliders and weighted scoring**
   - Table: `weights` (questionnaire_id, domain_id, weight)
   - Endpoint: `PUT /questionnaires/:id/weights`
   - Scoring: `weighted = raw * domain_weight`

3. **CSV export/import for assessments**
   - Export: stream CSV with headers (domain, question_code, answer, score)
   - Import: validate, upsert responses, return summary

4. **Reminders via APScheduler**
   - Cron job: check assessments older than 90 days
   - Send email via SMTP (Jinja2 templates)

5. **Org → Teams model and RBAC**
   - Table: `teams` (org_id FK)
   - RBAC: admin → all, org_manager → org, team_manager → team
   - Endpoint: `GET /teams/:id/summary` (aggregated scores)

6. **OIDC with Keycloak**
   - JWT validation (JWKS discovery, PyJWT)
   - User upsert on first login (sub, email, groups → role)
   - Endpoints: `/auth/oidc/login`, `/auth/oidc/callback`

7. **JSON rules engine that emits recommendations**
   - Table: `rules` (conditions_json, action_json)
   - Evaluate after finalization
   - Support: domain_score thresholds, question values, AND/OR

8. **Branded PDF via WeasyPrint**
   - Logo upload: `POST /orgs/:id/logo`
   - Template: Jinja2 (cover, summary, charts, recommendations, appendix)
   - Endpoint: `GET /assessments/:id/pdf`

9. **OpenTelemetry tracing/metrics**
   - Instrument: FastAPI, SQLAlchemy
   - Custom spans: scoring, PDF, rules
   - Exporter: OTLP → OTel Collector

10. **Terraform modules for AWS**
    - VPC, RDS Postgres, ECS Fargate, ALB (HTTPS), S3, ACM
    - CI/CD: GitHub Actions (terraform plan/apply, docker build/push)

## Code Style:

- **Backend**: FastAPI, SQLAlchemy 2.0 (`mapped_column`), Pydantic v2, docstrings
- **Frontend**: React FC, TypeScript, Tailwind, shadcn/ui
- **Small, testable chunks** with curl examples for each endpoint

## Current M1 Status:

- ✅ Basic RBAC (admin, manager, viewer)
- ✅ Hardcoded questions (27 total, 6 domains)
- ✅ Assessment wizard (Likert scale 0-5)
- ✅ Scoring + recommendations (YAML rules)
- ✅ PDF export (WeasyPrint)
- ✅ Dashboard (LineChart, RadarChart)
- ✅ Audit logs
- ✅ Docker Compose (PostgreSQL, FastAPI, Vite)

## Next Steps (M2):

- [ ] DB migrations (Alembic): domains, weights, teams, schedules, rules, recommendations
- [ ] Auth (OIDC): JWKS, role mapping, org scoping
- [ ] Scoring v2: weighted + rules engine → recommendations
- [ ] CSV and PDF: export/import, brandable reports
- [ ] Scheduler: APScheduler + email templates
- [ ] Telemetry: OTel (traces/metrics), dashboard
- [ ] IaC: Terraform baseline + CI/CD
```

---

## ✅ Next Steps Checklista

### Immediate (Week 1-2):
1. ✅ Create M2 backlog document
2. ✅ Create implementation guide
3. ⬜ **Alembic migrations**: Create new tables (domains, questionnaires, questions, teams, weights, schedules, rules, recommendations, imports)
4. ⬜ **Seed M2 data**: Populate domains, create default questionnaire, migrate hardcoded questions to DB
5. ⬜ **Multi-level questionnaire**: Backend endpoints + frontend QuestionTree component

### Short-term (Week 3-4):
6. ⬜ **Domain weights**: Admin UI + weighted scoring
7. ⬜ **CSV export/import**: Endpoints + frontend upload/download
8. ⬜ **Teams**: Model + RBAC + UI

### Mid-term (Week 5-7):
9. ⬜ **Rules engine**: JSON evaluator + recommendations generator
10. ⬜ **APScheduler**: Reminder cron job + email templates
11. ⬜ **Brandable PDF**: Logo upload + enhanced template

### Long-term (Week 8-12):
12. ⬜ **OIDC/SSO**: Keycloak integration + JWT validation
13. ⬜ **OpenTelemetry**: Tracing + metrics + Grafana dashboards
14. ⬜ **Terraform**: AWS modules + CI/CD pipeline

---

## 🔧 Tehnološke Odvisnosti (Nove)

```toml
# backend/pyproject.toml additions
[tool.poetry.dependencies]
python = "^3.11"
# ... existing deps
apscheduler = "^3.10.4"  # Cron scheduler
pandas = "^2.1.4"  # CSV processing
openpyxl = "^3.1.2"  # Excel export
python-jose = {extras = ["cryptography"], version = "^3.3.0"}  # JWT/OIDC
opentelemetry-api = "^1.21.0"
opentelemetry-sdk = "^1.21.0"
opentelemetry-instrumentation-fastapi = "^0.42b0"
opentelemetry-instrumentation-sqlalchemy = "^0.42b0"
opentelemetry-exporter-otlp = "^1.21.0"
```

```json
// frontend/package.json additions
{
  "dependencies": {
    // ... existing deps
    "oidc-client-ts": "^3.0.1",
    "react-colorful": "^5.6.1",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0"
  }
}
```

---

**Verzija**: 1.0  
**Datum**: 8. november 2025  
**Status**: Ready for Implementation 🚀
