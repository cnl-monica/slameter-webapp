# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

import core.api

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^token-auth$', 'rest_framework.authtoken.views.obtain_auth_token'),  # Token authentication
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')),  # Browsable API authentication
    url(r'^api/', include(core.api)),  # REST API
    url(r'^admin/', include(admin.site.urls)),
    url(r'^ws/', 'core.views.socket_io'),
    *staticfiles_urlpatterns()
)
