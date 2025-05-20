import os
import pandas as pd

BASE_DIR = os.path.join(os.path.dirname(__file__), "postal_data")


class ZipCodeValidator:
    """
    Валидатор, проверяющий, существует ли указанный ZIP-код в выбранной стране.
    Данные берутся из GeoNames-совместимых .txt файлов в папке `postal_data/`.
    """

    _cache = {}

    @classmethod
    def load_country_zip_data(cls, country_code: str) -> pd.DataFrame:
        """
        Загружает ZIP-данные из файла вида SK.txt, CZ.txt и кэширует.
        """
        country_code = country_code.upper()

        if country_code in cls._cache:
            return cls._cache[country_code]

        file_path = os.path.join(BASE_DIR, f"{country_code}.txt")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"ZIP data file not found: {file_path}")

        df = pd.read_csv(
            file_path,
            sep="\t",
            header=None,
            dtype=str,
            encoding="utf-8",
            names=[
                "country_code", "postal_code", "place_name", "admin_name1", "admin_code1",
                "admin_name2", "admin_code2", "admin_name3", "admin_code3",
                "latitude", "longitude", "accuracy"
            ]
        )

        cls._cache[country_code] = df
        return df

    @classmethod
    def validate_zip_exists(cls, zip_code: str, country_code: str) -> bool:
        """
        Проверяет, существует ли ZIP-код в указанной стране.
        Удаляет пробелы и приводит ZIP к нормализованному виду.
        """
        zip_code = zip_code.strip().replace(" ", "")
        try:
            df = cls.load_country_zip_data(country_code)
        except FileNotFoundError:
            return False

        return not df[df["postal_code"].str.replace(" ", "") == zip_code].empty
