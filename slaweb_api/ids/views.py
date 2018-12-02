# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from dateutil.tz import tzlocal
from rest_framework.viewsets import ReadOnlyModelViewSet, ModelViewSet
from rest_framework.exceptions import ParseError
from rest_framework.response import Response
from rest_framework import status

from ids.models import AttackLogs, AttackDetails
from . import ids
from core.framework.views import AbstractModuleViewSet, CachedViewSetMixin
from .serializers import BaseIdsSerializer, AttackLogsSerializer, AttackDetailsSerializer
import datetime

class IdsModuleViewSet(AbstractModuleViewSet):
    app = ids
    serializer_class = BaseIdsSerializer

    def get_data(self, module, query, request):
        section_name = request.QUERY_PARAMS.get('section')
        
        if request.method == 'POST':
            if query is not None:
                raise ParseError('You can not define `query` query param in POST request')

            query = request.DATA

        module_data = module.get_data(query, section_name)


        return module_data


class AttackLogsViewSet(CachedViewSetMixin, ModelViewSet):
    queryset = AttackLogs.objects.all()
    serializer_class = AttackLogsSerializer

    # tu odfiltrujeme data, len bude treba konvertovat datum.cas
    def get_queryset(self):
        queryset = AttackLogs.objects.all()
        params = self.request.QUERY_PARAMS
        if 'startTime' in params and 'endTime' in params and 'attacktype' not in params and 'probability' not in params:
            if params['startTime'] is not None and params['endTime'] is not None:
                queryset = queryset.filter(starttime__gte=datetime.datetime.fromtimestamp(float(params['startTime'])/1000.0))
                queryset = queryset.filter(endtime__lte=datetime.datetime.fromtimestamp(float(params['endTime'])/1000.0))
                queryset.order_by('startTime')
                return queryset

        elif 'startTime' in params and 'endTime' in params and 'probability' in params and 'attacktype' not in params:
            queryset = queryset.filter(starttime__gte=datetime.datetime.fromtimestamp(float(params['startTime'])/1000.0))
            queryset = queryset.filter(endtime__lte=datetime.datetime.fromtimestamp(float(params['endTime'])/1000.0))
            queryset = queryset.filter(probability__gte=params['probability'])
            queryset.order_by('starTime')
            return queryset

        elif 'startTime' in params and 'endTime' in params and 'probability' in params and 'attacktype' in params:
            queryset = queryset.filter(starttime__gte=datetime.datetime.fromtimestamp(float(params['startTime'])/1000.0))
            queryset = queryset.filter(endtime__lte=datetime.datetime.fromtimestamp(float(params['endTime'])/1000.0))
            queryset = queryset.filter(attacktype=params['attacktype'])
            queryset = queryset.filter(probability__gte=params['probability'])
            queryset.order_by('startTime')
            return queryset

        elif 'id' in params:
            queryset = queryset.filter(id=params['id'])
            queryset.order_by('id')
            return queryset

        return queryset



    # # tu odfiltrujeme data, len bude treba konvertovat datum.cas
    # def get_queryset(self):
    #     queryset = AttackLogs.objects.all()
    #     params = self.request.QUERY_PARAMS
    #     if 'startTime' in params and  'endTime' in params:
    #         if params['startTime'] is None and params['endTime'] is None: pass
    #             # queryset = queryset.filter(starttime__gte=datetime.datetime.fromtimestamp(float(params['startTime'])/1000.0))
    #             # queryset = queryset.filter(endtime__lte=datetime.datetime.fromtimestamp(float(params['endTime'])/1000.0))
    #             # queryset = queryset.filter(starttime__gte=datetime.datetime.fromtimestamp(tzlocal)
    #         elif params['startTime'] is not None and params['endTime'] is not None:
    #             queryset = queryset.filter(starttime__gte=datetime.datetime.fromtimestamp(float(params['startTime'])/1000.0))
    #             queryset = queryset.filter(endtime__lte=datetime.datetime.fromtimestamp(float(params['endTime'])/1000.0))
    #             # queryset = queryset.filter(starttime__gte=datetime.fromtimestamp(float(params['startTime'])/1000.0))
    #             # queryset = queryset.filter(endtime__lte=datetime.fromtimestamp(float(params['endTime'])/1000.0))
    #     if 'probability' in params and  'type' in params:
    #         queryset = queryset.filter(attacktype=params['type'])
    #         queryset = queryset.filter(probability=params['probability'])
    #     queryset.order_by('starttime')
    #     return queryset


    def list(self, request, *args, **kwargs):
        if self.request.user.is_admin is True:
            return super(AttackLogsViewSet, self).list(request, *args, **kwargs)
        else:
            return Response({
                "detail": "You do not have permission to perform this action."
            }, status=status.HTTP_403_FORBIDDEN)


class AttackDetailsViewSet(CachedViewSetMixin, ModelViewSet):
    queryset = AttackDetails.objects.all()
    serializer_class = AttackDetailsSerializer

    # tu odfiltrujeme data, len bude treba konvertovat datum.cas
    def get_queryset(self):
        queryset = AttackDetails.objects.all()
        params = self.request.QUERY_PARAMS
        if 'attack_id' in params:
            if params['attack_id'] is not None:
                queryset = queryset.filter(attack_id=params['attack_id'])
                queryset.order_by('attack_id')
                return queryset

        return queryset

    def list(self, request, *args, **kwargs):
        if self.request.user.is_admin is True:
            return super(AttackDetailsViewSet, self).list(request, *args, **kwargs)
        else:
            return Response({
                "detail": "You do not have permission to perform this action."
            }, status=status.HTTP_403_FORBIDDEN)