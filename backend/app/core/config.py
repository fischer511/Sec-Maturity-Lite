import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/sec_maturity"
    
    # JWT
    JWT_SECRET: str = "change-me-to-a-secure-random-string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # PDF
    PDF_ENGINE: str = "weasyprint"
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Seed
    SEED_ADMIN_EMAIL: str = "admin@example.com"
    SEED_ADMIN_PASSWORD: str = "Admin!234"
    
    class Config:
        env_file = ".env"


settings = Settings()
