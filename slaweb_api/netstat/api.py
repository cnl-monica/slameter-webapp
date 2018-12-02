# -*- coding: utf-8 -*- 
from __future__ import unicode_literals

from django.conf.urls import patterns, include, url
from core.framework.views import SLAmeterAppView
from core.framework.routers import Router, AppRouter
from netstat import views, netstat


filter_router = Router()
filter_router.register(r'filter_queries', views.ModuleFilterQueryViewSet, base_name='filter_query')

app_router = AppRouter(netstat, SLAmeterAppView)
app_router.register(r'modules', views.NetstatModuleViewSet, base_name='module', nested_routers=(filter_router,))
app_router.register(r'global_filter_queries', views.GlobalFilterQueryViewSet, base_name='filter_query')

urlpatterns = patterns('',
    url(r'^netstat/', include(app_router.urls))
)
