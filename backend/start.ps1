$env:PYTHONIOENCODING="utf8"
$env:PYTHONUTF8="1"
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
