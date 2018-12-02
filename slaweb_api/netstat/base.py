# -*- coding: utf-8 -*- 
from __future__ import unicode_literals

from abc import ABCMeta
from django.core.exceptions import ImproperlyConfigured, ValidationError

from core.framework.base import AbstractModule
from .models import FilterQuery
from .connectors import EvaluatorDataConnector
from netstat.exceptions import RequiredFieldMissing
from .serializers import BaseNetstatSerializer


class EvaluatorModule(AbstractModule):
    """
    Base class for modules using Evaluator as their data source

    :param BaseModuleSerializer _serializer_class: serializer class for module
    :param AbstractDataConnector _data_connector_class: data connector class
    :param unicode remote_name: name used for module in Evaluator
    :param unicode evaluator_configuration: name of configuration for Evaluator, to be used on data connector
                                            class instantiation
    :param dict default_query: query to be used, when none is found in DB
    :param tuple _default_filter_processor_classes: default set of filter processors
    :param tuple extra_filter_processor_classes: extra set of filter processors, to be set on module,
                                                 additional to default filter set
    """
    __metaclass__ = ABCMeta
    _serializer_class = BaseNetstatSerializer
    _data_connector_class = EvaluatorDataConnector

    remote_name = None

    evaluator_configuration = 'default'

    default_query = {}

    extra_filter_processor_classes = tuple()
    _default_filter_processor_classes = tuple()

    def __init__(self, user):
        super(EvaluatorModule, self).__init__(user)
        self._query = None

    @property
    def filter_processor_classes(self):
        """
        Combines default and additional filters defined on module class.
        """
        return self._default_filter_processor_classes + self.extra_filter_processor_classes

    @property
    def filter_names(self):
        """
        Returns list of filter names for module.
        """
        return [filter_processor(filter_query={}).name for filter_processor in self.filter_processor_classes]

    def set_query(self, query, section_name):
        """
        :param query: query identifier or query object to set on module.
                      Identifier is looked up from db, object is saved into db.
                      Identifier `last` looks up last used query.
        :param section_name: name of the section this module was in when the data request was made
        """
        section_name = section_name or ''

        if query is not None:
            if isinstance(query, basestring) and query.lower() == 'last':
                try:
                    self._query = FilterQuery.queries.last_for_user_section_and_module(
                        user=self.user,
                        module_name=self.name,
                        section_name=section_name
                    )
                except FilterQuery.DoesNotExist:
                    pass
            elif isinstance(query, int):
                try:
                    self._query = FilterQuery.queries.get(
                        user=self.user,
                        module_name=self.name,
                        id=query
                    )
                except FilterQuery.DoesNotExist:
                    pass
            elif isinstance(query, dict):
                self._query = FilterQuery(module_name=self.name, user=self.user, section_name=section_name,
                                          query=query)
                self._query.save()

        if not self._query:
            self._query = FilterQuery(module_name=self.name, user=self.user, section_name=section_name,
                                      query=self.default_query)
            self._query.save()

        return self._query

    def build_filter(self, query=None):
        """
        Builds filter from query, passing it through filter processors.

        :param query: filter query
        :return: processed filter to be send to Evaluator
        """
        def update_dict(d1, d2):
            d1.update(d2)
            return d1

        if query is None:
            query = self._query.query
        filter_query = reduce(update_dict, [filter(query).data_query for filter in self.filter_processor_classes])

        return filter_query

    def get_data(self, query=None, section_name=None):
        """
        Gets data with Evaluator's data connector.

        :param query: unprocessed filter query
        :param section_name: name of the section this module is in on client side. Used to set/find query.
        :return: retrieved data from Evaluator
        """
        self.set_query(query, section_name)

        data_connector = self.data_connector_class(self.remote_name, config_name=self.evaluator_configuration)

        filter = self.build_filter()
        data = data_connector.get_data(filter)

        response = {
            'used_query': self._query,
            'data': data
        }

        return response


class FilterMeta(dict):
    """
    Subclass of dict for identifying meta info.
    """
    pass


