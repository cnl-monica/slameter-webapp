# -*- coding: utf-8 -*-
from django.core.management.commands.runserver import Command as DjangoRunServerCommand


class Command(DjangoRunServerCommand):

    def inner_run(self, *args, **options):
        self.stderr.write('Launching development server without WebSocket support.\n'
                          'For WebSocket support use `runserver_socketio` command.\n\n')

        super(Command, self).inner_run(*args, **options)



