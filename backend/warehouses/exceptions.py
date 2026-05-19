class InsufficientStockError(Exception):
    """
    Raised when requested stock quantity exceeds available stock.

    ``detail`` carries context for reservation callers:
        {
            "sku":       str,   # affected SKU
            "requested": int,   # quantity requested
            "available": int,   # quantity currently available
        }
    Existing callers that do ``raise InsufficientStockError()`` (no args) are unaffected.
    """

    def __init__(self, detail: dict | None = None):
        self.detail = detail or {}
        message = str(self.detail) if self.detail else "Insufficient stock"
        super().__init__(message)
