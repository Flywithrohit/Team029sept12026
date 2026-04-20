@echo off
echo Starting CRM Application...
echo.

:: Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo [*] Virtual environment not found. Creating one now...
    python -m venv venv
    echo [*] Virtual environment created successfully.
)

:: Activate virtual environment
echo [*] Activating virtual environment...
call .\venv\Scripts\activate.bat

:: Install requirements
echo [*] Checking and installing dependencies from backend/requirements.txt...
pip install -r backend/requirements.txt

:: Run the application
echo.
echo [*] Starting server...
python run.py

pause
