import sqlite3
import os

DB_PATH = "gateway.db" # Standard for this project based on standard FastAPI templates, but I should verify if it's named differently.
# Based on typical setups. Let's list dir to be sure.

def migrate():
    try:
        conn = sqlite3.connect("backend/sql_app.db") # Checking if this exists
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("PRAGMA table_info(request_logs)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if "meta_data" not in columns:
            print("Adding meta_data column...")
            # SQLite supports JSON as TEXT/BLOB usually, but let's just use JSON type if supported or TEXT
            # SQLAlchemy JSON maps to TEXT in SQLite usually or JSON1 extension.
            cursor.execute("ALTER TABLE request_logs ADD COLUMN meta_data JSON")
            conn.commit()
            print("Migration successful.")
        else:
            print("Column meta_data already exists.")
            
        conn.close()
    except Exception as e:
        print(f"Migration failed or DB not found at estimated path: {e}")

if __name__ == "__main__":
    migrate()
