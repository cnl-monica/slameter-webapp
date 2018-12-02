# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from core.framework.serializers import BaseModuleSerializer


class BaseApplicationsSerializer(BaseModuleSerializer):
    _app_name = 'applications'

