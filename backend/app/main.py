from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, users, orgs, assessments, audit, questions, teams, imports, domain_weights, tasks, documents

app = FastAPI(
    title="Sec-Maturity-Lite",
    description="SaaS tool for cybersecurity maturity self-assessment",
    version="0.1.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(orgs.router, prefix="/api/v1")
app.include_router(teams.router, prefix="/api/v1")
app.include_router(assessments.router, prefix="/api/v1")
app.include_router(assessments.orgs_router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")
app.include_router(questions.router, prefix="/api/v1")
app.include_router(imports.router, prefix="/api/v1")
app.include_router(domain_weights.router, prefix="/api/v1/domain-weights", tags=["domain-weights"])
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Sec-Maturity-Lite API", "version": "0.1.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
