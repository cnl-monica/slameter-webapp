# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.test import TestCase
from core import User
from netstat.views import ModuleFilterQueryViewSet


class ModuleFilterViewSetTest(TestCase):

    def setUp(self):
        self.user, created = User.objects.get_or_create(email='test@test.com', password='test')

        class Request(object):
            user = self.user
            DATA = {}

        self.request = Request()

    def test_fill_out_request(self):
        view_set = ModuleFilterQueryViewSet()
        view_set.kwargs = {
            'name': 'ModuleName',
            'pk': 1
        }

        correct_data = {
            'user': self.user.get_url(),
            'module_name': 'ModuleName'
        }

        correct_data_update = {
            'user': self.user.get_url(),
            'module_name': 'ModuleName',
            'pk': 1
        }

        view_set.action = 'create'
        view_set.fill_out_request(self.request)
        self.assertDictEqual(self.request.DATA, correct_data)

        view_set.action = 'update'
        view_set.fill_out_request(self.request)
        self.assertDictEqual(self.request.DATA, correct_data_update)
