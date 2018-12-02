# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from core.framework.base import BaseApp

applications = BaseApp(name="applications", title="Applications of Clients")


# !! import all python module files that contain accounting modules
# so they can be discovered
