# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from rest_framework import status
from rest_framework.decorators import action

import socketio
from django.http import HttpResponse
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.viewsets import ViewSet, ReadOnlyModelViewSet, ModelViewSet
from core.framework.permissions import IsStaffOrIsSelf
from core.models import Exporter
from core.serializers import ExporterSerializer

from .framework.base import BaseApp
from .framework.views import CachedViewSetMixin, ConfigViewSet
from .framework.permissions import UserPermission, IsStaffUser, CanAccessApp

from .models import User, Client
from .serializers import (UserSerializer, ClientSerializer)

from netstat.websocket import ACPWebsocketNamespace
from netstat.websocket import NetstatWebSocketNamespace

#from ids.websocket import IdsWebsocketNamespace
from ids.websocket import IDSWebsocketNamespace


class AppViewSet(ViewSet):
    """
    Lists all apps by their router`s root_view.
    This implements only ``list`` method - for direct access to app is used it`s app router.
    """
    permission_classes = (IsAuthenticated, CanAccessApp, )

    def get_view_name(self):
        return "SLAmeter App List"

    def get_queryset(self):
        """
        Returns only those apps, that current user has access to.
        """
        queryset = []
        for app in BaseApp.all_apps:
            for permission in self.get_permissions():
                if not permission.has_object_permission(self.request, self, app):
                    break
            else:
                queryset.append(app)
        return queryset

    def list(self, request, format=None):
        queryset = self.get_queryset()
        data = []
        for app in queryset:
            try:
                # serialize app with it's router
                router = app.router
                root_view = router.get_root_view_class()(**router.root_view_initkwargs)
                data.append(root_view.get_data(request, format))
            except AttributeError:
                # if it fails (router was not found or router does not have root view), use app serializer instead
                serializer = app.app_serializer_class(app, context={'request': request, 'format': format})
                data.append(serializer.data)

        return Response(data)


class UserViewSet(CachedViewSetMixin, ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    #pagination_serializer_class = PaginatedUserSerializer
    #paginate_by = 100
    permission_classes = (UserPermission, )

    @action(permission_classes=[IsStaffOrIsSelf])
    def set_password(self, request, pk=None):
        user = User.objects.get(pk=pk)

        try:
            old_password = request.DATA['old_password']
            password = request.DATA['new_password']

            if not password or not old_password:
                raise KeyError
        except KeyError:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        if user.check_password(old_password):
            user.set_password(password)
            user.save()
            return Response('OK')
        else:
            return Response(status=status.HTTP_403_FORBIDDEN)


class ClientViewSet(CachedViewSetMixin, ReadOnlyModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    #pagination_serializer_class = PaginatedClientSerializer
    #paginate_by = 100
    permission_classes = (IsStaffUser, )


class ExporterViewSet(ReadOnlyModelViewSet):
    queryset = Exporter.objects.all()
    serializer_class = ExporterSerializer
    permission_classes = (IsStaffUser, )


class MeViewSet(CachedViewSetMixin, ReadOnlyModelViewSet):
    """
    Info on user making request.
    """

    def get_view_name(self):
        return 'Me'

    def get_serializer(self, instance=None, **kwargs):
        if isinstance(instance, Client):
            serializer_class = ClientSerializer
        else:
            serializer_class = UserSerializer
        context = self.get_serializer_context()
        return serializer_class(instance, many=False, context=context, **kwargs)

    def get_object(self, queryset=None):
        user = self.request.user
        if user.is_client:
            return user.to_client()
        else:
            return user


class CoreConfigViewSet(ConfigViewSet):
    permission_classes = (AllowAny, )
    config_file_name = 'core.json'


@csrf_exempt
def socket_io(request):
    socketio.socketio_manage(request.environ, {
        '/netstat': NetstatWebSocketNamespace,
        '/acp': ACPWebsocketNamespace,
        '/ids': IDSWebsocketNamespace,
    }, request=request)

    return HttpResponse()
