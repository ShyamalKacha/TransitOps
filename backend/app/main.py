from fastapi import FastAPI

from app.database import Base, engine
from app.modules.drivers.router import router as drivers_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TransitOps Backend")

app.include_router(drivers_router)


@app.get("/")
def root():
    return {"message": "TransitOps Backend is running"}