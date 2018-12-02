# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.test import TestCase
from netstat.base import AbstractFilterProcessor, FilterMeta


class AbstractFilterProcessorTest(TestCase):

    def setUp(self):
        pass

        class FilterProcessor1(AbstractFilterProcessor):
            template = {
                'item1': FilterMeta(map_to='otherItem'),
                'item2': {
                    'META': FilterMeta(flatten=True),
                    'item3': None,
                    'item4': FilterMeta(default='defaultValue')
                }
            }

        query1 = {
            'item1': 'value1',
            'item2': {
                'item3': 'value3',
                'item4': None
            },
            'item5': 'value5'
        }

        self.filter_processor1 = FilterProcessor1(query1)

    def test_meta_processing(self):

        output1 = self.filter_processor1.data_query
        correct_output1 = {
            'otherItem': 'value1',
            'item3': 'value3',
            'item4': 'defaultValue'
        }

        self.assertDictEqual(output1, correct_output1)