import uuid

import jwt
from fastapi import Header, HTTPException, status

from app.config import settings

_NOT_AUTHENTICATED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
)

# Supabase signs session tokens with its current JWT signing key (ECC/RSA) rather
# than a static shared secret. Fetch the public key set from Supabase's JWKS
# endpoint and cache it (PyJWKClient refreshes it every `lifespan` seconds).
_jwks_client = jwt.PyJWKClient(
    f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json", cache_jwk_set=True
)


def get_current_user_id(authorization: str = Header(default="")) -> uuid.UUID:
    """Decode the Supabase-issued JWT from the Authorization header and return the user's UUID.

    Raises 401 on any failure: missing header, malformed header, expired token,
    bad signature, wrong audience, or missing "sub" claim.
    """
    if not authorization:
        raise _NOT_AUTHENTICATED

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise _NOT_AUTHENTICATED

    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError:
        raise _NOT_AUTHENTICATED

    sub = payload.get("sub")
    if not sub:
        raise _NOT_AUTHENTICATED

    try:
        return uuid.UUID(str(sub))
    except (ValueError, AttributeError, TypeError):
        raise _NOT_AUTHENTICATED
