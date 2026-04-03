# RYC

Monorepo con la API de estimación de precios de vehículos y una interfaz web en Next.js. No incluye base de datos: el modelo se sirve desde archivos locales.

## Requisitos

- Docker y Docker Compose

## Puesta en marcha

```bash
cd ryc
docker compose up --build
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **API:** [http://localhost:8000/docs](http://localhost:8000/docs)

Si **8000** o **3000** ya están en uso en tu máquina, cambia el mapeo de puertos en `docker-compose.yml` (por ejemplo `8001:8000`) y reconstruye el frontend con el mismo `NEXT_PUBLIC_API_URL` apuntando al host y puerto donde expongas la API.

La variable `NEXT_PUBLIC_API_URL` se fija en tiempo de build del frontend para que el navegador llame a la API en `http://localhost:8000` (puerto expuesto en el host).

## Estructura

- `backend/` — FastAPI, modelo TensorFlow/Keras y `config/brand_model.json` (marcas y modelos, alineado con RYC-first-api).
- `frontend/` — Next.js 14 (App Router), formulario y gráficos (Recharts).
- `assets/` — Recursos estáticos compartidos (p. ej. logo SVG copiado a `frontend/public` en la imagen).

## Formato de fecha

La API usa **año decimal** para `publish_date` / `date` (por ejemplo `2021.5`), coherente con el modelo original. La interfaz muestra la fecha ISO aproximada equivalente (misma lógica que `Inferencer._float_to_date`). La serie temporal de `/plot_date` devuelve años decimales mensuales; en el gráfico se etiquetan como fechas ISO aproximadas.

## Desarrollo local sin Docker

**API:** desde `backend/`, con un entorno virtual e instalando dependencias:

```bash
pip install -r requirements.txt
export MODEL_PATH="$(pwd)/models/model_2024-08-20_00-35-06"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:** desde `frontend/`:

```bash
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```
