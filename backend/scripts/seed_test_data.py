"""
Script to seed test data for Sec-Maturity-Lite application.
Creates 20 assessments with various scores, recommendations, and tasks.
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.user import User, UserRole
from app.models.org import Org
from app.models.team import Team
from app.models.assessment import Assessment
from app.models.remediation_task import RemediationTask, TaskStatus, TaskPriority
from app.core.security import get_password_hash

# Test data constants
DOMAINS = [
    "Upravljanje", 
    "Varovanje", 
    "Zaščita", 
    "Zaznavanje", 
    "Odziv", 
    "Obnovitev",
    "Aktivna kontinuiteta",
    "Upravljanje sredstev"
]

RECOMMENDATIONS = [
    "Vzpostavite policy management sistem",
    "Implementirajte multi-factor authentication",
    "Uvedite redne varnostne preglede",
    "Nadgradite požarni zid na enterprise rešitev",
    "Vzpostavite Security Operations Center (SOC)",
    "Implementirajte sistem za upravljanje incidentov",
    "Uvedite kontinuirano spremljanje varnosti",
    "Vzpostavite disaster recovery načrt",
    "Implementirajte šifriranje občutljivih podatkov",
    "Uvedite program ozaveščanja o kibernetski varnosti",
    "Vzpostavite sistem za upravljanje ranljivosti",
    "Implementirajte segregacijo omrežja",
    "Uvedite centralizirano upravljanje logov",
    "Vzpostavite sistem za varnostno kopiranje",
    "Implementirajte penetracijske teste",
    "Uvedite sistem za upravljanje dostopov (IAM)",
    "Vzpostavite red team / blue team vaje",
    "Implementirajte DLP (Data Loss Prevention) rešitev",
    "Uvedite sistem za upravljanje konfiguracij",
    "Vzpostavite supplier security program"
]

TASK_TITLES = [
    "Pregled obstoječih varnostnih politik",
    "Implementacija MFA za vse uporabnike",
    "Nakup in namestitev novega požarnega zidu",
    "Vzpostavitev SOC tima",
    "Izvedba varnostnega audita",
    "Namestitev SIEM rešitve",
    "Priprava disaster recovery dokumentacije",
    "Izvedba penetracijskega testiranja",
    "Implementacija šifriranja podatkovnih baz",
    "Organizacija varnostnega treninga",
    "Pregled in posodobitev backup strategije",
    "Segmentacija produkcijskega omrežja",
    "Namestitev centraliziranega log sistema",
    "Pregled in posodobitev pristopnih pravic",
    "Izvedba red team vaje",
    "Implementacija DLP orodja",
    "Priprava incident response playbook-ov",
    "Pregled dobaviteljev z varnostnega vidika",
    "Posodobitev patch management procesa",
    "Izvedba security awareness kampanje"
]


def create_test_users_and_org(db: Session):
    """Create test organization and users."""
    print("Creating test organization and users...")
    
    # Check if org already exists
    org = db.query(Org).filter(Org.name == "Test Organization").first()
    if not org:
        org = Org(name="Test Organization")
        db.add(org)
        db.flush()
        print(f"  ✓ Created organization: {org.name}")
    else:
        print(f"  ✓ Organization exists: {org.name}")
    
    # Create team
    team = db.query(Team).filter(Team.org_id == org.id, Team.name == "Security Team").first()
    if not team:
        team = Team(
            name="Security Team",
            description="Main security team",
            org_id=org.id
        )
        db.add(team)
        db.flush()
        print(f"  ✓ Created team: {team.name}")
    else:
        print(f"  ✓ Team exists: {team.name}")
    
    # Create users
    users = []
    test_users = [
        ("admin@example.com", "Admin User", UserRole.ADMIN),
        ("manager@example.com", "Security Manager", UserRole.MANAGER),
        ("analyst1@example.com", "Security Analyst 1", UserRole.VIEWER),
        ("analyst2@example.com", "Security Analyst 2", UserRole.VIEWER),
    ]
    
    for email, name, role in test_users:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                password_hash=get_password_hash("password123"),
                role=role,
                org_id=org.id,
                team_id=team.id if role != UserRole.ADMIN else None
            )
            db.add(user)
            db.flush()
            print(f"  ✓ Created user: {email} ({role.value})")
        else:
            print(f"  ✓ User exists: {email}")
        users.append(user)
    
    db.commit()
    return org, team, users


def create_test_assessments(db: Session, org: Org, team: Team, users: list):
    """Create 20 test assessments with varying data."""
    print("\nCreating 20 test assessments...")
    
    creator = users[0]  # Admin user
    
    for i in range(1, 21):
        # Vary the creation date (last 6 months)
        days_ago = random.randint(0, 180)
        created_date = datetime.utcnow() - timedelta(days=days_ago)
        
        # Generate random scores for each domain
        domain_scores = {}
        for domain in DOMAINS:
            domain_scores[domain] = round(random.uniform(1.0, 5.0), 2)
        
        overall_score = round(sum(domain_scores.values()) / len(domain_scores), 2)
        
        # Create assessment
        assessment = Assessment(
            org_id=org.id,
            team_id=team.id if random.random() > 0.3 else None,  # 70% have team
            created_by_id=creator.id,
            created_at=created_date,
            is_finalized=True,
            finalized_at=created_date + timedelta(days=random.randint(1, 7)),
            overall_score=overall_score,
            domain_scores=domain_scores,
            answers={"dummy": "data"}  # Placeholder
        )
        db.add(assessment)
        db.flush()
        
        print(f"  ✓ Assessment {i}/20: Score {overall_score:.2f} (created {days_ago} days ago)")
        
        # Create 2-5 recommendations per assessment
        num_recommendations = random.randint(2, 5)
        selected_recommendations = random.sample(RECOMMENDATIONS, num_recommendations)
        
        for j, rec_text in enumerate(selected_recommendations):
            domain = random.choice(DOMAINS)
            priority = random.choice(["HIGH", "MEDIUM", "LOW"])
            
            # Store recommendations in the assessment (simplified)
            # In real app, these would be separate entities
            
            # Create tasks for some recommendations (60% chance)
            if random.random() < 0.6:
                create_task_for_recommendation(
                    db, assessment, org, users, 
                    rec_text, domain, priority, created_date
                )
    
    db.commit()
    print(f"\n✓ Created 20 assessments successfully!")


def create_task_for_recommendation(
    db: Session, 
    assessment: Assessment, 
    org: Org, 
    users: list,
    recommendation: str,
    domain: str,
    priority: str,
    base_date: datetime
):
    """Create a task for a recommendation."""
    
    # Select random task title
    task_title = random.choice(TASK_TITLES)
    
    # Task status (60% in progress, 25% completed, 15% not started)
    rand = random.random()
    if rand < 0.15:
        status = TaskStatus.TODO
    elif rand < 0.75:
        status = TaskStatus.IN_PROGRESS
    else:
        status = TaskStatus.DONE
    
    # Assign to random user (80% chance)
    assignee = random.choice(users) if random.random() < 0.8 else None
    
    # Deadline (between 1 week and 3 months from base date)
    deadline = base_date + timedelta(days=random.randint(7, 90))
    
    # Some tasks are overdue
    if random.random() < 0.2 and status != TaskStatus.DONE:
        deadline = datetime.utcnow() - timedelta(days=random.randint(1, 30))
    
    task = RemediationTask(
        assessment_id=assessment.id,
        org_id=org.id,
        recommendation_id=None,  # Would link to actual recommendation
        title=task_title,
        description=f"Task for: {recommendation}",
        assignee_id=assignee.id if assignee else None,
        status=status,
        priority=getattr(TaskPriority, priority),
        deadline=deadline,
        created_by_id=users[0].id,  # Admin creates tasks
        created_at=base_date + timedelta(days=random.randint(1, 3))
    )
    db.add(task)


def main():
    """Main seeding function."""
    print("=" * 60)
    print("SEEDING TEST DATA FOR SEC-MATURITY-LITE")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Create users and org
        org, team, users = create_test_users_and_org(db)
        
        # Create assessments
        create_test_assessments(db, org, team, users)
        
        # Summary
        print("\n" + "=" * 60)
        print("SEEDING COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print(f"\nTest credentials:")
        print(f"  Admin:    admin@example.com / password123")
        print(f"  Manager:  manager@example.com / password123")
        print(f"  Analyst:  analyst1@example.com / password123")
        print(f"\nYou can now log in and explore the test data!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
