import json
import os
import logging
from typing import Optional
from django.conf import settings

logger = logging.getLogger(__name__)

# Пути к локальным JSON-файлам
BOX_POINTS_FILE = os.path.join(settings.BASE_DIR, 'delivery', 'services', 'packeta_box_points.json')
BRANCH_POINTS_FILE = os.path.join(settings.BASE_DIR, 'delivery', 'services', 'packeta_branch.json')


def load_json_file(file_path):
    """
    Загружает JSON-данные из указанного файла.
    Возвращает список или пустой список в случае ошибки.
    """
    if not os.path.exists(file_path):
        logger.warning(f"File not found: {file_path}")
        return []

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load JSON file {file_path}: {e}")
        return []


def resolve_country_from_local_pickup_point(pickup_point_id: int) -> Optional[str]:
    """
    Ищет страну сначала в packeta_box_points.json, затем в packeta_branch.json.
    Возвращает None, если пункт не найден.
    """
    # 1. Поиск в box points
    box_points = load_json_file(BOX_POINTS_FILE)
    for point in box_points:
        if str(point.get("id")) == str(pickup_point_id):
            return point.get("country")

    # 2. Поиск в branch points
    branch_points = load_json_file(BRANCH_POINTS_FILE)
    for branch in branch_points:
        if str(branch.get("id")) == str(pickup_point_id):
            return branch.get("country")

    # 3. Не найдено
    logger.warning(f"Pickup point ID {pickup_point_id} not found in box or branch lists.")
    return None
