# -*- coding: utf-8 -*-
"""
This module contains base classes, that are extended in specific applications.
Base classes contain common functionality.
"""
from __future__ import unicode_literals

import os
import logging
from abc import ABCMeta, abstractmethod
from django.core.exceptions import ImproperlyConfigured

from django.http import Http404
from django.utils.importlib import import_module
from django.conf import settings as django_settings

from core.framework.exceptions import ModuleDataConnectionError
from core.framework.utils import load_config
from .serializers import BaseAppSerializer


class BaseApp(object):
    """
    Base class for SLAmeter web application.

    :param list all_apps: all SLAmeter Webserver apps, stored on class
    :param unicode name: app name
    :param unicode title: app title
    :param app_serializer_class: class of app serializer
    :param unicode api_module_name: name of the api module
    """
    all_apps = []

    name = None
    title = None

    _configs_dir_path = os.path.join(django_settings.BASE_DIR, 'configs')

    def __init__(self, name, title, app_serializer_class=None, api_module_name=None, config_file_name=None):
        self.name = name or self.name

        assert self.name in django_settings.SLAMETER_WEB_APPS,\
            'Name of SLAmeter web app must match one of existing django app names ' \
            '(registered in `SLAMETER_WEB_APPS` tuple in django settings)'

        self.title = title or self.title or self.name
        self.app_serializer_class = app_serializer_class or BaseAppSerializer
        self.api_module_name = api_module_name or ('%s.api' % self.name)
        self.config_file_name = config_file_name or ('%s.json' % self.name)
        self.modules = []

        self.register_app(self)

    @classmethod
    def register_app(cls, app):
        """
        Register SLAmeter web application

        :param BaseApp app: app to register and store to class.
        """
        cls.all_apps.append(app)

    @classmethod
    def get_app_by_name(cls, app_name):
        for app in cls.all_apps:
            if app.name == app_name:
                return app
        return None

    def module(self, cls):
        """
        Module registration decorator.
        Use this to decorate modules of this application.

        :param cls: module class to register.
        """
        assert cls.__name__ not in [module_class.__name__ for module_class in self.modules],\
            'Duplicate module name %s in app %s' % (cls.__name__, self.name)

        self.modules.append(cls)
        return cls

    def get_module_class_by_name(self, module_name):
        """
        Gets module class based on name of its module, or 404 if module is not found.

        :param unicode module_name: name of requested module
        :return: module class
        :raises Http404: if module is not found
        """
        for module_class in self.modules:
            if module_class.__name__ == module_name:
                return module_class
        raise Http404('Module named `%s` was not found in `%s` app.' % (module_name, self.name))

    def get_config(self, user):
        """
        Gets app config from config file.
        """
        return load_config(os.path.join(self._configs_dir_path, self.config_file_name), user)

    @property
    def urls(self):
        """
        Gets urlpattern property from api module.

        .. note::
            Api module should contain property named ``urlpatterns``.

        :returns: Django's urlpatterns
        :rtype: tuple
        """
        try:
            api_module = import_module(self.api_module_name)
            urlpatterns = getattr(api_module, 'urlpatterns')
            return urlpatterns
        except (ImportError, AttributeError):
            raise ImproperlyConfigured('URL definition for your app %s was not found on `urlpatterns` property of '
                                       'module %s. Make sure this module and property are defined.'
                                       % (self.name, self.api_module_name))

    @property
    def router(self):
        """
        Gets app root router from api module.

        .. note::
            Api module should contain property named ``app_router``.

        :return: app root router.
        """
        try:
            api_module = import_module(self.api_module_name)
            app_router = getattr(api_module, 'app_router')
            return app_router
        except (ImportError, AttributeError):
            raise ImproperlyConfigured('Router for your app %s was not found on `app_router` property of '
                                       'module %s. Make sure this module and property are defined.'
                                       % (self.name, self.api_module_name))

    def __unicode__(self):
        return "<SLAmeter web app: %s>" % (self.name,)

    def __repr__(self):
        return self.__unicode__()


class AbstractModule(object):
    """
    Abstract module class.

    :param unicode title: module title showing in web interface
    :param object _serializer_class: reference to serializer for module
    :param AbstractDataConnector _data_connector_class: reference to data connector for module
    """
    __metaclass__ = ABCMeta

    title = None

    _serializer_class = None
    _data_connector_class = None

    def __init__(self, user=None):
        self.name = self.__class__.__name__
        self.user = user

    @property
    def serializer_class(self):
        return self._serializer_class

    @serializer_class.setter
    def serializer_class(self, serializer_class):
        self._serializer_class = serializer_class

    @property
    def data_connector_class(self):
        return self._data_connector_class

    @data_connector_class.setter
    def data_connector_class(self, data_connector_class):
        self._data_connector_class = data_connector_class

    @abstractmethod
    def get_data(self, query=None):
        """
        This method is intended to handle incoming query, to connect to the module source
        and to return data retrieved through that connection.

        :param query: query coming from client
        """
        pass


class MetaDataConnector(type):
    """
    Meta class for data connector.
    Wraps ``get_data`` method with exceptions handling.
    See exception class ModuleDataConnectionError.
    """
    __metaclass__ = ABCMeta

    @staticmethod
    def wrap_get_data(get_data):
        def wrapped_get_data(self, *args, **kwargs):
            try:
                return get_data(self, *args, **kwargs)
            except Exception as e:
                raise ModuleDataConnectionError(e)
        return wrapped_get_data

    def __new__(mcs, name, bases, attributes):
        if 'get_data' in attributes:
            attributes['get_data'] = mcs.wrap_get_data(attributes['get_data'])
        return super(MetaDataConnector, mcs).__new__(mcs, name, bases, attributes)


class AbstractDataConnector(object):
    """
    Abstract data connector.
    """
    __metaclass__ = MetaDataConnector

    def __init__(self, module_name):
        self.module_name = module_name

        self.logger = logging.getLogger('data_connector')

    @abstractmethod
    def get_data(self, request):
        """
        This method is intended to handle data retrieval from data source.

        :param request: prepared request to be send to data source.
        """
        pass



