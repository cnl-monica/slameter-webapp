# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType

from django.db.models.signals import post_syncdb
from django.contrib.auth.models import Group

from .framework.base import BaseApp
from .models import User


def create_apps_permissions(**kwargs):
    """
    Create app permissions for users.
    """
    content_type = ContentType.objects.get_for_model(User)

    Permission.objects.get_or_create(codename='access_all_apps', name='Can access all apps', content_type=content_type)

    for app in BaseApp.all_apps:
        codename = 'access_%s_app' % app.name
        name = 'Can access %s app' % app.name.capitalize()

        Permission.objects.get_or_create(codename=codename, name=name, content_type=content_type)


def set_clients_permission(**kwargs):

    try:
        clients_group, created = Group.objects.get_or_create(name='Clients')
        if created or clients_group.permissions.count() == 0:
            clients_group.permissions.add(Permission.objects.get(codename='access_all_apps'))
            clients_group.save()
    except (Permission.DoesNotExist,):
        pass


post_syncdb.connect(create_apps_permissions)
post_syncdb.connect(set_clients_permission)
