import json
import os
from datetime import timedelta
from decimal import Decimal
from pathlib import Path

from dotenv import load_dotenv

from env_parse import (
    cookie_samesite_from_env,
    int_from_env,
    resolve_cors_allowed_origins,
    str_to_bool,
)

# Build paths inside this folder: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
# Корень репозитория (родитель каталога backend/, где лежит manage.py).
REPO_ROOT = BASE_DIR.parent

# Переменные окружения: сначала общие файлы в repo/envs/ (как на проде), затем локальный backend/.env.
# По умолчанию load_dotenv не перезаписывает уже заданные в процессе переменные (systemd/Docker).
load_dotenv(REPO_ROOT / "envs" / "database.env")
load_dotenv(REPO_ROOT / "envs" / "backend.env")
load_dotenv(BASE_DIR / ".env")

# Media files (override via env for Docker e2e и др.; дефолты как на production)
MEDIA_URL = os.getenv("MEDIA_URL", "/media/")
MEDIA_ROOT = os.getenv("MEDIA_ROOT", os.path.join(BASE_DIR, "media"))

CLOUDINARY_URL = os.getenv('CLOUDINARY_URL')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", "False").lower() in ("1", "true", "yes")

# Dev-only HTTP-маршруты курьеров (MyGLS/DPD) в delivery.urls — см. delivery.dev_access.
# В production держать False. Для стенда без DEBUG можно выставить True явно.
ENABLE_DELIVERY_DEV_ENDPOINTS = os.getenv(
    "ENABLE_DELIVERY_DEV_ENDPOINTS", "False"
).lower() in ("1", "true", "yes")

# Task 013: stock reservation at checkout session creation (Phase 3+).
# Default False — deploy code/migrations without changing checkout behaviour.
STOCK_RESERVATION_ENABLED = str_to_bool(os.getenv("STOCK_RESERVATION_ENABLED", "False"))

# E2E test helpers. NEVER enable in production. Default False.
# STRIPE_WEBHOOK_SKIP_SIGNATURE — skip Stripe signature verification in webhook view.
# ENABLE_E2E_ENDPOINTS — expose /api/e2e/* test-setup endpoints.
STRIPE_WEBHOOK_SKIP_SIGNATURE = os.getenv(
    "STRIPE_WEBHOOK_SKIP_SIGNATURE", "False"
).lower() in ("1", "true", "yes")
ENABLE_E2E_ENDPOINTS = os.getenv(
    "ENABLE_E2E_ENDPOINTS", "False"
).lower() in ("1", "true", "yes")

CSRF_TRUSTED_ORIGINS = [
    'https://reli.one',
    'https://www.reli.one',
    'https://localhost',
    'http://localhost',
    'http://45.147.248.21',
]

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_CONTENT_TYPE_NOSNIFF = True

# --- HTTPS / HSTS / cookies (env; безопасные дефолты для local и HTTP e2e) ---
# Production: см. docs/07-deployment.md и envs/backend.env.example
SECURE_SSL_REDIRECT = str_to_bool(os.getenv("SECURE_SSL_REDIRECT", "False"))
SECURE_HSTS_SECONDS = int_from_env("SECURE_HSTS_SECONDS", 0)
SECURE_HSTS_INCLUDE_SUBDOMAINS = str_to_bool(
    os.getenv("SECURE_HSTS_INCLUDE_SUBDOMAINS", "True")
)
SECURE_HSTS_PRELOAD = str_to_bool(os.getenv("SECURE_HSTS_PRELOAD", "True"))

SESSION_COOKIE_SECURE = str_to_bool(os.getenv("SESSION_COOKIE_SECURE", "False"))
CSRF_COOKIE_SECURE = str_to_bool(os.getenv("CSRF_COOKIE_SECURE", "False"))
SESSION_COOKIE_HTTPONLY = str_to_bool(os.getenv("SESSION_COOKIE_HTTPONLY", "True"))
# CSRF_COOKIE_HTTPONLY не задаём: при True JS не прочитает csrftoken (ломает типичные SPA).
SESSION_COOKIE_SAMESITE = cookie_samesite_from_env("SESSION_COOKIE_SAMESITE", "Lax")
CSRF_COOKIE_SAMESITE = cookie_samesite_from_env("CSRF_COOKIE_SAMESITE", "Lax")

