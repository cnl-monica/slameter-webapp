# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from . import applications
from .serializers import BaseApplicationsSerializer
from core.framework.views import AbstractModuleViewSet
from rest_framework import status
from rest_framework.response import Response
from evaluator.evaluator import *


class ApplicationsModuleViewSet(AbstractModuleViewSet):
    app = applications
    serializer_class = BaseApplicationsSerializer

    def get_data(self, module, query):
        return module.get_data(query)


class BasicModuleView(ApplicationsModuleViewSet):
    allowed_methods = ['POST', 'GET']
    name = 'BasicModule'
    serializer_class = BaseApplicationsSerializer

    def list(self, request):
        acc_user_id = request.GET.get('userId', None)
        module_name = request.GET.get('name', None)
        session_user_id = self.request.user.pk
        if acc_user_id is not None and (self.request.user.is_admin or int(acc_user_id) == session_user_id):
            req = {'userId': acc_user_id, 'name': module_name}
            data = basic_applications_evaluation(req)
            if 'error' in data:
                return Response({'data': data, 'status': 'error'}, status=status.HTTP_200_OK)
            else:
                return Response({'data': data, 'status': 'ok'}, status=status.HTTP_200_OK)
        else:
            response = {"detail": "You do not have permission to perform this action."}
            return Response(response, status=status.HTTP_403_FORBIDDEN)

    def create(self, request):
        data = request.DATA
        if self.request.user.is_admin or data['userId'] == self.request.user.pk:
            celery_response = basic_applications_evaluation(data)
            if 'error' in celery_response:
                return Response({'data': celery_response, 'status': 'error'}, status=status.HTTP_200_OK)
            else:
                return Response({'data': celery_response, 'status': 'ok'}, status=status.HTTP_200_OK)
        else:
            ret = {"detail": "You do not have permission to perform this action."}
            return Response(ret, status=status.HTTP_403_FORBIDDEN)