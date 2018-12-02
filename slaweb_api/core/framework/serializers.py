# -*- coding: utf-8 -*-
"""
Serializers for SLAmeter api.
"""
from __future__ import unicode_literals
from django import forms
from django.core.exceptions import ValidationError, ImproperlyConfigured
from django.forms import widgets
from django.utils.datastructures import SortedDict

from rest_framework import (serializers as rf_serializers, reverse as rf_reverse)
from rest_framework.fields import WritableField
from rest_framework.renderers import JSONRenderer
import simplejson as json


class BaseAppSerializer(rf_serializers.Serializer):
    """
    Serializer for SLAmeter web apps.
    """
    name = rf_serializers.CharField(max_length=100)
    title = rf_serializers.CharField(max_length=100)

    def to_native(self, obj):
        """
        Builds serialized representation of app.

        :param obj: app to be serialized
        :rtype: dict
        :return: serialized representation of given app
        """
        return {
            'name': obj.name,
            'title': obj.title,
            'url': rf_reverse.reverse(obj.name, request=self.context.get('request')),
            'config': obj.get_config(user=self.context.get('request').user)
        }


class BaseModuleSerializer(rf_serializers.Serializer):

    @property
    def _app_name(self):
        """
        App name. Must be set on subclass.
        """
        raise ImproperlyConfigured('App name is not specified on module serializer')

    def get_default_fields(self):
        """
        Base serialization for modules
        """
        return SortedDict({
            'name': rf_serializers.CharField(),
            'title': rf_serializers.CharField(max_length=200),
            'url': rf_serializers.HyperlinkedIdentityField(view_name="%s-module-detail" % self._app_name,
                                                           lookup_field="name"),
            'data_url': rf_serializers.HyperlinkedIdentityField(view_name="%s-module-data" % self._app_name,
                                                                lookup_field="name"),
        })


class DynamicHyperlinkedModelSerializer(rf_serializers.HyperlinkedModelSerializer):
    """
    A `HyperlinkedModelSerializer` that takes an additional `fields` argument that
    contains subset of fields defined in class, that should be used by instance.

    Example::

        class MySerializer(DynamicHyperlinkedModelSerializer):
            class Meta:
                fields = ('name', 'email', 'id')

        # ...
        serializer = MySerializer(fields=('name', 'id'))

    Only fields *name* and *id* will be serialized with *serializer*.

    """

    def __init__(self, *args, **kwargs):
        fields = kwargs.pop('fields', None)
        super(DynamicHyperlinkedModelSerializer, self).__init__(*args, **kwargs)

        if fields:
            allowed = set(fields)
            existing = set(self.fields.keys())
            for field_name in existing - allowed:
                self.fields.pop(field_name)


class JSONWritableField(WritableField):
    widget = widgets.Textarea
    form_field_class = forms.CharField

    def from_native(self, value):
        if isinstance(value, dict):
            return value
        try:
            return json.loads(value)
        except (TypeError, json.JSONDecodeError):
            raise ValidationError('Enter valid JSON.')

    def to_native(self, value):
        request = self.context.get('request', None)
        if hasattr(request, 'accepted_media_type') and \
                request.accepted_media_type == 'application/json':
            return value
        return JSONRenderer().render(value)