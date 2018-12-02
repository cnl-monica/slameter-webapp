# -*- coding: utf-8 -*-
import os

from gevent.monkey import patch_all
from psycogreen.gevent import patch_psycopg
patch_all()
patch_psycopg()


from socketio.server import SocketIOServer
from socketio.sgunicorn import GeventSocketIOBaseWorker, GunicornWSGIHandler, GunicornWebSocketWSGIHandler


class GeventSocketIOWorker(GeventSocketIOBaseWorker):
    server_class = SocketIOServer
    wsgi_handler = GunicornWSGIHandler
    ws_wsgi_handler = GunicornWebSocketWSGIHandler
    # We need to define a namespace for the server, it would be nice if this
    # was a configuration option, will probably end up how this implemented,
    # for now this is just a proof of concept to make sure this will work
    resource = 'ws'
    policy_server = False
    transports = ["websocket", "xhr-polling", "xhr-multipart"]


_project_path = os.path.realpath(os.path.dirname(__file__))


bind = 'unix:/tmp/slaweb_api.sock'
workers = 1
worker_class = GeventSocketIOWorker
backlog = 1024
chdir = _project_path
pythonpath = _project_path
daemon = True

accesslog = '/var/log/slameter_web/gunicorn_access.log'
errorlog = '/var/log/slameter_web/gunicorn_error.log'
pidfile = '/run/gunicorn.pid'






