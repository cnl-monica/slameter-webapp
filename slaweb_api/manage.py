#!/usr/bin/env python
from __future__ import unicode_literals

import sys
if 'runserver_socketio' in sys.argv:
    print 'Monkey-patching all...'
    from gevent import monkey
    #import psycogreen.gevent
    monkey.patch_all()
    #psycogreen.gevent.patch_psycopg()
import os

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'slaweb_api.settings.dev')

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
