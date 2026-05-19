FROM python:3.12-alpine

RUN addgroup -S minihub && adduser -S minihub -G minihub

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY frontend/ ./frontend/

RUN mkdir -p /data && chown minihub:minihub /data

USER minihub

EXPOSE 8000

VOLUME ["/data"]

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120", "backend.app:create_app()"]
