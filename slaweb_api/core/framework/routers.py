# -*- coding: utf-8 -*-
"""
Module defines routers used to construct api.
"""
from __future__ import unicode_literals

from collections import namedtuple
from django.conf.urls import url, include
from django.core.exceptions import ImproperlyConfigured
from rest_framework import reverse as rf_reverse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.routers import SimpleRouter, BaseRouter, Route

Registry = namedtuple("Registry", ['prefix', 'viewset', 'base_name', 'nested_routers', 'no_list'])


class Router(SimpleRouter):
    """
    Base class for routers, similar to rest_framework's SimpleRouter,
    but supports nested routers and viewsets for single objects that have no list view.

    :param namedtuple nested_route_constructor: nested route constructor
    :param namedtuple no_list_route_constructor: route with no list view
        (basically *SimpleRouter*-like list route url with detail route mappings and name).
    :param unicode name: name of the router
    """
    nested_route_constructor = Route(
        url=r'^{prefix}/{lookup}/',
        name='{basename}.{nested_name}',
        mapping=None,
        initkwargs=None
    )
    no_list_route_constructor = Route(
        url=r'^{prefix}{trailing_slash}$',
        mapping={
            'get': 'retrieve',
            'put': 'update',
            'patch': 'partial_update',
            'delete': 'destroy'
        },
        name='{basename}-detail',
        initkwargs={'suffix': 'Instance'}
    )

    def __init__(self, name=None):
        super(Router, self).__init__()
        self.name = name
        self._parent_router = None

    @property
    def parent_router(self):
        """
        Parent router getter
        """
        return self._parent_router

    @parent_router.setter
    def parent_router(self, parent_router):
        if self._parent_router is None:
            self._parent_router = parent_router
        else:
            raise ImproperlyConfigured('Router %s can be nested only in one place.' % self.__class__.__name__)

    def register(self, prefix, viewset, base_name=None, nested_routers=None, no_list=False):
        """
        Registers viewset to router.

        :param unicode prefix: url prefix for viewset
        :param viewset: viewset to register
        :param unicode base_name: base name for views
        :param tuple nested_routers: tuple of nested routers
        :param bool no_list: set to true, if viewset is only for single item and has no list view
        :rtype: Router
        :return: Router self
        """
        if base_name is None:
            base_name = self.get_default_base_name(viewset)
        if self.name is not None:
            base_name = '%s-%s' % (self.name, base_name)
        if nested_routers is not None:
            for router in nested_routers:
                router.parent_router = self
        self.registry.append(
            Registry(prefix=prefix, viewset=viewset, base_name=base_name,
                     nested_routers=nested_routers, no_list=no_list)
        )

        return self

    def get_urls(self):
        """
        Use the registered viewsets and nested routers to generate list of URL patterns.

        :rtype: list
        :return: list of constructed Django urls.
        """
        ret = []
        nested_route_type = self.nested_route_constructor
        no_list_route_type = self.no_list_route_constructor

        for prefix, viewset, basename, nested_routers, no_list in self.registry:
            lookup = self.get_lookup_regex(viewset)

            if no_list:
                mapping = self.get_method_map(viewset, no_list_route_type.mapping)

                for methodname in dir(viewset):
                    attr = getattr(viewset, methodname)
                    if getattr(attr, 'bind_to_methods', None):
                        raise ImproperlyConfigured('ViewSet %s registered to router with no_list=True '
                                                   'should not have any method decorated with '
                                                   '`@link()` or `@action()`.' % viewset.__name__)

                # Build the url pattern
                regex = no_list_route_type.url.format(
                    prefix=prefix,
                    lookup=lookup,
                    trailing_slash=self.trailing_slash
                )
                view = viewset.as_view(mapping, **no_list_route_type.initkwargs)
                name = no_list_route_type.name.format(basename=basename)
                ret.append(url(regex, view, name=name))

            else:
                routes = self.get_routes(viewset)
                # Viewset routes
                for route in routes:
                    #Only actions which actually exist on the viewset will be bound
                    mapping = self.get_method_map(viewset, route.mapping)

                    if not mapping:
                        continue

                    # Build the url pattern
                    regex = route.url.format(
                        prefix=prefix,
                        lookup=lookup,
                        trailing_slash=self.trailing_slash
                    )
                    view = viewset.as_view(mapping, **route.initkwargs)
                    name = route.name.format(basename=basename)
                    ret.append(url(regex, view, name=name))

            if not nested_routers:
                continue

            # Nested routes
            for nested_router in nested_routers:
                if not isinstance(nested_router, BaseRouter):
                    raise TypeError('Object %s appears not to be Router. '
                                    'Nested router should be subclass of BaseRouter.' % nested_router.__class__.__name__)

                # TODO test this assertion
                assert nested_route_type is not None, \
                    'Nested router %s exist, but nested route type is not specified' % nested_router.__class__.__name__

                regex = nested_route_type.url.format(
                    prefix=prefix,
                    lookup=lookup
                )

                nested_router_urls = []

                for nested_url in nested_router.urls:
                    nested_url.name = nested_route_type.name.format(
                        basename=basename,
                        nested_name=nested_url.name
                    )
                    nested_router_urls.append(nested_url)

                ret.append(url(regex, include(nested_router_urls)))

        return ret


