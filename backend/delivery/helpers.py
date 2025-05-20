from delivery.services.packeta_point_service import resolve_country_from_local_pickup_point


def resolve_country_code_from_group(group: dict, idx: int, logger=None) -> str | None:
    delivery_type = group.get("delivery_type")

    if delivery_type == 2:
        delivery_address = group.get("delivery_address", {})
        country_code = delivery_address.get("country")
        if not country_code and logger:
            logger.error(f"Group {idx}: Missing country in delivery_address.")
        return country_code

    elif delivery_type == 1:
        pickup_point_id = group.get("pickup_point_id")
        if not pickup_point_id:
            if logger:
                logger.error(f"Group {idx}: Missing pickup_point_id for PUDO delivery.")
            return None
        country_code = resolve_country_from_local_pickup_point(pickup_point_id)
        if not country_code and logger:
            logger.error(f"Group {idx}: Could not resolve country for pickup_point_id {pickup_point_id}.")
        return country_code

    if logger:
        logger.error(f"Group {idx}: Unknown delivery_type {delivery_type}")
    return None