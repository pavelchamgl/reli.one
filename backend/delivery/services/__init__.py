from .packeta      import PacketaService
from .zasilkovna   import ZasilkovnaService

SERVICE_MAP = {
    "PACKETA":    PacketaService,
    "ZASILKOVNA": ZasilkovnaService,
}

def get_service(code):
    try:
        return SERVICE_MAP[code]()
    except KeyError:
        raise ValueError(f"Unknown courier {code}")