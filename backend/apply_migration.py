#!/usr/bin/env python3
"""
Script to apply cascade delete migration to existing database
"""
import sqlite3
import os
from pathlib import Path

def apply_migration():
    # Get database path
    db_path = os.getenv("DATABASE_URL", "sqlite:///./gateway.db")
    if db_path.startswith("sqlite:///"):
        db_path = db_path.replace("sqlite:///", "")
    
    print(f"Applying migration to database: {db_path}")
    
    # Check if database exists
    if not Path(db_path).exists():
        print(f"Database not found at {db_path}")
        return
    
    # Read migration SQL
    migration_file = Path(__file__).parent / "app" / "db" / "migrate_cascades.sql"
    if not migration_file.exists():
        print(f"Migration file not found at {migration_file}")
        return
    
    with open(migration_file, 'r') as f:
        migration_sql = f.read()
    
    # Apply migration
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Enable foreign keys
        cursor.execute("PRAGMA foreign_keys = ON")
        
        # Execute migration
        cursor.executescript(migration_sql)
        
        conn.commit()
        print("✓ Migration applied successfully!")
        
        # Verify foreign key constraints
        cursor.execute("PRAGMA foreign_key_list(request_logs)")
        fks = cursor.fetchall()
        print("\nForeign keys in request_logs table:")
        for fk in fks:
            print(f"  - Column: {fk[3]} -> {fk[2]}.{fk[4]} (ON DELETE: {fk[5] or 'NO ACTION'})")
        
        conn.close()
        
    except sqlite3.Error as e:
        print(f"✗ Error applying migration: {e}")
        if conn:
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    apply_migration()