ALLOWED_HOSTS_ENV = os.getenv("ALLOWED_HOSTS", "")

if ALLOWED_HOSTS_ENV == "*":
    ALLOWED_HOSTS = ["*"]
elif ALLOWED_HOSTS_ENV:
    ALLOWED_HOSTS = [
        host.strip()
        for host in ALLOWED_HOSTS_ENV.split(",")
        if host.strip()
    ]
else:
    ALLOWED_HOSTS = [
        "reli.one",
        "www.reli.one",
        "info.reli.one",
        "45.147.248.21",
        "localhost",
        "127.0.0.1",
    ]

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.facebook',
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'django_filters',
    'drf_spectacular',
    'cloudinary',
    'corsheaders',
    'mptt',

    'accounts',
    'analytics',
    'banners',
    'contactform',
    "delivery",
    'favorites',
    'news',
    'order',
    'payment',
    'product',
    'promocode',
    'reports',
    'reviews',
    'sellers',
    'supplier',
    'vacancies',
    'warehouses',
]

AUTH_USER_MODEL = "accounts.CustomUser"

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    "sellers.middleware.CurrentUserAuditMiddleware",
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'templates'),
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': os.getenv("DB_NAME"),
        'USER': os.getenv("DB_USER"),
        'PASSWORD': os.getenv("DB_PASS"),
        'HOST': os.getenv("DB_HOST"),
        'PORT': os.getenv("DB_PORT")
    }
}

if not DATABASES['default'].get('NAME'):
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

OTP_LIFETIME = timedelta(minutes=15)

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=20),
}

SITE_ID = 2

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

# allauth / dj-rest-auth
ACCOUNT_LOGIN_METHODS = {"email"}
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*", "password2*"]
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_EMAIL_VERIFICATION = "none"
ACCOUNT_SIGNUP_REDIRECT_URL = "/"
ACCOUNT_LOGOUT_REDIRECT_URL = "/"

REST_AUTH = {
    'REGISTER_SERIALIZER': 'accounts.serializers.UserRegistrationSerializer',

    'USE_JWT': True,
    'JWT_AUTH_SECURE': True,
    'JWT_AUTH_SAMESITE': 'Lax',

    'TOKEN_MODEL': None,
}

REST_USE_JWT = True

SOCIALACCOUNT_ADAPTER = 'allauth.socialaccount.adapter.DefaultSocialAccountAdapter'
SOCIALACCOUNT_AUTO_SIGNUP = True

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend'
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DATETIME_FORMAT': '%d.%m.%Y %H:%M',
    'DATE_FORMAT': '%d.%m.%Y',
    'TIME_FORMAT': '%H:%M',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'otp': '5/minute',
        'ares_lookup': '30/hour',
    },
}

MAX_UPLOAD_SIZE = 13 * 1024 * 1024  # 13 MB

# Internationalization

LANGUAGE_CODE = 'en'

TIME_ZONE = 'Europe/Moscow'

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = os.getenv("STATIC_URL", "/reli.one/static/")
STATIC_ROOT = os.getenv("STATIC_ROOT", os.path.join(BASE_DIR, "static"))

DEFAULT_PROJECT_MANAGERS = ["office@reli.one"]

PROJECT_MANAGERS_EMAILS_RAW = os.getenv("PROJECT_MANAGERS_EMAILS")

if PROJECT_MANAGERS_EMAILS_RAW:
    try:
        PROJECT_MANAGERS_EMAILS = json.loads(PROJECT_MANAGERS_EMAILS_RAW)
    except json.JSONDecodeError:
        PROJECT_MANAGERS_EMAILS = DEFAULT_PROJECT_MANAGERS
else:
    PROJECT_MANAGERS_EMAILS = DEFAULT_PROJECT_MANAGERS


EMAIL_BACKEND = os.getenv("EMAIL_BACKEND")
EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = os.getenv("EMAIL_PORT")
EMAIL_USE_TLS = str_to_bool(os.getenv('EMAIL_USE_TLS', 'False'))
EMAIL_USE_SSL = str_to_bool(os.getenv('EMAIL_USE_SSL', 'False'))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL")
SERVER_EMAIL = os.getenv("SERVER_EMAIL")
EMAIL_TIMEOUT = float(os.getenv("EMAIL_TIMEOUT", "10.0"))

