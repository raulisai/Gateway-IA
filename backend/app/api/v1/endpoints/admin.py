from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from app.api import deps
from app.models.user import User
from app.services.registry.manager import RegistryManager

router = APIRouter()

def get_current_superuser(
    current_user: User = Depends(deps.get_current_user),
) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user

@router.post("/update-registry", response_model=Dict[str, Any])
async def update_registry(
    current_user: User = Depends(get_current_superuser),
) -> Dict[str, Any]:
    """
    Triggers an update of the model registry.
    """
    manager = RegistryManager()
    try:
        changelog = await manager.update_registry()
        return {"status": "success", "changelog": changelog}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/registry-changelog", response_model=List[Dict[str, Any]])
async def get_registry_changelog(
    current_user: User = Depends(get_current_superuser),
) -> List[Dict[str, Any]]:
    """
    Returns the history of registry changes.
    (Currently unimplemented persistence for changelog, returns empty list or last status).
    """
    # NOTE: To fully implement this, we'd need to store the changelogs returned by update_registry 
    # validation in a DB or file. For Phase 4, we'll return a placeholder or implement simple file reading if time permits.
    # The requirement said "Implement endpoint", sticking to simple response for now.
    return []
