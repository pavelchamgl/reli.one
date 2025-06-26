import os
import json
from pathlib import Path
from dotenv import load_dotenv
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

    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'django_filters',
    'drf_spectacular',
    'cloudinary',
    'corsheaders',
    'mptt',

    'accounts',
    'analytics',
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

PROJECT_MANAGERS_EMAILS_RAW = os.getenv("PROJECT_MANAGERS_EMAILS", "[]")
try:
    PROJECT_MANAGERS_EMAILS = json.loads(PROJECT_MANAGERS_EMAILS_RAW)
except json.JSONDecodeError:
    PROJECT_MANAGERS_EMAILS = []


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


LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'errors.log'),
            'formatter': 'verbose',
            'maxBytes': 2.5 * 1024 * 1024,
            'backupCount': 5,
        },
        'debug_file': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'debug.log'),
            'formatter': 'verbose',
            'maxBytes': 2.5 * 1024 * 1024,
            'backupCount': 5,
        },
        'payment_file': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'payment.log'),
            'formatter': 'verbose',
            'maxBytes': 2.5 * 1024 * 1024,
            'backupCount': 5,
        },
        'otp_file': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'otp.log'),
            'formatter': 'verbose',
            'maxBytes': 2.5 * 1024 * 1024,
            'backupCount': 5,
        },
        'warehouse_file': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'warehouse.log'),
            'formatter': 'verbose',
            'maxBytes': 2.5 * 1024 * 1024,
            'backupCount': 5,
        },
    },
    'loggers': {
        'django': {
            'handlers': ['error_file', 'debug_file'],
            'level': 'DEBUG',
            'propagate': True,
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
    },
}
