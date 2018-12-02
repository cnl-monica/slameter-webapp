# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.core.exceptions import ValidationError


class RequiredFieldMissing(ValidationError):
    def __init__(self, field_name, *args, **kwargs):
        message = 'Required field `%s` is missing from filter.' % (field_name, )
        super(RequiredFieldMissing, self).__init__(message, *args, **kwargs)


class BadFieldInFilter(ValidationError):
    def __init__(self, field_name, *args, **kwargs):
        message = 'Filed %s is not allowed in filter query' % (field_name, )
        super(BadFieldInFilter, self).__init__(message, *args, **kwargs)