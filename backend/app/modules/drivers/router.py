from datetime import date, datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_safety_officer
from app.modules.drivers.models import Driver, AuditLog
from app.modules.drivers.schemas import StatusUpdate, ScoreUpdate, LicenseUpdate

router = APIRouter(
    prefix="/safety",
    tags=["Safety Officer"],
    dependencies=[Depends(require_safety_officer)]
)


@router.get("/drivers")
def list_drivers(
    db: Session = Depends(get_db),
    status: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None, ge=0, le=100),
):
    query = db.query(Driver)
    if status:
        query = query.filter(Driver.status == status)
    if min_score is not None:
        query = query.filter(Driver.safety_score >= min_score)
    return query.all()


@router.get("/drivers/license-review")
def license_review(db: Session = Depends(get_db)):
    today = date.today()
    limit_date = today + timedelta(days=30)

    expired = []
    expiring_soon = []

    for d in db.query(Driver).all():
        entry = {
            "id": d.id,
            "name": d.name,
            "license_number": d.license_number,
            "license_expiry_date": d.license_expiry_date,
            "status": d.status,
            "safety_score": float(d.safety_score),
        }
        if d.license_expiry_date < today:
            expired.append(entry)
        elif d.license_expiry_date <= limit_date:
            expiring_soon.append(entry)

    return {
        "expired_licenses": expired,
        "expiring_within_30_days": expiring_soon,
    }


@router.get("/reports/overview")
def overview(db: Session = Depends(get_db)):
    today = date.today()
    drivers = db.query(Driver).all()
    return {
        "total_drivers": len(drivers),
        "suspended_drivers": sum(1 for d in drivers if d.status == "suspended"),
        "low_safety_score_drivers": sum(1 for d in drivers if float(d.safety_score) < 90),
        "expired_licenses": sum(1 for d in drivers if d.license_expiry_date < today),
        "expiring_licenses_30_days": sum(
            1 for d in drivers if today <= d.license_expiry_date <= today + timedelta(days=30)
        ),
    }


@router.get("/audit-logs")
def audit_logs(db: Session = Depends(get_db), driver_id: Optional[UUID] = Query(None)):
    query = db.query(AuditLog)
    if driver_id:
        query = query.filter(AuditLog.driver_id == driver_id)
    return query.order_by(AuditLog.created_at.desc()).all()


@router.get("/drivers/{driver_id}")
def get_driver(driver_id: UUID, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver


@router.patch("/drivers/{driver_id}/status")
def update_status(driver_id: UUID, payload: StatusUpdate, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    if driver.status == "on_trip" and payload.status == "suspended":
        raise HTTPException(status_code=409, detail="Cannot suspend driver while on trip")

    old_status = driver.status
    driver.status = payload.status
    driver.updated_at = datetime.utcnow()

    db.add(AuditLog(
        driver_id=driver.id,
        action="status_updated",
        old_value=old_status,
        new_value=payload.status,
        reason=payload.reason,
    ))
    db.commit()
    db.refresh(driver)
    return driver


@router.patch("/drivers/{driver_id}/safety-score")
def update_score(driver_id: UUID, payload: ScoreUpdate, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    old_score = float(driver.safety_score)
    driver.safety_score = payload.safety_score
    driver.updated_at = datetime.utcnow()

    db.add(AuditLog(
        driver_id=driver.id,
        action="safety_score_updated",
        old_value=str(old_score),
        new_value=str(payload.safety_score),
        reason=payload.reason,
    ))
    db.commit()
    db.refresh(driver)
    return driver


@router.patch("/drivers/{driver_id}/license-expiry")
def update_license_expiry(driver_id: UUID, payload: LicenseUpdate, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    old_expiry = str(driver.license_expiry_date)
    driver.license_expiry_date = payload.license_expiry_date
    driver.updated_at = datetime.utcnow()

    db.add(AuditLog(
        driver_id=driver.id,
        action="license_expiry_updated",
        old_value=old_expiry,
        new_value=str(payload.license_expiry_date),
        reason=payload.reason,
    ))
    db.commit()
    db.refresh(driver)
    return driver