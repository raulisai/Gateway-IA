from sqlalchemy.orm import Session
from app.db.session import engine
from app.db.base import Base

def init_db() -> None:
    # Create all tables
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    print("Initializing the database...")
    init_db()
    print("Database initialized!")