class AbstractFilterProcessor(object):
    """
    Filter processor gets through those filer items, that are present in its template
    and process them with methods specified in meta information of that item.

    For example, take template of the form::

        template = {
            'item1': FilterMeta(map_to='otherItem'),
            'item2': {
                'META': FilterMeta(flatten=True),
                'item3': None,
                'item4': FilterMeta(default='defaultValue')
            }
        }

    Given this query is handled to processor::

        query = {
            'item1': 'value1',
            'item2': {
                'item3': 'value3',
                'item4': None
            },
            'item5': 'value5'
        }

    this will be the output::

        query = {
            'otherItem': 'value1',
            'item3': 'value3',
            'item4': 'defaultValue'
        }

    Each item can specify its processing method that will be run.
    If you want to process `item3` in previous template, you would create method::

        def process_item2_item3(self, item_value, item_name, whole_input):
            # do your custom processing
            return {
                # here put your output item name(s) and value(s)
            }

    :param dict template: specification of items to process and settings by which to process them
    """
    __metaclass__ = ABCMeta

    template = None

    def __init__(self, filter_query, template=None):
        self.name = self.__class__.__name__
        self.filter_query = filter_query or {}
        self.template = template or self.template

    def meta_required(self, input, field_name, meta_value):
        """
        Check if item is present

        :param input: query
        :param field_name: name if the field this method processes
        :param meta_value: value of meta param
        :return: processed item
        """
        if meta_value is True and field_name not in input:
            raise RequiredFieldMissing(field_name)
        return input

    def meta_default(self, input, field_name, meta_value):
        """
        Fills in value, if none is present

        :param input: query
        :param field_name: name if the field this method processes
        :param meta_value: value of meta param
        :return: processed item
        """
        val = input.get(field_name)
        if not val or val == [] or val == {} or val == '':
            input[field_name] = meta_value
        return input

    def meta_map_to(self, input, field_name, meta_value):
        """
        Change item name

        :param input: query
        :param field_name: name if the field this method processes
        :param meta_value: value of meta param
        :return: processed item
        """
        value = input.get(field_name)
        return {
            meta_value: value
        }

    def meta_flatten(self, input, field_name, meta_value):
        """
        Move item one level up in query

        :param input: query
        :param field_name: name if the field this method processes
        :param meta_value: value of meta param
        :return: processed item
        """
        if meta_value is True:
            ret = input.get(field_name)
            if not ret:
                raise ImproperlyConfigured('Field `%s` not found. This may be caused '
                                           'by using `map_to` together with `flatten`.' % field_name)
            return ret
        return input

    def _build_query(self, input, template, parent_name=None, prefix=None):
        """
        Processes filter query with meta settings and custom processing methods.

        :param input: filter input
        :param template: template
        :param parent_name: parent item name (when processing recursively enters nested item)
        :param prefix: prefix for processing methods when in nested item
        :return: processed filter query
        """
        query = {}
        template = template.copy()
        parent_meta = template.pop('META', None)

        for field_name, field_value in template.items():
            input_value = input.get(field_name, None)
            output_value = {
                field_name: input_value
            }

            if not isinstance(field_value, FilterMeta) and isinstance(field_value, dict):
                # Nested field
                if input_value is not None and not isinstance(input_value, dict):
                    raise ValidationError('bad format of input filter')
                output_value = self._build_query(input_value or {}, field_value, field_name, '%s_' % field_name)
            else:
                processing_method_name = 'process_{prefix}{field_name}'.format(
                    prefix=prefix or '',
                    field_name=field_name)

                if isinstance(field_value, FilterMeta):
                    for meta_name, meta_value in field_value.items():
                        if hasattr(self, 'meta_%s' % meta_name):
                            output_value = getattr(self, 'meta_%s' % meta_name)(output_value, field_name, meta_value)

                if hasattr(self, processing_method_name):
                    # Custom field processing
                    output_value = getattr(self, processing_method_name)(output_value, field_name, input)

            query.update(output_value)

        if parent_name:
            query = {
                parent_name: query
            }

        if parent_meta:
            for meta_name, meta_value in parent_meta.items():
                if hasattr(self, 'meta_%s' % meta_name):
                    query = getattr(self, 'meta_%s' % meta_name)(query, parent_name, meta_value)

        return query

    @property
    def data_query(self):
        """
        Publicly accessible interface for retrieving processed form of filter
        :return: processed filter
        :rtype dict
        """
        return self._build_query(self.filter_query, self.template)
