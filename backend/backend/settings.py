"""
Django settings for backend project.

Generated by 'django-admin startproject' using Django 4.2.3.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.2/ref/settings/
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Import .env.dev vars
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
os.environ.get("STRIPE_SECRET_KEY_TEST")
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_SSL_REDIRECT = False

MEDIA_URL = '/base_product_images/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'base_product_images')

CLOUDINARY_URL = os.getenv('CLOUDINARY_URL')


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-=aq+%ja=ny41y1hvyzzm+jo4=p+ka=h1af19_z)qn1i*1w_yf6'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

CSRF_TRUSTED_ORIGINS = ['https://solopharma.shop','https://localhost']

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('X-FORWARDED-PROTO', 'https')

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True


ALLOWED_HOSTS = ['*']

PAYPAL_TEST = True
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
    'django_filters',
    'drf_spectacular',
    'cloudinary',
    'corsheaders',

    'accounts',
    'order',
    'product',
    'reviews',
    'promocode',
    'payment',
    'contactform',
    'news',
    'vacancies',
    'favorites',
]
PAYPAL_RECEIVER_EMAIL = 'novapiple228@gmail.com'

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
            os.path.join(BASE_DIR, 'account/templates'),
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
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv("DB_NAME"),
        'USER': os.getenv("DB_USER"),
        'PASSWORD': os.getenv("DB_PASS"),
        'HOST': os.getenv("DB_HOST"),
        'PORT': os.getenv("DB_PORT")
    }
}
# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

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

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.TokenAuthentication',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

MAX_UPLOAD_SIZE = 13 * 1024 * 1024  # 13 MB

# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'ru-RU'

TIME_ZONE = 'Europe/Moscow'

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = 'static'
STATIC_ROOT = "/app/static"
STATIC_URL += '/'
# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

EMAIL_FROM = os.environ.get('AUTHEMAIL_DEFAULT_EMAIL_FROM') or 'novapiple228@gmail.com'
EMAIL_BCC = os.environ.get('AUTHEMAIL_DEFAULT_EMAIL_BCC') or 'novapiple228@gmail.com'

EMAIL_HOST = os.environ.get('AUTHEMAIL_EMAIL_HOST') or 'smtp.gmail.com'
EMAIL_PORT = os.environ.get('AUTHEMAIL_EMAIL_PORT') or 587
EMAIL_HOST_USER = os.environ.get('AUTHEMAIL_EMAIL_HOST_USER') or 'novapiple228@gmail.com'
EMAIL_HOST_PASSWORD = os.environ.get('AUTHEMAIL_EMAIL_HOST_PASSWORD') or 'hiym azto ehqc spfk '
EMAIL_USE_TLS = True
EMAIL_USE_SSL = False

SPECTACULAR_SETTINGS = {
    'TITLE': 'Чехский сайт API',
    'DESCRIPTION': 'ура победа',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    # OTHER SETTINGS
}


DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
REDIRECT_DOMAIN = 'http://localhost:8000'


CORS_ALLOW_ALL_ORIGINS = True

PAYPAL_CLIENT_ID = 'AXEZG1puHKBW5ccFE7PYG8Xet2eWZULwKhGIIZ8C7PExHNO2QiHyLQbCO7fOcAEcHCIjrm9a5NCDz_e6'
PAYPAL_CLIENT_SECRET = 'EPSaetqnRDsodizl9GBdAdUV9Q8JVnfncIPU7n-fh3tgXj_wum4952OhLPhFmicDYZOOiXOTdSzu40bn'
PAYPAL_WEBHOOK_ID = '0G956522WE998125E'

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
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'paypal_webhook.log'),
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'payment': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
