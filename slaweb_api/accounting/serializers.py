# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from rest_framework import serializers as rf_serializers
from accounting.models import AccCriteria
from core.framework.serializers import BaseModuleSerializer, JSONWritableField
from .models import AccUser, BillPlans, BillPlansReports
from django.core.validators import ValidationError
import json


class BaseAccountingSerializer(BaseModuleSerializer):
    _app_name = 'accounting'


class AccUsersSerializer(rf_serializers.HyperlinkedModelSerializer):

    class Meta:
        model = AccUser
        view_name = 'accounting-accuser-detail'

        fields = ('url', 'id', 'email', 'name', 'ip_addresses', 'mac_addresses', 'organization',
                'address_street_name', 'address_street_number', 'address_zip_code',
                'address_city', 'address_country', 'phone', 'mobile', 'ico', 'dic', 'accountNo')


class AccCriteriaSerializer(rf_serializers.HyperlinkedModelSerializer):
    #user = AccUsersSerializer()
    user_id = rf_serializers.PrimaryKeyRelatedField(source='user')

    class Meta:
        model = AccCriteria
        view_name = 'accounting-acccriteria-detail'

        fields = ('url', 'id', 'user_id', 'sourceIpAddresses', 'destinationIpAddresses', 'protocol',
                  'sourcePorts', 'destinationPorts', 'dscp', 'multicast', 'rate_sh', 'rate_wh',
                  'rate_sh_data', 'rate_wh_data', 'priority')


class UserCriteriaSerializer(rf_serializers.HyperlinkedModelSerializer):
    user = AccUsersSerializer()

    class Meta:
        model = AccCriteria
        view_name = 'accounting-acccriteria-detail'

        fields = ('url', 'id', 'user', 'sourceIpAddresses', 'destinationIpAddresses', 'protocol',
                  'sourcePorts', 'destinationPorts', 'dscp', 'multicast', 'rate_sh', 'rate_wh',
                  'priority')


class BillPlansSerializer(rf_serializers.HyperlinkedModelSerializer):

    user_id = rf_serializers.PrimaryKeyRelatedField(source='user')

    class Meta:
        model = BillPlans
        view_name = 'accounting-billplans-detail'

        fields = ('url', 'id', 'user_id', 'name', 'description', 'billing_type',
                  'calculation_type', 'base_amount', 'additional_amount', 'base_tariff',
                  'additional_tariff', 'generation_date', 'period', 'months', 'double_tt_criteria',
                  'hour_from_criteria', 'hour_to_criteria', 'mail_address', 'mail_subject')


class BillDataField(JSONWritableField):

    def to_native(self, value):
        return value

    def validate(self, value):
        if value == {}:
            return
        super(BillDataField, self).validate(value)


class BillPlansReportsSerializer(rf_serializers.HyperlinkedModelSerializer):

    user = AccUsersSerializer()
    plan = BillPlansSerializer()
    evaluated_data = BillDataField()

    class Meta:
        model = BillPlansReports
        view_name = 'accounting-billplansreports-detail'

        fields = ('url', 'id', 'user', 'plan', 'plan_name', 'user_short_desc',
                  'exec_time', 'exec_time_epoch', 'success', 'errmsg', 'evaluated_data')

    # def clean_json(self, obj):
    #     return obj.json