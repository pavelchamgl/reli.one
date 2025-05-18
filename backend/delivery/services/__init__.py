from .packeta import PacketaService


SERVICE_MAP = {
    "PACKETA":    PacketaService,
}


def get_service(code):
    try:
        return SERVICE_MAP[code]()
    except KeyError:
        raise ValueError(f"Unknown courier {code}")
