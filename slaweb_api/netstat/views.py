# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from abc import ABCMeta
from rest_framework.exceptions import ParseError

from rest_framework.viewsets import ModelViewSet

from . import netstat
from core.framework.views import AbstractModuleViewSet
from .models import FilterQuery
from .serializers import BaseNetstatSerializer, FilterQuerySerializer


class NetstatModuleViewSet(AbstractModuleViewSet):
    app = netstat
    serializer_class = BaseNetstatSerializer

    def get_data(self, module, query, request):
        section_name = request.QUERY_PARAMS.get('section')
        
        if request.method == 'POST':
            if query is not None:
                raise ParseError('You can not define `query` query param in POST request')

            query = request.DATA

        module_data = module.get_data(query, section_name)

        module_data['used_query'] = FilterQuerySerializer(instance=module_data['used_query'], many=False, partial=False,
                                                          context=self.get_serializer_context()).data

        return module_data


class AbstractFilterQueryViewSet(ModelViewSet):
    __metaclass__ = ABCMeta

    serializer_class = FilterQuerySerializer
    allowed_methods = ['GET', 'PUT', 'POST', 'DELETE']

    def get_serializer(self, instance=None, data=None,
                       files=None, many=False, partial=False):
        """
        Instantiate dynamic serializer based on request`s action.
        In case of `list` or `retrieve` action we need to take off the `user` and `module_name` fields,
        as those are determined from URL.
        """
        fields = None
        if self.action in ('list', 'retrieve'):
            fields = ('id', 'name', 'query', 'section_name', 'last')

        serializer_class = self.get_serializer_class()
        context = self.get_serializer_context()
        return serializer_class(fields=fields, instance=instance, data=data,
                                files=files, many=many, partial=partial, context=context)

    def filter_queryset(self, queryset):
        pk = getattr(self.kwargs, 'pk', None)
        if pk:
            return queryset.get(pk=self.kwargs['pk'])
        else:
            return queryset

    def fill_out_request(self, request):
        # Serialized filter has user represented by URL
        request.DATA['user'] = request.user.get_url()
        # URL kwarg of `module_name` is `name`
        request.DATA['module_name'] = self.kwargs.get('name') or ''
        if self.action == 'update':
            request.DATA['pk'] = self.kwargs['pk']

    def create(self, request, *args, **kwargs):
        self.fill_out_request(request)
        return super(AbstractFilterQueryViewSet, self).create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self.fill_out_request(request)
        return super(AbstractFilterQueryViewSet, self).update(request, *args, **kwargs)


class ModuleFilterQueryViewSet(AbstractFilterQueryViewSet):

    def get_queryset(self):
        return FilterQuery.queries.all_for_user_and_module(
            self.request.user,
            self.kwargs['name'])


class GlobalFilterQueryViewSet(AbstractFilterQueryViewSet):

    def get_queryset(self):
        return FilterQuery.queries.all_global_for_user(self.request.user)