SPECTACULAR_SETTINGS = {
    'TITLE': 'Reli market API',
    'DESCRIPTION': 'European marketplace',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    # OTHER SETTINGS
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
REDIRECT_DOMAIN = 'https://reli.one/'

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = resolve_cors_allowed_origins(
    debug=DEBUG,
    enable_e2e_endpoints=ENABLE_E2E_ENDPOINTS,
    cors_allowed_origins_env=os.getenv("CORS_ALLOWED_ORIGINS", ""),
)

PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")
PAYPAL_WEBHOOK_ID = os.getenv("PAYPAL_WEBHOOK_ID")
PAYPAL_MODE = os.getenv('PAYPAL_MODE', 'sandbox')
if PAYPAL_MODE == 'live':
    PAYPAL_API_URL = 'https://api-m.paypal.com'
else:
    PAYPAL_API_URL = 'https://api-m.sandbox.paypal.com'

STRIPE_API_PUBLISHABLE_KEY = os.getenv("STRIPE_API_PUBLISHABLE_KEY")
STRIPE_API_SECRET_KEY = os.getenv("STRIPE_API_SECRET_KEY")
STRIPE_WEBHOOK_ENDPOINT_SECRET = os.getenv("STRIPE_WEBHOOK_ENDPOINT_SECRET")

PACKETA_API_KEY = os.getenv("PACKETA_API_KEY")
PACKETA_API_PASSWORD = os.getenv("PACKETA_API_PASSWORD")
PACKETA_ESHOP_CODE = os.getenv("PACKETA_ESHOP_CODE")
PACKETA_API_LOCALE = os.getenv("PACKETA_API_LOCALE", "en_GB")
PACKETA_INVOICE_LOCALE = os.getenv("PACKETA_INVOICE_LOCALE", "cs_CZ")

MYGLS_API_BASE = os.getenv("MYGLS_API_BASE")
MYGLS_USERNAME = os.getenv("MYGLS_USERNAME")
MYGLS_PASSWORD_SHA512 = os.getenv("MYGLS_PASSWORD_SHA512")
MYGLS_WEBSHOP_ENGINE = os.getenv("MYGLS_WEBSHOP_ENGINE")
MYGLS_CLIENT_NUMBER = os.getenv("MYGLS_CLIENT_NUMBER")
MYGLS_TYPE_OF_PRINTER = os.getenv("MYGLS_TYPE_OF_PRINTER")
MYGLS_HTTP_TIMEOUT = os.getenv("MYGLS_HTTP_TIMEOUT")
MYGLS_HTTP_RETRIES = os.getenv("MYGLS_HTTP_RETRIES")
# Прайс-параметры:
FUEL_DIESEL_AVG_CZ = os.getenv("FUEL_DIESEL_AVG_CZ")
SEASONAL_SURCHARGE_ENABLED = os.getenv("SEASONAL_SURCHARGE_ENABLED")
# Опции на случай «капризного» стенда
MYGLS_PASSWORD_FORMAT = "bytes"  # или base64
MYGLS_INCLUDE_CLIENT_NUMBER_LIST = False

MYGLS_PICKUP_NAME = os.getenv("MYGLS_PICKUP_NAME", "Reli Group s.r.o.")
MYGLS_PICKUP_STREET = os.getenv("MYGLS_PICKUP_STREET", "Na Lysinách")
MYGLS_PICKUP_HOUSE_NUMBER = os.getenv("MYGLS_PICKUP_HOUSE_NUMBER", "551/34")
MYGLS_PICKUP_CITY = os.getenv("MYGLS_PICKUP_CITY", "Prague")
MYGLS_PICKUP_ZIP = os.getenv("MYGLS_PICKUP_ZIP", " 14700")
MYGLS_PICKUP_COUNTRY_ISO = os.getenv("MYGLS_PICKUP_COUNTRY_ISO", "CZ")
MYGLS_PICKUP_EMAIL = os.getenv("MYGLS_PICKUP_EMAIL", "office@reli.one")
MYGLS_PICKUP_PHONE = os.getenv("MYGLS_PICKUP_PHONE", "+420797837856")
# --- MyGLS dev helpers ---
MYGLS_AUTHCHECK_CACHE_SECONDS = int(os.getenv("MYGLS_AUTHCHECK_CACHE_SECONDS", 600))

GLS_FUEL_PCT = Decimal("0.011")  # 1.1% (статично на время тестов)
GLS_TOLL_PER_KG_DOMESTIC = Decimal("1.47")
GLS_TOLL_PER_KG_EXPORT = Decimal("3.00")
GLS_PUDO_EXPORT_DISCOUNT_CZK = Decimal("27")  # скидка к HD базе

# ========= DPD: базовые флаги/URLs =========
DPD_ENABLED = os.getenv("DPD_ENABLED", "true").lower() == "true"
DPD_API_BASE = os.getenv("DPD_API_BASE")

# ========= DPD: авторизация/идентификаторы =========
DPD_TOKEN = os.getenv("DPD_TOKEN", "")
DPD_CUSTOMER_ID = os.getenv("DPD_CUSTOMER_ID", "")
DPD_SENDER_ADDRESS_ID = os.getenv("DPD_SENDER_ADDRESS_ID", "")
DPD_BU_CODE = os.getenv("DPD_BU_CODE", "015")  # CZ

# ========= DPD: печать ярлыков =========
DPD_PRINT_FORMAT = os.getenv("DPD_PRINT_FORMAT", "PDF")  # "PDF" | "ZPL"
DPD_LABEL_SIZE = os.getenv("DPD_LABEL_SIZE", "A6")  # "A4" | "A6"
DPD_LABEL_DIR = os.getenv("DPD_LABEL_DIR", "dpd_labels")  # подпапка в MEDIA_ROOT
DPD_LABEL_START_POSITION = int(os.getenv("DPD_LABEL_START_POSITION", "1"))  # A4 1..4

# ========= DPD: сеть / ретраи =========
DPD_TIMEOUT_CONNECT = int(os.getenv("DPD_TIMEOUT_CONNECT", "5"))
DPD_TIMEOUT_READ = int(os.getenv("DPD_TIMEOUT_READ", "30"))
DPD_RETRIES = int(os.getenv("DPD_RETRIES", "3"))

# ========= ARES: CZ company lookup =========
ARES_API_BASE = os.getenv("ARES_API_BASE", "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest")
ARES_HTTP_TIMEOUT_CONNECT = int_from_env("ARES_HTTP_TIMEOUT_CONNECT", 5)
ARES_HTTP_TIMEOUT_READ = int_from_env("ARES_HTTP_TIMEOUT_READ", 10)
ARES_HTTP_RETRIES = int_from_env("ARES_HTTP_RETRIES", 2)
ARES_CACHE_SECONDS = int_from_env("ARES_CACHE_SECONDS", 86400)

# ========= DPD: доп. опции =========
DPD_SHIP_SAVE_MODE = os.getenv("DPD_SHIP_SAVE_MODE", "draft")
DPD_PHONE_DEFAULT_PREFIX = os.getenv("DPD_PHONE_DEFAULT_PREFIX", "420")
DPD_INTERNAL_PICKUP_ADDRESS_ID = os.getenv("DPD_INTERNAL_PICKUP_ADDRESS_ID", "")
DPD_COD_CURRENCY = os.getenv("DPD_COD_CURRENCY", "EUR")

# Гарантируем наличие папки для ярлыков
os.makedirs(os.path.join(MEDIA_ROOT, DPD_LABEL_DIR), exist_ok=True)

# Простейший in-memory кэш для дев-окружения
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "mygls-local-cache",
        "TIMEOUT": None,
    },
    # Алиас под конверсии (в dev тоже in-memory)
    "conv": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "conv-local-cache",
        "TIMEOUT": 60 * 60 * 24,  # час, можно None
    },
}

