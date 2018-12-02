# -*- coding: utf-8 -*-
"""
Production Settings
"""

from .base import *

DEBUG = False
TEMPLATE_DEBUG = False

# This is used only during building of distribution version
# really, files are served with nginx
STATIC_ROOT = os.path.join(BASE_DIR, 'tmp_static')

# accept forwarded protocol header
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')


ALLOWED_HOSTS = ['localhost', '127.0.0.1']

