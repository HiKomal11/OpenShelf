
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.core.google_oauth import oauth
from app.core.security import (
    create_access_token,
    generate_oauth_login_code,
    hash_oauth_login_code,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.email_verification_token import EmailVerificationToken
from app.models.oauth_login_code import OAuthLoginCode
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole
from app.schemas.auth import (
    GoogleExchangeRequest,
    LoginRequest,
    RegisterRequest,
    RegisterRequest,
    ResendVerificationRequest,
    TokenResponse,
    UserResponse,
)
from app.services.email_service import send_verification_email
from app.services.email_verification_service import (
    create_verification_token,
    verify_email_token,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    email = request.email.lower()

    existing_user = db.scalar(
        select(User).where(User.email == email)
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user_role = db.scalar(
        select(Role).where(Role.name == "USER")
    )

    if user_role is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Default USER role is not configured.",
        )

    user = User(
        email=email,
        password_hash=hash_password(request.password),
        full_name=request.full_name,
        is_active=True,
        email_verified=False,
        email_verified_at=None,
    )

    try:
        db.add(user)
        db.flush()

        db.add(
            UserRole(
                user_id=user.id,
                role_id=user_role.id,
            )
        )

        verification_url = create_verification_token(db, user)
        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()
        raise

    try:
        send_verification_email(user.email, verification_url)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Your account was created, but the verification email "
                "could not be sent. Please contact support or request "
                "another verification email."
            ),
        )

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        roles=[role.name for role in user.roles],
    )


@router.post("/verify-email")
def verify_email(
    token: str,
    db: Session = Depends(get_db),
):
    if not token or len(token) > 256:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification link.",
        )

    try:
        verified = verify_email_token(db, token)
    except Exception:
        db.rollback()
        raise

    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid, expired, or already-used verification link.",
        )

    return {
        "message": "Email verified successfully. You can now sign in."
    }


@router.post("/resend-verification")
def resend_verification_email(
    request: ResendVerificationRequest,
    db: Session = Depends(get_db),
):
    generic_response = {
        "message": (
            "If an eligible account exists for this email, "
            "a verification email will be sent."
        )
    }

    email = request.email.lower()
    user = db.scalar(select(User).where(User.email == email))

    # Always return the same response for unknown, inactive,
    # or already-verified accounts.
    if user is None or not user.is_active or user.email_verified:
        return generic_response

    now = datetime.now(timezone.utc)

    try:
        # Invalidate previous unused verification links.
        previous_tokens = db.scalars(
            select(EmailVerificationToken).where(
                EmailVerificationToken.user_id == user.id,
                EmailVerificationToken.consumed_at.is_(None),
            )
        ).all()

        for previous_token in previous_tokens:
            previous_token.consumed_at = now

        verification_url = create_verification_token(db, user)
        db.commit()

    except Exception:
        db.rollback()
        # Avoid exposing account or database details.
        return generic_response

    try:
        send_verification_email(user.email, verification_url)
    except Exception:
        # The email service logs delivery failures.
        # Keep the response generic to avoid account enumeration.
        pass

    return generic_response

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login_user(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    email = request.email.lower()

    user = db.scalar(
        select(User).where(User.email == email)
    )

    if user is None or not verify_password(
        request.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address before signing in.",
        )

    access_token = create_access_token(user.id)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )


@router.get("/google/callback")
async def google_callback(
    request: Request,
    db: Session = Depends(get_db),
):
    token = await oauth.google.authorize_access_token(request)
    userinfo = token.get("userinfo")

    if not userinfo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google authentication failed.",
        )

    google_id = userinfo.get("sub")
    email = userinfo.get("email")
    google_email_verified = userinfo.get("email_verified", False)
    full_name = userinfo.get("name")

    if not google_id or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account information is incomplete.",
        )

    if not google_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Google email address is not verified.",
        )

    email = email.lower()

    user = db.scalar(
        select(User).where(User.google_id == google_id)
    )

    if user is None:
        user = db.scalar(
            select(User).where(User.email == email)
        )

        if user is not None:
            # Link the verified Google identity to the existing account.
            user.google_id = google_id
            user.email_verified = True
            user.email_verified_at = (
                user.email_verified_at or datetime.now(timezone.utc)
            )

        else:
            user_role = db.scalar(
                select(Role).where(Role.name == "USER")
            )

            if user_role is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Default USER role is not configured.",
                )

            user = User(
                email=email,
                google_id=google_id,
                password_hash=hash_password(secrets.token_urlsafe(32)),
                full_name=full_name,
                is_active=True,
                email_verified=True,
                email_verified_at=datetime.now(timezone.utc),
            )

            db.add(user)
            db.flush()

            db.add(
                UserRole(
                    user_id=user.id,
                    role_id=user_role.id,
                )
            )

    # Google has confirmed the email address for this identity.
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    db.commit()
    db.refresh(user)

    oauth_code = generate_oauth_login_code()
    oauth_code_hash = hash_oauth_login_code(oauth_code)

    login_code = OAuthLoginCode(
        user_id=user.id,
        code_hash=oauth_code_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
    )

    db.add(login_code)
    db.commit()

    return RedirectResponse(
        url=(
            f"{settings.FRONTEND_URL.rstrip('/')}/auth/callback"
            f"?code={oauth_code}"
        ),
        status_code=status.HTTP_302_FOUND,
    )


@router.get("/google/login")
async def google_login(request: Request):
    return await oauth.google.authorize_redirect(
        request,
        settings.GOOGLE_REDIRECT_URI,
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        roles=[role.name for role in current_user.roles],
    )


@router.post("/google/exchange", response_model=TokenResponse)
def google_exchange(
    payload: GoogleExchangeRequest,
    db: Session = Depends(get_db),
):
    code_hash = hash_oauth_login_code(payload.code)

    login_code = db.scalar(
        select(OAuthLoginCode)
        .where(OAuthLoginCode.code_hash == code_hash)
        .with_for_update()
    )

    if login_code is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OAuth login code.",
        )

    now = datetime.now(timezone.utc)

    if login_code.consumed_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="OAuth login code has already been used.",
        )

    if login_code.expires_at <= now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="OAuth login code has expired.",
        )

    user = db.scalar(
        select(User).where(User.id == login_code.user_id)
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    login_code.consumed_at = now
    db.commit()

    access_token = create_access_token(user.id)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )