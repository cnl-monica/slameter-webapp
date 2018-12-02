# -*- coding: utf-8 -*- 
from __future__ import unicode_literals

from core.framework.base import BaseApp

netstat = BaseApp(name="netstat", title="Network Statistics")

# !! import all python module files that contain netstat modules
# so they can be discovered
import modules
