from fastapi import Header, HTTPException


def require_safety_officer(x_role: str = Header(..., alias="X-Role")):
    if x_role != "safety_officer":
        raise HTTPException(status_code=403, detail="Safety Officer access required")
    return x_role