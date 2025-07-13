## Start Commands

**Frontend:**
```bash
cd front && pnpm dev > ../frontend.log 2>&1 &
```

**Backend:**
```bash
cd back && source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ../backend.log 2>&1 &
```
