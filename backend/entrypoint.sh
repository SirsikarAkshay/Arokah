#!/bin/sh
set -e

echo "==> Running database migrations..."
python manage.py migrate --noinput

echo "==> Collecting static files..."
python manage.py collectstatic --noinput --clear 2>/dev/null || true

echo "==> Seeding cultural data (idempotent)..."
python manage.py seed_cultural_data 2>/dev/null || true

echo "==> Setting up Celery Beat schedules..."
python manage.py setup_celery_beat 2>/dev/null || true

echo "==> Starting: $@"
exec "$@"
