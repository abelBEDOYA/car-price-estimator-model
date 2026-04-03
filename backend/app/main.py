import json
import os
from pathlib import Path

import numpy as np
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.inferencer import Inferencer

MODEL_PATH = os.environ.get(
    "MODEL_PATH",
    str(Path(__file__).resolve().parent.parent / "models" / "model_2024-08-20_00-35-06"),
)
BRAND_MODEL_PATH = os.environ.get(
    "BRAND_MODEL_PATH",
    str(Path(__file__).resolve().parent.parent / "config" / "brand_model.json"),
)

app = FastAPI(title="RYC Price API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

loaded_model = Inferencer(MODEL_PATH)
make = loaded_model.categories["make"]
models = loaded_model.categories["model"]
fuels = loaded_model.categories["fuel"]
shifts = loaded_model.categories["shift"]

_brand_model: dict | None = None


def load_brand_model() -> dict:
    global _brand_model
    if _brand_model is None:
        with open(BRAND_MODEL_PATH, encoding="utf-8") as f:
            data = json.load(f)
        _brand_model = data.get("brand_model", {})
    return _brand_model


def flatten_prices(raw):
    """Normalize model output to a flat list of floats for JSON."""
    if raw is None:
        return []
    if isinstance(raw, np.ndarray):
        return [float(x) for x in np.ravel(raw)]
    if isinstance(raw, (int, float)):
        return [float(raw)]
    out = []
    for row in raw:
        if isinstance(row, (list, tuple)):
            out.append(float(row[0]))
        else:
            out.append(float(row))
    return out


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/meta")
def get_meta():
    """Marcas, modelos por marca, combustibles y cambios (compatible con cfg del modelo)."""
    return {
        "makes": make,
        "models": models,
        "models_by_make": load_brand_model(),
        "fuels": fuels,
        "shifts": shifts,
    }


@app.get("/car_features")
def get_car_features(
    marca: str = Query(..., description="marca", enum=make),
    model: str = Query(..., description="modelo", enum=models),
    fuel: str = Query(..., description="combustible", enum=fuels),
    shift: str = Query(..., description="cambio de marchas", enum=shifts),
    kms: float = 100000,
    year: int = 2020,
    power: float = 140,
    date: float = Query(2021.5, description="fecha de publicación como año decimal (ej. 2021.5)"),
):
    query_dict = {
        "make": [marca],
        "model": [model],
        "fuel": [fuel],
        "shift": [shift],
        "kms": [kms],
        "year": [year],
        "power": [power],
        "publish_date": [date],
    }
    price = loaded_model.inference(query_dict)
    if price is None:
        return {"price": None, "error": "inferencia no válida"}
    return {"price": float(price[0, 0])}


@app.get("/plot_year")
async def get_plot_year(
    marca: str = Query(..., description="marca", enum=make),
    model: str = Query(..., description="modelo", enum=models),
    fuel: str = Query(..., description="combustible", enum=fuels),
    shift: str = Query(..., description="cambio de marchas", enum=shifts),
    kms: float = 100000,
    power: float = 140,
    date: float = Query(2021.5, description="año decimal de publicación"),
):
    query_dict = {
        "make": marca,
        "model": model,
        "fuel": fuel,
        "shift": shift,
        "kms": kms,
        "power": power,
        "publish_date": date,
    }
    dates, y_pred = loaded_model.year_inference(query_dict)
    if dates is None:
        return {"dates": [], "prices": []}
    return {"dates": dates, "prices": flatten_prices(y_pred)}


@app.get("/plot_date")
async def get_plot_date(
    marca: str = Query(..., description="marca", enum=make),
    model: str = Query(..., description="modelo", enum=models),
    fuel: str = Query(..., description="combustible", enum=fuels),
    shift: str = Query(..., description="cambio de marchas", enum=shifts),
    kms: float = 100000,
    year: int = 2020,
    power: float = 140,
):
    query_dict = {
        "make": marca,
        "model": model,
        "fuel": fuel,
        "shift": shift,
        "kms": kms,
        "power": power,
        "year": year,
    }
    dates, y_pred = loaded_model.time_inference(query_dict)
    if dates is None:
        return {"dates": [], "prices": []}
    return {"dates": dates, "prices": flatten_prices(y_pred)}


@app.get("/plot_km")
async def get_plot_km(
    marca: str = Query(..., description="marca", enum=make),
    model: str = Query(..., description="modelo", enum=models),
    fuel: str = Query(..., description="combustible", enum=fuels),
    shift: str = Query(..., description="cambio de marchas", enum=shifts),
    year: int = 2020,
    power: float = 140,
    date: float = Query(2021.5, description="año decimal de publicación"),
):
    query_dict = {
        "make": marca,
        "model": model,
        "fuel": fuel,
        "shift": shift,
        "publish_date": date,
        "power": power,
        "year": year,
    }
    kms, prices = loaded_model.kms_inference(query_dict)
    if kms is None:
        return {"kms": [], "prices": []}
    return {"kms": kms, "prices": flatten_prices(prices)}


@app.get("/car_analysis")
async def get_car_analysis(
    marca: str = Query(..., description="marca", enum=make),
    model: str = Query(..., description="modelo", enum=models),
    fuel: str = Query(..., description="combustible", enum=fuels),
    shift: str = Query(..., description="cambio de marchas", enum=shifts),
    kms: float = 100000,
    year: int = 2020,
    power: float = 140,
    date: float = Query(2021.5, description="año decimal de publicación"),
):
    price_response = get_car_features(marca, model, fuel, shift, kms, year, power, date)
    year_evolution = await get_plot_year(marca, model, fuel, shift, kms, power, date)
    date_evolution = await get_plot_date(marca, model, fuel, shift, kms, year, power)
    km_evolution = await get_plot_km(marca, model, fuel, shift, year, power, date)

    fuel_analysis = {}
    for fuel_type in fuels:
        fp = get_car_features(marca, model, fuel_type, shift, kms, year, power, date)
        if fp.get("price") is not None:
            fuel_analysis[fuel_type] = float(fp["price"])

    shift_analysis = {}
    for transmission in shifts:
        sp = get_car_features(marca, model, fuel, transmission, kms, year, power, date)
        if sp.get("price") is not None:
            shift_analysis[transmission] = float(sp["price"])

    car_features = {
        "make": marca,
        "model": model,
        "fuel": fuel,
        "shift": shift,
        "kms": kms,
        "year": year,
        "power": power,
        "publish_date": date,
    }

    return {
        "car_features": car_features,
        "current_price": price_response,
        "year_evolution": year_evolution,
        "date_evolution": date_evolution,
        "km_evolution": km_evolution,
        "fuel_analysis": fuel_analysis,
        "shift_analysis": shift_analysis,
    }
