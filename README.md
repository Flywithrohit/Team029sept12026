# CRM Application

This project is a Flask-based CRM with a built-in frontend. The backend serves the API and the frontend from the same app.

## What It Covers
- User management
- Attendance and leave tracking
- Salary records
- Recruitment requirements and candidate tracking
- Sales leads and follow-ups

## Requirements
- Python 3.9 or newer
- Windows for `start.bat`, or any environment that can run Python directly

## Project Structure
- `backend/` contains the Flask app, models, routes, and requirements
- `frontend/` contains the UI that Flask serves as static files
- `run.py` is the main entry point for local development
- `start.bat` sets up the virtual environment, installs dependencies, and starts the app on Windows

## Quick Start
1. Open a terminal in the project root.
2. On Windows, run:

```cmd
start.bat
```

This script will:
- create `venv` if it does not exist
- activate the virtual environment
- install packages from `backend/requirements.txt`
- start the app with `python run.py`

## Manual Start
If you prefer to run it yourself:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r backend/requirements.txt
python run.py
```

## Default URL
After startup, open:

```text
http://127.0.0.1:5000
```

## Default Admin Login
On startup, the app creates the default admin user if it does not already exist.

- Username: `admin`
- Password: `admin123`

## Useful Commands
Start the app:

```bash
python run.py
```

Seed the default admin user:

```bash
python run.py seed
```

Reset the default admin password back to `admin123`:

```bash
python run.py seed --reset-password
```

## Database Notes
- The app uses SQLite by default
- The default database is `crm.db`
- Tables are created automatically on startup
- A couple of older SQLite columns are patched automatically during app startup for compatibility

If you want to use a different database, set `DATABASE_URL` in your environment before starting the app.

## Environment Settings
The app reads these values from the environment and falls back to local defaults if they are not set:

- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `DATABASE_URL`

## Notes
- The frontend is served by Flask from the `frontend/` folder
- Uploaded files are stored under `backend/uploads/`
- Browser caching is disabled in the app so frontend changes show up immediately during development
