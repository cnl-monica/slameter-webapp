# -*- coding: utf-8 -*-
"""
Development Settings
"""

from .base import *

DEBUG = True
TEMPLATE_DEBUG = True

# Enable CORS from client development grunt server:
CORS_ORIGIN_ALLOW_ALL = True

INSTALLED_APPS += (
    'django_extensions',
    'corsheaders',
    'rest_framework',
)

MIDDLEWARE_CLASSES += (
    'corsheaders.middleware.CorsMiddleware',
)


# use dummy cache in development
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# CACHES = {
#     "default": {
#         "BACKEND": "redis_cache.cache.RedisCache",
#         "LOCATION": "127.0.0.1:6379:1",
#         "OPTIONS": {
#             "CLIENT_CLASS": "redis_cache.client.DefaultClient",
#         }
#     }
# }

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s'
        },
        'simple': {
            'format': '%(levelname)s %(message)s'
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
    },
    'loggers': {
        # 'django.db.backends': {
        #     'level':  'DEBUG',
        #     'handlers': ['console'],
        #     # 'sql': True,
        # },
        'django': {
            'handlers': ['console'],
            'propagate': True,
            'level': 'INFO',
        },
        'socketio': {
            'handlers': ['console'],
            'propagate': True,
            'level': 'DEBUG',
        },
        'suds.client': {
            'handler': ['console'],
            'level': 'INFO'
        },
        'data_connector': {
            'handlers': ['console'],
            'level': 'INFO'
        }
    }
}
