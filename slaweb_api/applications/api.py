# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from .views import ApplicationsModuleViewSet, BasicModuleView
from django.conf.urls import patterns, include, url
from core.framework.views import SLAmeterAppView
from core.framework.routers import AppRouter
from applications import applications

app_router = AppRouter(applications, SLAmeterAppView)
app_router.register(r'basicAppModule', BasicModuleView, base_name='basicAppModule')
app_router.register(r'modules', ApplicationsModuleViewSet, base_name='module')

urlpatterns = patterns('',
    url(r'^applications/', include(app_router.urls))
)
