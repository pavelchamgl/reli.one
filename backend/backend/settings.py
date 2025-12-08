import os
import json
from pathlib import Path
from dotenv import load_dotenv
from decimal import Decimal
from datetime import timedelta

# Import .env.dev vars
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_SSL_REDIRECT = False

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

CLOUDINARY_URL = os.getenv('CLOUDINARY_URL')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG")

CSRF_TRUSTED_ORIGINS = [
    'https://reli.one',
    'https://www.reli.one',
    'https://localhost',
    'http://localhost',
    'http://45.147.248.21',
]

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('X-FORWARDED-PROTO', 'https')

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True


ALLOWED_HOSTS = ['*']

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

SITE_ID = 1

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

# Отключаем редиректы и страницы регистрации
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_EMAIL_VERIFICATION = 'none'
ACCOUNT_SIGNUP_REDIRECT_URL = "/"
ACCOUNT_LOGOUT_REDIRECT_URL = "/"
ACCOUNT_AUTHENTICATION_METHOD = "email"

REST_AUTH = {
    'REGISTER_SERIALIZER': 'accounts.serializers.UserRegistrationSerializer',

    'USE_JWT': True,
    'JWT_AUTH_SECURE': False,  # True если только через HTTPS
    'JWT_AUTH_SAMESITE': 'Lax',

    'TOKEN_MODEL': None,
}

REST_USE_JWT = True

SOCIALACCOUNT_PROVIDERS = {
    "facebook": {
        "APP": {
            "client_id": "твоя ID",
            "secret": "твой секрет",
            "key": ""
        },
        "SCOPE": ["email"],
        "FIELDS": ["email", "name", "first_name", "last_name"],
        "AUTH_PARAMS": {"auth_type": "reauthenticate"},
    }
}

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
}

MAX_UPLOAD_SIZE = 13 * 1024 * 1024  # 13 MB

# Internationalization

LANGUAGE_CODE = 'en'

TIME_ZONE = 'Europe/Moscow'

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/reli.one/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')

DEFAULT_PROJECT_MANAGERS = ["office@reli.one"]

PROJECT_MANAGERS_EMAILS_RAW = os.getenv("PROJECT_MANAGERS_EMAILS")

if PROJECT_MANAGERS_EMAILS_RAW:
    try:
        PROJECT_MANAGERS_EMAILS = json.loads(PROJECT_MANAGERS_EMAILS_RAW)
    except json.JSONDecodeError:
        PROJECT_MANAGERS_EMAILS = DEFAULT_PROJECT_MANAGERS
else:
    PROJECT_MANAGERS_EMAILS = DEFAULT_PROJECT_MANAGERS


def str_to_bool(value):
    return value.lower() in ('true', '1', 'yes')


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


CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = [
    "https://reli.one",
    "http://45.147.248.21:8081",
]


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
MYGLS_PASSWORD_FORMAT = "bytes"         # или base64
MYGLS_INCLUDE_CLIENT_NUMBER_LIST = False

MYGLS_PICKUP_NAME = os.getenv("MYGLS_PICKUP_NAME", "Reli Group s.r.o.")
MYGLS_PICKUP_STREET = os.getenv("MYGLS_PICKUP_STREET", "Hlavni")
MYGLS_PICKUP_HOUSE_NUMBER = os.getenv("MYGLS_PICKUP_HOUSE_NUMBER", "1")
MYGLS_PICKUP_CITY = os.getenv("MYGLS_PICKUP_CITY", "Praha")
MYGLS_PICKUP_ZIP = os.getenv("MYGLS_PICKUP_ZIP", "11000")
MYGLS_PICKUP_COUNTRY_ISO = os.getenv("MYGLS_PICKUP_COUNTRY_ISO", "CZ")
MYGLS_PICKUP_EMAIL = os.getenv("MYGLS_PICKUP_EMAIL", "warehouse@example.cz")
MYGLS_PICKUP_PHONE = os.getenv("MYGLS_PICKUP_PHONE", "+420123456789")
# --- MyGLS dev helpers ---
MYGLS_AUTHCHECK_CACHE_SECONDS = int(os.getenv("MYGLS_AUTHCHECK_CACHE_SECONDS", 600))

GLS_FUEL_PCT = Decimal("0.011")          # 1.1% (статично на время тестов)
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
DPD_PRINT_FORMAT = os.getenv("DPD_PRINT_FORMAT", "PDF")   # "PDF" | "ZPL"
DPD_LABEL_SIZE = os.getenv("DPD_LABEL_SIZE", "A6")        # "A4" | "A6"
DPD_LABEL_DIR = os.getenv("DPD_LABEL_DIR", "dpd_labels")  # подпапка в MEDIA_ROOT
DPD_LABEL_START_POSITION = int(os.getenv("DPD_LABEL_START_POSITION", "1"))  # A4 1..4

# ========= DPD: сеть / ретраи =========
DPD_TIMEOUT_CONNECT = int(os.getenv("DPD_TIMEOUT_CONNECT", "5"))
DPD_TIMEOUT_READ = int(os.getenv("DPD_TIMEOUT_READ", "30"))
DPD_RETRIES = int(os.getenv("DPD_RETRIES", "3"))

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
