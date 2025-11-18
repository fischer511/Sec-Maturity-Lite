"""
Seed script to create admin user and demo data.
Run: python -m app.seed
"""
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.org import Org
from app.models.team import Team
from app.models.assessment import Assessment, AssessmentAnswer, AssessmentDomain
from app.models.audit_log import AuditLog
from app.services.questions import get_all_questions
from datetime import datetime, timedelta
import uuid


def seed_data():
    db = SessionLocal()
    
    try:
        # Create demo org first
        demo_org = db.query(Org).filter(Org.name == "Demo Organization").first()
        if not demo_org:
            demo_org = Org(name="Demo Organization")
            db.add(demo_org)
            db.commit()
            db.refresh(demo_org)
            print(f"✓ Created demo organization: {demo_org.name}")
        else:
            print(f"Demo organization already exists: {demo_org.name}")
        
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == settings.SEED_ADMIN_EMAIL).first()
        if existing_admin:
            # Update admin to have org_id if missing
            if not existing_admin.org_id:
                existing_admin.org_id = demo_org.id
                db.commit()
                print(f"✓ Updated admin user with org_id: {settings.SEED_ADMIN_EMAIL}")
            else:
                print(f"Admin user already exists: {settings.SEED_ADMIN_EMAIL}")
        else:
            # Create admin user with org_id
            admin = User(
                email=settings.SEED_ADMIN_EMAIL,
                password_hash=get_password_hash(settings.SEED_ADMIN_PASSWORD),
                role=UserRole.ADMIN,
                org_id=demo_org.id,  # ← DODANO!
            )
            db.add(admin)
            db.commit()
            print(f"✓ Created admin user: {settings.SEED_ADMIN_EMAIL} / {settings.SEED_ADMIN_PASSWORD}")
        
        # Create demo manager
        demo_manager = db.query(User).filter(User.email == "manager@demo.example.com").first()
        if not demo_manager:
            demo_manager = User(
                email="manager@demo.example.com",
                password_hash=get_password_hash("demo123"),
                role=UserRole.MANAGER,
                org_id=demo_org.id,
            )
            db.add(demo_manager)
            db.commit()
            db.refresh(demo_manager)
            print(f"✓ Created demo manager: manager@demo.example.com / demo123")
        else:
            print(f"Demo manager already exists: manager@demo.example.com")
        
        # Create demo teams
        teams_data = [
            {"name": "IT Security", "description": "Information security team"},
            {"name": "Development", "description": "Software development team"},
            {"name": "Operations", "description": "IT operations and infrastructure"},
        ]
        
        created_teams = []
        for team_info in teams_data:
            existing_team = db.query(Team).filter(
                Team.org_id == demo_org.id, 
                Team.name == team_info["name"]
            ).first()
            
            if not existing_team:
                team = Team(
                    org_id=demo_org.id,
                    name=team_info["name"],
                    description=team_info["description"],
                )
                db.add(team)
                db.commit()
                db.refresh(team)
                created_teams.append(team)
                print(f"✓ Created demo team: {team.name}")
            else:
                created_teams.append(existing_team)
                print(f"Demo team already exists: {existing_team.name}")
        
        # Create 2 sample assessments
        all_questions = get_all_questions()
        
        for i in range(2):
            assessed_date = datetime.utcnow() - timedelta(days=30 * (2 - i))
            
            assessment = Assessment(
                org_id=demo_org.id,
                created_by=demo_manager.id,
                version=i + 1,
                assessed_at=assessed_date,
            )
            db.add(assessment)
            db.commit()
            db.refresh(assessment)
            
            # Create audit log for assessment creation
            audit = AuditLog(
                actor_user_id=demo_manager.id,
                org_id=demo_org.id,
                action="assessment.created",
                meta={"assessment_id": str(assessment.id), "version": assessment.version},
            )
            db.add(audit)
            
            # Create answers with varying scores
            base_score = 2 + i  # First assessment: ~2, second: ~3
            for question in all_questions:
                score = min(5, max(0, base_score + (hash(question.code) % 3) - 1))
                answer = AssessmentAnswer(
                    assessment_id=assessment.id,
                    domain=question.domain,
                    question_code=question.code,
                    score=score,
                )
                db.add(answer)
            
            db.commit()
            
            # Compute and save domain scores
            answers = db.query(AssessmentAnswer).filter(
                AssessmentAnswer.assessment_id == assessment.id
            ).all()
            
            domain_totals = {}
            for answer in answers:
                if answer.domain not in domain_totals:
                    domain_totals[answer.domain] = []
                domain_totals[answer.domain].append(answer.score)
            
            domain_scores = {}
            for domain, scores in domain_totals.items():
                avg = sum(scores) / len(scores)
                domain_scores[domain] = round(avg, 1)
                
                domain_entry = AssessmentDomain(
                    assessment_id=assessment.id,
                    domain=domain,
                    score=domain_scores[domain],
                )
                db.add(domain_entry)
            
            overall_score = round(sum(domain_scores.values()) / len(domain_scores), 1)
            assessment.overall_score = overall_score
            
            # Audit log for finalization
            audit = AuditLog(
                actor_user_id=demo_manager.id,
                org_id=demo_org.id,
                action="assessment.finalized",
                meta={"assessment_id": str(assessment.id), "overall_score": overall_score},
            )
            db.add(audit)
            
            db.commit()
            print(f"✓ Created assessment {i+1}: overall score = {overall_score}")
        
        print("\n✓ Seed completed successfully!")
        print(f"\nLogin credentials:")
        print(f"  Admin: {settings.SEED_ADMIN_EMAIL} / {settings.SEED_ADMIN_PASSWORD}")
        print(f"  Demo Manager: manager@demo.example.com / demo123")
        
    except Exception as e:
        print(f"✗ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
