# -*- coding: utf-8 -*-
from datetime import datetime
from optparse import make_option
import os
import socket
import errno
import signal
import sys

from django.conf import settings
from django.core.management.base import CommandError, BaseCommand
from django.utils import translation
import gevent
from gevent.pool import Pool
from socketio.server import SocketIOServer

from .runserver import Command as RunServerCommand

defaults = {
    'GEVENT_POOL_SIZE': 10000
}


class Command(RunServerCommand):
    option_list = BaseCommand.option_list + (
    make_option('--ipv6', '-6', action='store_true', dest='use_ipv6', default=False,
                help='Tells Django to use a IPv6 address.'),
    make_option('--noreload', action='store_false', dest='use_reloader', default=True,
                help='Tells Django to NOT use the auto-reloader.'),
    )
    help = 'Starts gevent\'s WSGI server for development'
    args = '[optional port number or ipaddr:port] [pool size]'

    pool_size = None

    def handle(self, addrport='', pool_size=None, *args, **options):
        self.pool_size = pool_size or getattr(settings, 'GEVENT_POOL_SIZE', defaults['GEVENT_POOL_SIZE'])

        super(Command, self).handle(addrport, *args, **options)

    def inner_run(self, *args, **options):

        quit_command = 'CTRL-BREAK' if sys.platform == 'win32' else 'CONTROL-C'

        if self.pool_size:
            try:
                pool_size = int(self.pool_size)
                pool = Pool(pool_size)
            except ValueError:
                raise CommandError('Spawn pool size must be an integer')
        else:
            pool = None

        self.stdout.write('Validating models...\n\n')
        self.validate(display_num_errors=True)
        self.stdout.write((
            "%(started_at)s\n"
            "Django version %(version)s, using settings %(settings)r\n"
            "Starting development server at http://%(addr)s:%(port)s/\n"
            "Quit the server with %(quit_command)s.\n"
        ) % {
            "started_at": datetime.now().strftime('%B %d, %Y - %X'),
            "version": self.get_version(),
            "settings": settings.SETTINGS_MODULE,
            "addr": '[%s]' % self.addr if self._raw_ipv6 else self.addr,
            "port": self.port,
            "quit_command": quit_command,
        })

        translation.activate(settings.LANGUAGE_CODE)

        try:
            handler = self.get_handler(*args, **options)
            server = SocketIOServer(
                (self.addr, int(self.port)),
                handler,
                spawn=pool,
                resource='ws',
                policy_server=False,
                transports=["websocket", "xhr-polling", "xhr-multipart"])

            def stop():
                if server.started:
                    server.stop()
                    sys.exit(signal.SIGTERM)

            gevent.signal(signal.SIGTERM, stop)

            server.serve_forever()

        except socket.error as e:
            # Use helpful error messages instead of ugly tracebacks.
            ERRORS = {
                errno.EACCES: "You don't have permission to access that port.",
                errno.EADDRINUSE: "That port is already in use.",
                errno.EADDRNOTAVAIL: "That IP address can't be assigned-to.",
            }
            try:
                error_text = ERRORS[e.errno]
            except KeyError:
                error_text = str(e)
            self.stderr.write("Error: %s" % error_text)
            # Need to use an OS exit because sys.exit doesn't work in a thread
            os._exit(1)
        except KeyboardInterrupt:
            sys.exit(0)
