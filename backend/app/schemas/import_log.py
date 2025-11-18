from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional


class ImportLogBase(BaseModel):
    """Base schema for import logs."""
    filename: Optional[str] = None
    kind: str = "csv"


class ImportLogResponse(ImportLogBase):
    """Import log response schema."""
    id: UUID
    org_id: UUID
    assessment_id: Optional[UUID] = None
    created_by: UUID
    status: str
    rows_processed: int
    rows_created: int
    rows_updated: int
    error_message: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CSVImportResult(BaseModel):
    """Result of CSV import operation."""
    import_id: UUID
    status: str
    rows_processed: int
    rows_created: int
    rows_updated: int
    error_message: Optional[str] = None
