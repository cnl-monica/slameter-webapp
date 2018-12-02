# -*- coding: utf-8 -*-
"""
This module contains classes to be used with `rest_framework`
views and viewsets for permission checks.
"""
from __future__ import unicode_literals

from rest_framework import permissions as rf_permissions


SAFE_METHODS = ('GET', 'OPTIONS', 'HEAD')


class IsAuthenticated(rf_permissions.IsAuthenticated):
    """
    Wrapper class for `rest_framework` class `IsAuthenticaded`.
    """
    pass


class IsStaffUser(rf_permissions.IsAdminUser):
    """
    Wrapper class for `rest_framework` class `IsAdminUser`.
    """
    pass


class IsStaffOrIsSelf(rf_permissions.BasePermission):

    def has_permission(self, request, view):
        return request.user and request.user.is_staff

    def has_object_permission(self, request, view, obj):
        return request.user and (request.user.is_staff or request.user.pk == obj.pk)


class CanAccessApp(rf_permissions.BasePermission):
    """
    Permission class to check for app access permissions.
    """
    def has_object_permission(self, request, view, obj):
        """
        Checks user permission to access give app

        :param request: request to be checked
        :param view: not used
        :param obj: app to check for permission
        :return:
            *true* -- request is allowed, *false* -- request is not allowed
        """
        perm_codename = 'core.access_%s_app' % obj.name
        return request.user.has_perm(perm_codename) or\
            request.user.has_perm('core.access_all_apps') or\
            request.user.is_staff


class UserPermission(rf_permissions.BasePermission):

    def has_permission(self, request, view):
        return request.user and request.user.is_staff

    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True
        elif request.user:
            return view.action == 'update' and request.user.pk == obj.pk
