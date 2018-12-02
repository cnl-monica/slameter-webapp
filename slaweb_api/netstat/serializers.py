# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from rest_framework import serializers as rf_serializers

from core.framework import relations
from core.framework.serializers import BaseModuleSerializer, DynamicHyperlinkedModelSerializer, JSONWritableField
from .models import FilterQuery
from . import netstat


class BaseNetstatSerializer(BaseModuleSerializer):
    _app_name = 'netstat'

    filter_queries = rf_serializers.HyperlinkedIdentityField(
        view_name="netstat-module.filter_query-list",
        lookup_field="name")


class ACPNetstatSerializer(BaseModuleSerializer):
    _app_name = 'netstat'


class FilterQueryField(JSONWritableField):
    def from_native(self, value):
        filter_query = super(FilterQueryField, self).from_native(value)

        # Try to construct data_request of module
        # If this passes and returns value, filter is correct
        # Otherwise filter construction will rise ValidationError
        module_name = self.context.get('view').kwargs.get('name')
        if module_name:
            module = netstat.get_module_class_by_name(module_name)(self.context.get('request').user)
            assert module.build_filter(filter_query) is not None

        return filter_query

    def validate(self, value):
        if value == {}:
            return
        super(FilterQueryField, self).validate(value)


class FilterQuerySerializer(DynamicHyperlinkedModelSerializer):
    #url = relations.NestedHyperlinkedIdentityField(view_name='netstat-module.filter_query-detail')
    query = FilterQueryField()

    class Meta:
        model = FilterQuery
        view_name = 'netstat-module.filter_query-detail'
        fields = ('id', 'name', 'module_name', 'user', 'query', 'section_name', 'last')
