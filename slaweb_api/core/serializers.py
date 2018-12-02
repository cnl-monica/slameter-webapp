# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from rest_framework import serializers as rf_serializers
from rest_framework.pagination import PaginationSerializer
from core.models import Exporter

from .models import User, Client


class UserSerializer(rf_serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('url', 'id', 'email', 'is_staff')


class PaginatedUserSerializer(PaginationSerializer):
    class Meta:
        object_serializer_class = UserSerializer


class ExporterSerializer(rf_serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Exporter
        view_name = 'exporter-detail'
        fields = ('title', 'url', 'id', 'exporter_id',)


class ClientSerializer(rf_serializers.HyperlinkedModelSerializer):
    exporter = ExporterSerializer()

    class Meta:
        model = Client
        fields = ('url', 'id', 'email', 'name', 'exporter', 'ip_address')


class PaginatedClientSerializer(PaginationSerializer):
    class Meta:
        object_serializer_class = ClientSerializer
