# -*- coding: utf-8 -*-
"""
Generic views or view mixins for SLAmeter web api.

Contains views and viewsets for use with `rest_framework`.
"""
from __future__ import unicode_literals
from abc import ABCMeta
from django.views.decorators.csrf import csrf_exempt
import os

from django.conf import settings as django_settings
from django.core.exceptions import ImproperlyConfigured
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page, never_cache
from django.views.decorators.vary import vary_on_headers
from rest_framework.decorators import link, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet, GenericViewSet
from core.framework.utils import load_config

from .permissions import CanAccessApp


class CachedViewSetMixin(object):
    @method_decorator(cache_page(10))
    @method_decorator(vary_on_headers('Authorization'))
    @method_decorator(csrf_exempt)  # CSRF is handled by rest_framework explicitly, if using session auth
    def dispatch(self, *args, **kwargs):
        return super(CachedViewSetMixin, self).dispatch(*args, **kwargs)


class SLAmeterAppView(APIView):
    """
    Base view for SLAmeter web app.

    Used with :class:`RootRouter` in app api definition.
    """
    permission_classes = (CanAccessApp, )

    app = None
    app_serializer_class = None

    def __init__(self, app=None, **kwargs):
        self.app = app
        self.app_serializer_class = app.app_serializer_class
        if self.app is None:
            raise ImproperlyConfigured('%s does not have SLAmeter app specified as one of its kwargs '
                                       'in .as_view() method call.' % self.__class__.__name__)
        super(SLAmeterAppView, self).__init__(**kwargs)

    def get_data(self, request, format=None):
        serializer = self.app_serializer_class(self.app, context={'request': request, 'format': format})
        return serializer.data

    def get(self, request, format=None):
        self.check_object_permissions(request, self.app)
        return Response(self.get_data(request, format))


class ConfigViewSet(CachedViewSetMixin, ViewSet):
    """
    ViewSet for core application configuration.
    """
    configs_dir_path = os.path.join(django_settings.BASE_DIR, 'configs')
    config_file_name = None

    def retrieve(self, request):
        config = load_config(os.path.join(self.configs_dir_path, self.config_file_name), request.user)
        return Response(config)


class AbstractModuleViewSet(GenericViewSet):
    """
    Abstract viewset for modules. Must implement at least data accessing method
    and set `app` reference.
    """
    __metaclass__ = ABCMeta

    lookup_field = "name"

    @property
    def app(self):
        raise NotImplementedError('%s should be configured with `app` attribute.' % self.__class__.__name__)

    def list(self, request):
        queryset = [self.get_module_instance(module, request) for module in self.app.modules]
        ret = []
        for module in queryset:
            serializer = module.serializer_class(module, context={'request': request})
            ret.append(serializer.data)
        return Response(ret)

    def retrieve(self, request, name=None):
        module = self.get_module_instance(self.app.get_module_class_by_name(name), request)
        serializer = module.serializer_class(module, context={'request': request})
        return Response(serializer.data)

    @action(methods=['GET', 'POST'])
    @never_cache
    def data(self, request, name=None):
        query = request.QUERY_PARAMS.get('query')
        module = self.get_module_instance(self.app.get_module_class_by_name(name), request)

        data = self.get_data(module, query, request)

        return Response(data)

    def get_module_instance(self, module, request):
        """
        Get instance of module.

        :param module: module class
        :param request: http request
        :return: module instance
        """
        return module(request.user)

    def get_data(self, module, query, request):
        """
        Method for accessing module data.

        :param module: module instance
        :param query: data query
        :param request: http request
        :return: module data
        """
        raise NotImplementedError('%s should implement method `get_data` used to get data from '
                                  'module data source based on query made by the user.' % self.__class__.__name__)
