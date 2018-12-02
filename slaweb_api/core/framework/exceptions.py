# -*- coding: utf-8 -*-
"""
Module contains exceptions used across the apps.
"""

from __future__ import unicode_literals
from urllib2 import URLError

from django.core.exceptions import PermissionDenied
from django.http.response import Http404
from rest_framework import status as _status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler
from rest_framework.response import Response
from simplejson.decoder import JSONDecodeError
from suds.transport import TransportError


class ModuleDataConnectionError(Exception):
    """
    Exception to describe some of the data connection errors.
    """

    def __init__(self, exception):
        reason, status = None, None
        if isinstance(exception, JSONDecodeError):
            reason = 'malformed response'
        elif isinstance(exception, URLError) or isinstance(exception, TransportError):
            reason = 'service unavailable'
            status = _status.HTTP_503_SERVICE_UNAVAILABLE

        if reason:
            self.message = 'Connection to data source failed: %s' % reason
        else:
            self.message = 'Connection to data source failed.'

        if status:
            self.status = status
        else:
            self.status = _status.HTTP_503_SERVICE_UNAVAILABLE

    def __str__(self):
        return self.__class__.__name__ + ':' + self.message


class WSException(Exception):

    def __init__(self, code, message):
        self.code = code
        self.message = message
        super(WSException, self).__init__(message)


class WSProcessingException(WSException):
    pass


def rest_framework_exceptions_handler(exc):
    """
    Exception handler for DRF.
    :param exc: exception
    :return: DRF response describing the exception
    """

    if isinstance(exc, APIException) or isinstance(exc, Http404) or isinstance(exc, PermissionDenied):
        return exception_handler(exc)

    if isinstance(exc, ModuleDataConnectionError):
        return Response({'detail': exc.message}, status=exc.status)