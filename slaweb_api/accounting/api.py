# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from .views import *
from django.conf.urls import patterns, include, url
from accounting import accounting
from core.framework.views import SLAmeterAppView
from core.framework.routers import AppRouter


app_router = AppRouter(accounting, SLAmeterAppView)
app_router.register(r'AccUsers', AccountingClientsViewSet)
app_router.register(r'AccCriteria', AccountingCriteriaViewSet)
app_router.register(r'BillingPlans', BillingPlansViewSet)
app_router.register(r'BillingReports', BillingPlansReportsViewSet)
app_router.register(r'criteriaEvaluate', criteriaEvaluate, base_name='criteriaEvaluate')
app_router.register(r'createInvoice', createInvoiceView, base_name='createInvoice')
app_router.register(r'compareUsersDataVolume', compareUsersDataVolumeView, base_name='compareUsersDataVolume')
app_router.register(r'basicEvaluate', basicEvaluateView, base_name='basicEvaluate')
app_router.register(r'modules', AccountingModuleViewSet, base_name='module')

urlpatterns = patterns('',
    url(r'^accounting/', include(app_router.urls))
)

