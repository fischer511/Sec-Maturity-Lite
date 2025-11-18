# Sample Questions for Sec-Maturity-Lite Assessment

This file contains the 24 sample questions used in the assessment, organized by domain (4 questions per domain).

## Domains

### 1. Governance (GOV)
- **GOV-Q1**: Ali ima vaša organizacija dokumentirano politiko varovanja informacij?
- **GOV-Q2**: Ali je imenovan odgovorni za informacijsko varnost (CISO ali ekvivalent)?
- **GOV-Q3**: Ali izvajate redno letno oceno tveganj kibernetske varnosti?
- **GOV-Q4**: Ali imate vzpostavljen register informacijskih sredstev?

### 2. Asset Management (ASS)
- **ASS-Q1**: Ali imate celovit seznam vseh informacijskih sredstev (strojna in programska oprema)?
- **ASS-Q2**: Ali so vsa sredstva klasificirana glede na kritičnost?
- **ASS-Q3**: Ali imate vzpostavljen postopek za obvladovanje življenjskega cikla sredstev?
- **ASS-Q4**: Ali redno preverjate in posodabljate inventar sredstev?

### 3. Access Control (ACC)
- **ACC-Q1**: Ali uporabljate večfaktorsko avtentikacijo (MFA) za kritične sisteme?
- **ACC-Q2**: Ali imate formalen postopek za upravljanje dostopnih pravic?
- **ACC-Q3**: Ali izvajate redne preglede dostopnih pravic (access reviews)?
- **ACC-Q4**: Ali uporabljate principe najmanjših potrebnih privilegijev (least privilege)?

### 4. Operations & Monitoring (OPS)
- **OPS-Q1**: Ali imate centralizirano beleženje varnostnih dogodkov?
- **OPS-Q2**: Ali shranjujete dnevniške zapise vsaj 12 mesecev?
- **OPS-Q3**: Ali imate vzpostavljen proces za upravljanje varnostnih popravkov?
- **OPS-Q4**: Ali redno spremljate in analizirate varnostne dogodke?

### 5. Incident Response (INC)
- **INC-Q1**: Ali imate dokumentiran načrt odziva na incidente?
- **INC-Q2**: Ali je določena ekipa za odziv na incidente z jasnimi vlogami?
- **INC-Q3**: Ali izvajate redne vaje odziva na incidente?
- **INC-Q4**: Ali imate vzpostavljen postopek za prijavo in eskalacijo incidentov?

### 6. Business Continuity (BCP)
- **BCP-Q1**: Ali redno izdelujete varnostne kopije kritičnih podatkov?
- **BCP-Q2**: Ali testirate obnovitev podatkov iz varnostnih kopij?
- **BCP-Q3**: Ali imate dokumentiran načrt neprekinjenega poslovanja (BCP/DRP)?
- **BCP-Q4**: Ali izvajate letne vaje načrta neprekinjenega poslovanja?

## Scoring Scale

Each question is scored on a 0-5 scale:
- **0**: Not implemented / Not applicable
- **1**: Initial / Ad-hoc
- **2**: Repeatable / Documented
- **3**: Defined / Standardized
- **4**: Managed / Measured
- **5**: Optimizing / Continuous improvement

## Implementation Notes

These question codes (e.g., GOV-Q1) are used in:
- `AssessmentAnswer` model in the database
- Seed script (`backend/app/seed.py`)
- Frontend assessment wizard (to be implemented in M2)

For MVP (M1), the seed script generates answers with varying scores. In production, users would answer these questions through an interactive wizard interface.
