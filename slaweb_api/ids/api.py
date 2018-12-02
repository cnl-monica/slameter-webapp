# -*- coding: utf-8 -*- 
from __future__ import unicode_literals

from .views import *
from django.conf.urls import patterns, include, url
from core.framework.views import SLAmeterAppView
from core.framework.routers import AppRouter
from ids import ids


app_router = AppRouter(ids, SLAmeterAppView)
app_router.register(r'AttackLogs', AttackLogsViewSet)
app_router.register(r'AttackDetails', AttackDetailsViewSet)
app_router.register(r'modules', IdsModuleViewSet, base_name='module')

urlpatterns = patterns('',
    url(r'^ids/', include(app_router.urls))
)
