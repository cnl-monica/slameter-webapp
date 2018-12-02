# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from rest_framework import serializers as rf_serializers

from core.framework import relations
from core.framework.serializers import BaseModuleSerializer, DynamicHyperlinkedModelSerializer, JSONWritableField
from . import ids

from .models import AttackLogs, IdsUser, AttackDetails


class BaseIdsSerializer(BaseModuleSerializer):
    _app_name = 'ids'


# class ACPIdsSerializer(BaseModuleSerializer):
#     _app_name = 'ids'


class IdsUsersSerializer(rf_serializers.HyperlinkedModelSerializer):

    class Meta:
        model = IdsUser
        view_name = 'ids-module.filter_query-detail'

        fields = ('id', 'name', 'module_name', 'user', 'query', 'section_name', 'last')



class AttackLogsSerializer(rf_serializers.HyperlinkedModelSerializer):

    class Meta:
        model = AttackLogs
        view_name = 'ids-attacklogs-detail'

        fields = ('url', 'id',
            'attacktype', 'starttime', 'endtime', 'destip', 'srcip', 'destport',
            'ps_flowcount', 'sf_syncount', 'uf_packetcount', 'rf_rstcount',
            'tf_ttlcount', 'ff_fincount', 'probability'
        )


# class AttackDetailsSerializer(rf_serializers.HyperlinkedModelSerializer):
#
#     class Meta:
#         model = AttackDetails
#         attack = AttackLogsSerializer()
#         view_name = 'ids-attackdetails-detail'
#
#         fields = ('url',
#                 'attack', 'since', 'till', 'probability', 'sf_syncount',
#                 'uf_packetcount', 'rf_rstcount', 'tf_ttlcount','ff_fincount'
#         )


class AttackDetailsSerializer(rf_serializers.HyperlinkedModelSerializer):
    attack_id = rf_serializers.PrimaryKeyRelatedField(source='attack')

    class Meta:
        model = AttackDetails
        #attack = AttackLogsSerializer()
        view_name = 'ids-attackdetails-detail'

        fields = ('url',
                'attack_id', 'since', 'till', 'probability', 'sf_syncount',
                'uf_packetcount', 'rf_rstcount', 'tf_ttlcount','ff_fincount'
        )