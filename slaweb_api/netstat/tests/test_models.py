# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.test import TestCase

from core.models import User
from netstat.models import FilterQuery


class FilterTests(TestCase):

    def setUp(self):
        self.user1, c = User.objects.get_or_create(email='test1@test.com',
                                                   password='test')
        self.user2, c = User.objects.get_or_create(email='test2@test.com',
                                                   password='test')

        self.fq1 = FilterQuery.queries.create(name='Filter1',
                                              module_name='Module1',
                                              query={'exporter': 1},
                                              section_name='section1',
                                              user=self.user1)
        self.fq2 = FilterQuery.queries.create(name='Filter1',
                                              module_name='Module1',
                                              query={'exporter': 2},
                                              section_name='section1',
                                              user=self.user1)
        self.fq3 = FilterQuery.queries.create(name='Filter3',
                                              module_name='Module1',
                                              query={'exporter': 1},
                                              section_name='section1',
                                              user=self.user2)
        self.fq4 = FilterQuery.queries.create(name='',
                                              module_name='Module1',
                                              query={'exporter': 1},
                                              section_name='section2',
                                              user=self.user1)
        self.fq5 = FilterQuery.queries.create(name='Filter5',
                                              module_name='Module1',
                                              query={'exporter': 1},
                                              section_name='section2',
                                              user=self.user1)
        self.fq6 = FilterQuery.queries.create(name='Filter6',
                                              module_name='',
                                              query={'exporter': 1},
                                              section_name='section2',
                                              user=self.user1)
        self.fq7 = FilterQuery.queries.create(name='Filter7',
                                              module_name='',
                                              query={'exporter': 1},
                                              section_name='section1',
                                              user=self.user1)
        self.fq8 = FilterQuery.queries.create(name='',
                                              module_name='',
                                              query={'exporter': 1},
                                              section_name='section2',
                                              user=self.user1)

    def test_save(self):
        """
        Test that `last` flag is correctly set on filters
        """

        self.assertEqual(self.fq1.last, False)
        self.assertEqual(self.fq2.last, False)
        self.assertEqual(self.fq1, self.fq2)
        self.assertEqual(self.fq3.last, False)
        self.assertEqual(self.fq4.last, True)
        self.assertEqual(self.fq5.last, False)
        self.assertEqual(self.fq6.last, False)
        self.assertEqual(self.fq7.last, False)
        self.assertEqual(self.fq8.last, True)
