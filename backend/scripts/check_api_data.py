"""
Quick check what the API returns for assessments
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.assessment import Assessment
from app.models.org import Org
import json
from datetime import datetime

db = SessionLocal()

try:
    org = db.query(Org).first()
    if org:
        assessments = db.query(Assessment).filter(Assessment.org_id == org.id).limit(3).all()
        
        print("=" * 80)
        print(f"Found {len(assessments)} assessments")
        print("=" * 80)
        
        for a in assessments:
            print(f"\nAssessment ID: {a.id}")
            print(f"  assessed_at type: {type(a.assessed_at)}")
            print(f"  assessed_at value: {a.assessed_at}")
            print(f"  assessed_at ISO: {a.assessed_at.isoformat() if a.assessed_at else 'None'}")
            print(f"  overall_score: {a.overall_score}")
            
            # Simulate what Pydantic would serialize
            data = {
                "id": str(a.id),
                "assessed_at": a.assessed_at.isoformat() if a.assessed_at else None,
                "overall_score": a.overall_score,
            }
            print(f"  JSON representation: {json.dumps(data, indent=2)}")
            
finally:
    db.close()
