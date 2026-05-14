class InsufficientStockError(Exception):
    """Raised when requested stock quantity is greater than available stock."""
    pass
