# -*- coding: utf-8 -*- 
from __future__ import unicode_literals

import collections

from django.contrib import admin
from django.db import models
from django.conf import settings
from jsonfield import JSONField


class FilterQueryManager(models.Manager):
    def all_for_user_and_module(self, user, module_name):
        return self.filter(user=user, module_name=module_name)

    def all_global_for_user(self, user):
        """
        This returns all queries that have no module_name
        """
        return self.filter(user=user, module_name='')

    def last_for_user_section_and_module(self, user, module_name, section_name):
        return self.all_for_user_and_module(user, module_name).get(section_name=section_name, last=True)

    def last_for_user_and_section(self, user, section_name):
        return self.all_global_for_user(user).get(section_name=section_name, last=True)


class FilterQuery(models.Model):
    """
    Filter query for netstat module.

    Query has flag `last` that marks last used filter for given user and module.
    Every user-module combination can have only one query without name - this is
    used in automatic query saving. On subsequent queries without name, the one
    created first will be overwritten.
    """

    name = models.CharField(max_length=200, blank=True)
    query = JSONField(blank=True, load_kwargs={'object_pairs_hook': collections.OrderedDict})
    module_name = models.CharField(max_length=200, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL)
    section_name = models.CharField(max_length=100, blank=True)
    last = models.BooleanField(default=False)

    queries = FilterQueryManager()

    class Meta:
        verbose_name_plural = 'Filter queries'

    def save(self, force_insert=False, force_update=False, **kwargs):
        # find similar query
        try:
            similar = FilterQuery.queries.get(
                module_name=self.module_name,
                user=self.user,
                section_name=self.section_name,
                name=self.name
            )
        except FilterQuery.DoesNotExist:
            similar = None

        # if it exist, update it and do not create new record
        if similar:
            self.pk = similar.pk
            if force_insert or force_update:
                force_insert = False
                force_update = True

        # Mark last filter
        if self.name == '':
            FilterQuery.queries.filter(
                last=True,
                module_name=self.module_name,
                section_name=self.section_name,
                user=self.user
            ).exclude(id=self.id).update(last=False)

            self.last = True

        super(FilterQuery, self).save(force_insert=force_insert, force_update=force_update, **kwargs)

    def __unicode__(self):
        return '<FilterQuery %s [%s@%s, %s]>' % (self.name, self.module_name, self.section_name, self.user)


admin.site.register(FilterQuery)
