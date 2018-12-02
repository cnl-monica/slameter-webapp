# -*- coding: utf-8 -*-
"""
Django settings for slameter_webserver project.

For more information on this file, see
https://docs.djangoproject.com/en/1.6/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.6/ref/settings/
"""
import os

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

TEMPLATE_DIRS = (
    os.path.join(BASE_DIR, 'templates'),
)

# not used
# STATICFILES_DIRS = (
#     os.path.join(BASE_DIR, 'static'),
#
# )


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.6/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '#@gd9sf2%k=4&qw$@ds9f$-fopk!@rde80g@yo*+=mmd6puvo('

ALLOWED_HOSTS = []


# Application definition

SLAMETER_WEB_APPS = (
    'core',
    'applications',
    'ids',
    'accounting',
    'evaluator',
    'netstat'
)

INSTALLED_APPS = (
    # django contrib
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # extra apps
    'rest_framework.authtoken',
    'djcelery'
)
INSTALLED_APPS += SLAMETER_WEB_APPS

MIDDLEWARE_CLASSES = (
    #'django.middleware.cache.UpdateCacheMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    #'django.middleware.cache.FetchFromCacheMiddleware',
)

ROOT_URLCONF = 'slaweb_api.urls'

WSGI_APPLICATION = 'slaweb_api.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.6/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'slaweb',
        'USER': 'slawebuser',
        'PASSWORD': 'slaweb',
        'HOST': '127.0.0.1',
        'PORT': '5432'
    },
    'bmdb': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'bmdb',
        'USER': 'bm',
        'PASSWORD': 'bm',
        'HOST': '127.0.0.1',
        'PORT': '5432',
    }
}

REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'core.framework.exceptions.rest_framework_exceptions_handler',
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'core.framework.permissions.IsAuthenticated',
    ),
}

DATA_CONNECTORS = {
    'EVALUATOR': {
        'default': {
            'HOST': '147.232.241.146',
            #'HOST': 'localhost',
            'PORT': '8084',
            'URL_PREFIX': 'Modules/'
        },
        'second': {
            'HOST': '147.232.241.140',
            'PORT': '8084',
            'URL_PREFIX': 'Modules/'
        }
    },
}

# Internationalization
# https://docs.djangoproject.com/en/1.6/topics/i18n/

LANGUAGE_CODE = 'en-us'

DEFAULT_CHARSET = 'utf-8'

TIME_ZONE = 'Europe/Bratislava'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.6/howto/static-files/

STATIC_URL = '/static/'

AUTH_USER_MODEL = 'core.User'

# Celery config
BROKER_TRANSPORT = 'redis'
CELERY_RESULT_BACKEND = 'redis://localhost'
BROKER_URL = 'redis://localhost:6379/0'
CELERYBEAT_SCHEDULER = 'djcelery.schedulers.DatabaseScheduler'
CELERY_TASK_RESULT_EXPIRES = 14400