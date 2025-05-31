from concurrent.futures import ThreadPoolExecutor

# Один пул на всё приложение.
# max_workers можно настроить под вашу нагрузку.
executor = ThreadPoolExecutor(max_workers=5)
