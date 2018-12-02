# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from core.framework.base import BaseApp

ids = BaseApp(name="ids", title="Intrusion Detection System")

# !! import all python module files that contain ids modules
# so they can be discovered

import modules