class RootRouter(Router):
    """
    RootRouter, which automatically construct view, that shows contained viewsets.

    :param unicode name: router name
    :param root_view: base root view, will be extended with registered viewsets.
    :param dict root_view_initkwargs: kwargs to be passed to root view.
    """

    def __init__(self, name=None, root_view=None, root_view_initkwargs=None):
        self.root_view = root_view
        self.root_view_initkwargs = root_view_initkwargs or {}
        super(RootRouter, self).__init__(name)

    def get_root_view_class(self):
        """
        Gets root view class, based on root_view specified in init, or APIView,

        :rtype class
        :return: root view class
        """
        root_base = self.root_view or APIView
        root_view_dict = {}
        list_name = self.routes[0].name
        no_list_name = self.no_list_route_constructor.name

        for prefix, viewset, base_name, nested_routers, no_list in self.registry:
            if no_list:
                root_view_dict[prefix] = no_list_name.format(basename=base_name)
            else:
                root_view_dict[prefix] = list_name.format(basename=base_name)

        class RootView(root_base):
            _ignore_model_permissions = True

            def get_data(self, request, format=None):
                ret = {}
                try:
                    ret = super(RootView, self).get_data(request, format)
                except AttributeError:
                    pass
                for key, url_name in root_view_dict.items():
                    ret[key] = rf_reverse.reverse(url_name, request=request, format=format)
                return ret
            
            def get(self, request, format=None):
                try:
                    return super(RootView, self).get(request, format)
                except AttributeError:
                    return Response(self.get_data(request, format))

        return RootView

    def get_root_view(self):
        """
        Transforms root view class to view by calling as_view with initkwargs.

        :return: root view
        """
        return self.get_root_view_class().as_view(**self.root_view_initkwargs)

    def get_urls(self):
        """
        Returns list of urls for registered viewsets, and root view urls.

        :rtype list
        :return: urls
        """
        ret = [
            url(r'^$', self.get_root_view(), name=self.name)
        ]

        ret.extend(super(RootRouter, self).get_urls())

        return ret


class AppRouter(RootRouter):
    """
    Convenience class that simplifies usage of RootRouter as router for single app.
    """

    def __init__(self, app, app_view, app_view_initkwargs=None):
        app_view_initkwargs = app_view_initkwargs or {}
        app_view_initkwargs['app'] = app
        super(AppRouter, self).__init__(app.name, app_view, app_view_initkwargs)


class ApiRootRouter(RootRouter):
    """
    Router as :class:`RootRouter`, but supports registering whole apps.
    Used as api root router.

    :param root_view: root view
    """

    def __init__(self, root_view=None, *args, **kwargs):
        super(ApiRootRouter, self).__init__(*args, root_view=root_view, **kwargs)
        self.apps = None
        self.apps_prefix = None

    def register_apps(self, prefix, viewset, apps, base_name=None):
        """
        Register apps to api root.

        :param prefix: url prefix for accessing apps
        :param viewset: viewset to use as app list
        :param list apps: list of SLAmeter apps
        :param unicode base_name: base name for view
        """
        self.register(prefix=prefix, viewset=viewset, base_name=base_name)
        self.apps_prefix = prefix
        self.apps = apps

    def get_urls(self):
        """
        Gets all urls, including apps viewset url.

        :return url list
        :rtype list
        """
        urls = []
        apps_prefix_regexp = r'^%s/' % self.apps_prefix
        
        urls.extend(super(ApiRootRouter, self).get_urls())
        
        for app in self.apps:
            app_url = url(apps_prefix_regexp, include(app.urls), name=app.name)
            urls.append(app_url)

        return urls
