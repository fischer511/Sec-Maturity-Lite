"""
Script to generate realistic test data for demonstration purposes.
Creates multiple assessments with varying scores across different time periods.
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.user import User
from app.models.org import Org
from app.models.team import Team
from app.models.assessment import Assessment, AssessmentDomain, AssessmentAnswer
from app.models.remediation_task import RemediationTask, TaskStatus, TaskPriority
import random

# Domains with Slovenian names
DOMAINS = {
    "asset_management": "Upravljanje sredstev",
    "business_continuity": "Poslovna kontinuiteta",
    "risk_management": "Upravljanje tveganj",
    "access_control": "Nadzor dostopa",
    "security_awareness": "Varnostna ozaveščenost",
    "incident_response": "Odziv na incidente",
    "data_protection": "Zaščita podatkov",
    "network_security": "Omrežna varnost",
}

SAMPLE_TASKS = [
    ("Implementacija dvofaktorske avtentikacije", "ACC-01", TaskPriority.high),
    ("Posodobitev varnostne politike", "GOV-01", TaskPriority.medium),
    ("Izvajanje rednih varnostnih pregledov", "GOV-02", TaskPriority.medium),
    ("Usposabljanje zaposlenih o phishing napadih", "OPS-01", TaskPriority.high),
    ("Vzpostavitev načrta za obnovitev", "INC-01", TaskPriority.high),
    ("Segmentacija omrežja", "OPS-02", TaskPriority.medium),
    ("Implementacija sistemov za odkrivanje vdorov", "OPS-03", TaskPriority.high),
    ("Redne varnostne kopije kritičnih sistemov", "INC-02", TaskPriority.high),
    ("Revizija uporabniških dostopov", "ACC-02", TaskPriority.medium),
    ("Šifriranje občutljivih podatkov", "ASS-01", TaskPriority.high),
    ("Posodobitev požarnih zidov", "OPS-04", TaskPriority.medium),
    ("Izvajanje penetracijskih testov", "GOV-03", TaskPriority.medium),
    ("Dokumentiranje varnostnih incidentov", "INC-03", TaskPriority.low),
    ("Implementacija DLP rešitev", "ASS-02", TaskPriority.medium),
    ("Vzpostavitev SIEM sistema", "OPS-05", TaskPriority.high),
    ("Posodobitev inventarja sredstev", "ASS-03", TaskPriority.medium),
    ("Implementacija šifriranja diskov", "ASS-04", TaskPriority.high),
    ("Izvajanje varnostnih testov aplikacij", "GOV-04", TaskPriority.medium),
    ("Vzpostavitev varnostnega centra (SOC)", "OPS-06", TaskPriority.high),
    ("Implementacija politike močnih gesel", "ACC-03", TaskPriority.medium),
]


def create_realistic_assessment(
    db: Session,
    org: Org,
    team: Team,
    user: User,
    days_ago: int,
    base_score: float,
    variation: float = 0.5
):
    """Create a realistic assessment with random but consistent scores."""
    
    # Create assessment
    assessed_date = datetime.utcnow() - timedelta(days=days_ago)
    assessment = Assessment(
        org_id=org.id,
        team_id=team.id,
        created_by=user.id,
        version=1,
        assessed_at=assessed_date,
        overall_score=round(base_score + random.uniform(-variation, variation), 2)
    )
    db.add(assessment)
    db.flush()
    
    # Create domain scores
    domain_scores = {}
    for domain_code, domain_name in DOMAINS.items():
        # Add some variation to each domain
        domain_score = base_score + random.uniform(-variation * 1.5, variation * 1.5)
        domain_score = max(0.5, min(5.0, domain_score))  # Clamp between 0.5 and 5
        domain_score = round(domain_score, 2)
        domain_scores[domain_code] = domain_score
        
        domain_obj = AssessmentDomain(
            assessment_id=assessment.id,
            domain=domain_code,
            score=domain_score
        )
        db.add(domain_obj)
    
    # Create sample answers for each domain (3-5 questions per domain)
    for domain_code in DOMAINS.keys():
        num_questions = random.randint(3, 5)
        for q_num in range(1, num_questions + 1):
            answer = AssessmentAnswer(
                assessment_id=assessment.id,
                domain=domain_code,
                question_code=f"{domain_code}_{q_num}",
                score=random.randint(1, 5),
                note=None if random.random() > 0.3 else "Opomba pri pregledu"
            )
            db.add(answer)
    
    # Create tasks for low-scoring domains (score < 3.0)
    low_score_domains = [d for d, s in domain_scores.items() if s < 3.0]
    if low_score_domains:
        # Create 2-5 tasks per assessment for better demonstration
        num_tasks = random.randint(2, 5)
        for _ in range(num_tasks):
            task_title, rec_id, priority = random.choice(SAMPLE_TASKS)
            
            # Random deadline between -30 and +60 days from assessment
            deadline_offset = random.randint(-30, 60)
            deadline = assessed_date + timedelta(days=deadline_offset)
            
            # Determine status based on deadline
            today = datetime.utcnow()
            if deadline < today:
                # For overdue tasks, mix of statuses (40% todo, 40% in_progress, 20% completed)
                rand = random.random()
                if rand < 0.4:
                    status = TaskStatus.todo
                elif rand < 0.8:
                    status = TaskStatus.in_progress
                else:
                    status = TaskStatus.completed
            else:
                # For future tasks (60% todo, 30% in_progress, 10% completed)
                rand = random.random()
                if rand < 0.6:
                    status = TaskStatus.todo
                elif rand < 0.9:
                    status = TaskStatus.in_progress
                else:
                    status = TaskStatus.completed
            
            task = RemediationTask(
                assessment_id=assessment.id,
                org_id=org.id,
                recommendation_id=rec_id,  # Link to recommendation
                title=task_title,
                description=f"Naloga za izboljšanje varnostne zrelosti: {task_title}. Povezana z ocenjevanjem iz {assessed_date.strftime('%d.%m.%Y')}.",
                assignee_id=user.id if random.random() > 0.2 else None,  # 80% assigned
                status=status,
                priority=priority,
                deadline=deadline,
                created_by_id=user.id,
                created_at=assessed_date,
                updated_at=assessed_date if status == TaskStatus.todo else datetime.utcnow()
            )
            db.add(task)
    
    return assessment


def seed_realistic_data():
    """Generate realistic test data."""
    db = SessionLocal()
    
    try:
        print("🌱 Začenjam z generiranjem testnih podatkov...")
        
        # Get existing org and user
        org = db.query(Org).first()
        if not org:
            print("❌ Ni najdene organizacije. Prosim najprej se prijavite.")
            return
        
        user = db.query(User).filter(User.org_id == org.id).first()
        if not user:
            print("❌ Ni najdenega uporabnika.")
            return
        
        # Get or create team
        team = db.query(Team).filter(Team.org_id == org.id).first()
        if not team:
            team = Team(
                org_id=org.id,
                name="Varnostni tim",
                description="Glavni varnostni tim organizacije"
            )
            db.add(team)
            db.flush()
            print(f"✅ Ustvarjen tim: {team.name}")
        
        # Delete existing import logs first (foreign key constraint)
        from app.models.import_log import ImportLog
        existing_logs = db.query(ImportLog).filter(ImportLog.org_id == org.id).all()
        for log in existing_logs:
            db.delete(log)
        print(f"🗑️  Izbrisanih {len(existing_logs)} import logov")
        
        # Delete existing assessments to start fresh
        existing_assessments = db.query(Assessment).filter(Assessment.org_id == org.id).all()
        for assessment in existing_assessments:
            db.delete(assessment)
        print(f"🗑️  Izbrisanih {len(existing_assessments)} obstoječih ocenjevanj")
        
        # Generate 20 assessments over the past year with improving trend
        print("\n📊 Generiranje 20 ocenjevanj...")
        
        assessments_created = 0
        for i in range(20):
            # Create assessments from 365 days ago to recent
            days_ago = 365 - (i * 18)  # Roughly every 2.5 weeks
            
            # Improving trend: start at 2.0, end at 4.0
            base_score = 2.0 + (i / 19) * 2.0  # Linear improvement
            
            # Add some noise but keep general upward trend
            variation = 0.3
            
            assessment = create_realistic_assessment(
                db=db,
                org=org,
                team=team,
                user=user,
                days_ago=days_ago,
                base_score=base_score,
                variation=variation
            )
            
            assessments_created += 1
            if (i + 1) % 5 == 0:
                print(f"  ✓ Ustvarjenih {i + 1}/20 ocenjevanj")
        
        db.commit()
        
        # Print summary
        total_tasks = db.query(RemediationTask).filter(RemediationTask.org_id == org.id).count()
        overdue_tasks = db.query(RemediationTask).filter(
            RemediationTask.org_id == org.id,
            RemediationTask.status != TaskStatus.completed,
            RemediationTask.deadline < datetime.utcnow()
        ).count()
        
        print(f"\n✅ Uspešno ustvarjenih {assessments_created} ocenjevanj!")
        print(f"📋 Skupaj nalog: {total_tasks}")
        print(f"⚠️  Zamujenih nalog: {overdue_tasks}")
        print(f"\n🎉 Testni podatki so pripravljeni za demonstracijo!")
        
    except Exception as e:
        print(f"❌ Napaka: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_realistic_data()