os.makedirs(os.path.join(BASE_DIR, "logs"), exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} [{name}] {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} [{name}] {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'errors.log'),
            'formatter': 'verbose',
            'maxBytes': int(2.5 * 1024 * 1024),
            'backupCount': 5,
            'encoding': 'utf-8',
            'delay': True,
        },
        'debug_file': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'debug.log'),
            'formatter': 'verbose',
            'maxBytes': int(2.5 * 1024 * 1024),
            'backupCount': 5,
            'encoding': 'utf-8',
            'delay': True,
        },
        'payment_file': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'payment.log'),
            'formatter': 'verbose',
            'maxBytes': int(2.5 * 1024 * 1024),
            'backupCount': 5,
            'encoding': 'utf-8',
            'delay': True,
        },
        'otp_file': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'otp.log'),
            'formatter': 'verbose',
            'maxBytes': int(2.5 * 1024 * 1024),
            'backupCount': 5,
            'encoding': 'utf-8',
            'delay': True,
        },
        'warehouse_file': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'warehouse.log'),
            'formatter': 'verbose',
            'maxBytes': int(2.5 * 1024 * 1024),
            'backupCount': 5,
            'encoding': 'utf-8',
            'delay': True,
        },
        'currency_file': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'currency.log'),
            'formatter': 'verbose',
            'maxBytes': int(2.5 * 1024 * 1024),
            'backupCount': 5,
            'encoding': 'utf-8',
            'delay': True,
        },
        'georouting_file': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'georouting.log'),
            'formatter': 'verbose',
            'maxBytes': int(2.5 * 1024 * 1024),
            'backupCount': 5,
            'encoding': 'utf-8',
            'delay': True,
        },
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['debug_file'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.template': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.template.base': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django': {
            'handlers': ['error_file', 'debug_file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'accounts': {
            'handlers': ['debug_file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'delivery': {
            'handlers': ['debug_file', 'error_file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'payment': {
            'handlers': ['payment_file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'otp': {
            'handlers': ['otp_file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'warehouse': {
            'handlers': ['warehouse_file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'sellers': {
            'handlers': ['debug_file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'delivery.services.currency_converter': {
            'handlers': ['currency_file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'delivery.services.cnb_service': {
            'handlers': ['currency_file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'delivery.georouting': {
            'handlers': ['georouting_file', 'console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Google Merchant Center feed
PUBLIC_DOMAIN = os.getenv("PUBLIC_DOMAIN", "https://reli.one")
FEED_CURRENCY = os.getenv("FEED_CURRENCY", "EUR")
GMC_FEED_RELATIVE_PATH = os.getenv("GMC_FEED_RELATIVE_PATH", "feeds/google.xml")
# Only Nutristar products in feed (SellerProfile id=43)
GMC_ONLY_SELLER_IDS = [43]
# Static brand override per seller_id
GMC_STATIC_BRANDS = {
    43: "Nutristar",
}

# Multi-currency (см. ADR pricing-and-fx-policy). Канон — CZK.
DEFAULT_DISPLAY_CURRENCY = os.getenv("DEFAULT_DISPLAY_CURRENCY", "CZK")
SUPPORTED_DISPLAY_CURRENCIES = [
    c.strip().upper()
    for c in os.getenv("SUPPORTED_DISPLAY_CURRENCIES", "CZK,EUR").split(",")
    if c.strip()
]
FX_RATE_MARKUP = os.getenv("FX_RATE_MARKUP", "0.30")  # CZK/EUR, аддит. маркап к курсу

# ---------------------------------------------------------------------------
# Sentry — error monitoring
# Активируется только при наличии SENTRY_DSN и DEBUG=False.
# DSN никогда не хардкодится; PII не передаётся.
# ---------------------------------------------------------------------------
_SENTRY_DSN = os.getenv("SENTRY_DSN", "")

if _SENTRY_DSN and not DEBUG:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration

    _SENSITIVE_KEYS = frozenset(
        {
            "password", "token", "access_token", "refresh_token",
            "card_number", "cvv", "iban", "secret", "api_key",
        }
    )

    def _sentry_before_send(event, hint):  # noqa: ARG001
        """Strip sensitive fields from request body before sending to Sentry."""
        request = event.get("request", {})
        data = request.get("data")
        if isinstance(data, dict):
            request["data"] = {
                k: "[Filtered]" if k.lower() in _SENSITIVE_KEYS else v
                for k, v in data.items()
            }
        return event

    sentry_sdk.init(
        dsn=_SENTRY_DSN,
        integrations=[
            DjangoIntegration(transaction_style="url"),
            LoggingIntegration(level=None, event_level="ERROR"),
        ],
        traces_sample_rate=0.1,
        send_default_pii=False,
        before_send=_sentry_before_send,
    )
