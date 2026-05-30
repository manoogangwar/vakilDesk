VakilDesk — Production checklist and quick start

Quick dev (frontend + backend):

1. Backend (create venv, install requirements)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py runserver
```

2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Production notes:

- Set environment variables: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, `DJANGO_ALLOWED_HOSTS`, database vars (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`).
- Build frontend: `npm run build` and serve built files with a static server or integrate into Django static files.
- Collect static and run gunicorn: `python manage.py collectstatic --noinput` then `gunicorn config.wsgi:application` behind a reverse proxy.

Next recommended improvements:
- Add Dockerfile and docker-compose for reproducible deployments.
- Add automated tests and CI pipeline.
- Configure HTTPS and add HSTS headers at the proxy layer.
