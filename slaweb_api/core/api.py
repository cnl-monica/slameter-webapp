# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.conf.urls import patterns, include, url

import views
from .framework.base import BaseApp
from .framework.routers import ApiRootRouter


router = ApiRootRouter()
router.register(r'me', views.MeViewSet, base_name='me', no_list=True)
router.register(r'users', views.UserViewSet)
router.register(r'clients', views.ClientViewSet)
router.register(r'exporters', views.ExporterViewSet, base_name='exporter')
router.register(r'config', views.CoreConfigViewSet, base_name='core-config', no_list=True)
router.register_apps(r'apps', views.AppViewSet, BaseApp.all_apps, base_name='app')


urlpatterns = patterns('',
    url(r'', include(router.urls))
)