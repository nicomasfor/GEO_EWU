FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
COPY apps/api ./apps/api
RUN pip install --no-cache-dir ./apps/api
EXPOSE 8000
CMD ["uvicorn", "geosector_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
