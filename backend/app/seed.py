from __future__ import annotations

from sqlalchemy import select

from app.core.database import SessionLocal, init_db
from app.core.security import hash_password
from app.models.user import User

DEMO_EMAIL = "demo@forge.app"
DEMO_PASSWORD = "demo12345"


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        user = db.execute(select(User).where(User.email == DEMO_EMAIL)).scalar_one_or_none()
        if not user:
            user = User(
                email=DEMO_EMAIL,
                full_name="Demo User",
                hashed_password=hash_password(DEMO_PASSWORD),
            )
            db.add(user)
            db.commit()
            print(f"Created demo user: {DEMO_EMAIL} / {DEMO_PASSWORD}")
        else:
            print(f"Demo user already exists: {DEMO_EMAIL}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
