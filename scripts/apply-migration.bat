@echo off
REM Script to apply database migration for CASCADE DELETE

cd backend
echo Applying migration to fix CASCADE DELETE...
python apply_migration.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Migration completed successfully!
    echo You can now restart your backend server.
) else (
    echo.
    echo Migration failed. Please check the error messages above.
)

pause
