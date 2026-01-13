from typing import Any
from app.schemas.user import User
from app.schemas.auth import Token

class UserWithToken(User):
    token: Token
