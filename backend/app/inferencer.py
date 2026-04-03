import json
import pickle as pkl
import numpy as np
from datetime import datetime, timedelta

import keras
import pandas as pd


class Inferencer():
    def __init__(self, path_model):
        self.path_model = path_model
        self.cfg = self.load_cfg(path_model)
        self.inputs = self.load_procesers(self.cfg['inputs'])
        self.categories = self.cfg['categories']
        # print(self.categories)
        self.model = self.load_model()

    def load_procesers(self, inputs):
        loaded_inputs = {}
        for k, input in inputs.items():
            object_loaded =self.load_pkl(input['filename'])
            loaded_inputs[k] = {'object': object_loaded, "type": input['type']}
        return loaded_inputs

    def load_pkl(self, filename):
        with open(f'{self.path_model}/{filename}', 'rb') as file:
            object_loaded = pkl.load(file)
        return object_loaded

    def load_cfg(self, path_model):
        # Abre el archivo y carga su contenido en un diccionario
        with open(f'{path_model}/cfg.json', 'r', encoding='utf-8') as archivo:
            cfg = json.load(archivo)
        return cfg

    def load_model(self):
        modelo_cargado = keras.models.load_model(f'{self.path_model}/model.h5', compile=False)
        modelo_cargado.compile()
        return modelo_cargado
    
    def _float_to_date(self, years_float):
        years_string = []
        for year_float in years_float:
            # Obtener la parte entera del año
            year = int(year_float)
            
            # Calcular si el año es bisiesto
            is_leap = (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)
            days_in_year = 366 if is_leap else 365
            
            # Obtener la parte decimal y calcular los días transcurridos
            decimal_part = year_float - year
            days_elapsed = int(decimal_part * days_in_year)
            
            # Crear la fecha correspondiente al 1 de enero del año y sumar los días transcurridos
            start_date = datetime(year, 1, 1)
            final_date = start_date + timedelta(days=days_elapsed)
            years_string.append(final_date.strftime('%Y-%m-%d'))
        return years_string

    def evaluar_dataframe_con_diccionario(self, df):
        valores_no_permitidos = {"columnas_invalidas": [], "columnas_faltantes": [], "categorias_invalidas": []}
        check = True
        # Iterar sobre las columnas del DataFrame
        # print(self.inputs.keys())
        for columna in df.columns:
            if columna in self.inputs.keys():
                # Verificar valores que no están en el diccionario correspondiente
                if columna in self.categories.keys():
                    valores_invalidos = df[columna][~df[columna].isin(self.categories[columna])]

                    if not valores_invalidos.empty:
                        check = False
                        valores_no_permitidos['categorias_invalidas']  += valores_invalidos.tolist()
            else:
                check = False
                valores_no_permitidos['columnas_invalidas'].append(columna)
        for categorie in self.inputs:
            if categorie not in df.columns:
                check = False
                valores_no_permitidos['columnas_faltantes'].append(categorie)
        return check, valores_no_permitidos
    
    def scale_n_encode(self, df):
        ## escalara:
        for k, input in self.inputs.items():
            # print(k)
            if k == "publish_date":
                df['publish_date'] = pd.to_datetime(df['publish_date'])
                df['publish_date'] = (df['publish_date'] - pd.Timestamp("1970-01-01")) // pd.Timedelta('1s')
            if input['type'] == "encoder":
                df[f'{k}'] = input['object'].transform(df[f'{k}'])

            else:
                df[f'{k}'] = input['object'].transform(df[f'{k}'].values.reshape(-1, 1)).reshape(-1)
        return df

    def inference(self, car_dict: dict):
        df = pd.DataFrame(car_dict)
        check, valores_no_permitidos = self.evaluar_dataframe_con_diccionario(df)
        if not check:
            print(f'Valores no permitidos o faltantes {valores_no_permitidos}')
            return None
        df['publish_date'] = self._float_to_date(df['publish_date'].values)
        df_scaled = self.scale_n_encode(df)

        # Se da por hecho este orden
        nuevo_orden = ['make', 'model', 'fuel', 'shift','kms','power','year', 'publish_date']
        data = df_scaled[nuevo_orden].values

        # Se dan por hecho estos inputs
        input = [data[:, :1], data[:, 1:2], data[:, 2:3], data[:, 3:4], data[:, 4:8]]
        y_pred = self.model.predict(input)
        return y_pred
    
    def date_linspace(self, start_year=2019, end_year=2025):
        start_date = pd.Timestamp(f'{start_year}-01-01')
        end_date = pd.Timestamp(f'{end_year}-12-01')
        date_range = pd.date_range(start=start_date, end=end_date, freq='MS')
        # Convert to decimal years (e.g. 2019.5 for June 2019)
        decimal_years = date_range.year + (date_range.month - 1) / 12 + date_range.day / 365
        return date_range, decimal_years.tolist()

    def time_inference(self, car_dict: dict):
        dates, dates_num = self.date_linspace(start_year=2019, end_year=2025)
        car_dict['publish_date'] = dates
        df = pd.DataFrame(car_dict)
        check, valores_no_permitidos = self.evaluar_dataframe_con_diccionario(df)
        if not check:
            print(f'Valores no permitidos o faltantes {valores_no_permitidos}')
            return None
        df_scaled = self.scale_n_encode(df)
        print(df_scaled.head())

        # Se da por hecho este orden
        nuevo_orden = ['make', 'model', 'fuel', 'shift','kms','power','year', 'publish_date']
        data = df_scaled[nuevo_orden].values

        # Se dan por hecho estos inputs
        input = [data[:, :1], data[:, 1:2], data[:, 2:3], data[:, 3:4], data[:, 4:8]]
        y_pred = self.model.predict(input)
        return dates_num, y_pred.tolist()
    
    def year_inference(self, car_dict: dict):
        dates = np.arange(2000,2025, 1)
        car_dict['year'] = dates
        df = pd.DataFrame(car_dict)
        check, valores_no_permitidos = self.evaluar_dataframe_con_diccionario(df)
        if not check:
            print(f'Valores no permitidos o faltantes {valores_no_permitidos}')
            return None
        df['publish_date'] = self._float_to_date(df['publish_date'].values)

        df_scaled = self.scale_n_encode(df)
        print(df_scaled.head())

        # Se da por hecho este orden
        nuevo_orden = ['make', 'model', 'fuel', 'shift','kms','power','year', 'publish_date']
        data = df_scaled[nuevo_orden].values

        # Se dan por hecho estos inputs
        input = [data[:, :1], data[:, 1:2], data[:, 2:3], data[:, 3:4], data[:, 4:8]]
        y_pred = self.model.predict(input)
        print(y_pred)
        return dates.tolist(), y_pred.tolist()
    
    def kms_inference(self, car_dict: dict, km0: float = 1000, km1: float = 500000):
        kms = np.linspace(km0,km1, 100)
        car_dict['kms'] = kms
        df = pd.DataFrame(car_dict)
        check, valores_no_permitidos = self.evaluar_dataframe_con_diccionario(df)
        if not check:
            print(f'Valores no permitidos o faltantes {valores_no_permitidos}')
            return None
        prices = self.inference(car_dict)
        # print(kms, prices)
        return kms.tolist(), prices.flatten().tolist()

def main():
    import matplotlib.pyplot as plt

    ejemplo = { 'make':  "MERCEDES-BENZ",
                'model': "cla",
                'fuel': "Desconocido",
                'shift': "Automático",
                'kms': 250000,
                'power': 195,
                # 'publish_date': 2021.457,
                'year': 2007
                }
    path = f"./models/model_2024-08-20_00-35-06"
    inferencer = Inferencer(path)
    dates, y_pred = inferencer.time_inference(ejemplo)
    print(y_pred)
    plt.plot(dates,y_pred.ravel())
    plt.xticks(rotation=45, ha='right')
    plt.xlabel('tiempo')
    plt.ylabel('precio')
    plt.show()


if __name__ == "__main__":
    main()

