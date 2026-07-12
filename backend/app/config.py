from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://transitops:transitops@localhost:5432/transitops"
    SECRET_KEY: str = "change-this-to-a-random-secret-key-at-least-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: str = "http://localhost:5173"
    ADMIN_EMAIL: str = "admin@transitops.com"
    ADMIN_PASSWORD: str = "change-this-to-a-strong-password"
    ADMIN_NAME: str = "System Admin"
    ENVIRONMENT: str = "development"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
