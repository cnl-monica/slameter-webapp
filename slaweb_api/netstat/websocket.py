# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import uuid

from django.http import Http404
import gevent
import redis
import simplejson as json
from rest_framework.authentication import Token

from core.framework.exceptions import WSProcessingException, WSException, ModuleDataConnectionError
from core.framework.permissions import CanAccessApp
from core.framework.websocket import WSAuthenticationMixin, AbstractWSNamespace

from . import netstat
from core.models import User
from .serializers import FilterQuerySerializer


class NetstatWebSocketNamespace(AbstractWSNamespace, WSAuthenticationMixin):
    """
    This class enables client to use websocket for module data retrieval.
    """

    def __init__(self, *args, **kwargs):
        super(NetstatWebSocketNamespace, self).__init__(*args, **kwargs)
        # force FilterQuerySerializer to output query in correct format
        # by setting json as requested media type on `request` object
        # (see method get_module_data, where request is used)
        self.request.accepted_media_type = 'application/json'

    def on_login(self, token):

        login = super(NetstatWebSocketNamespace, self).on_login(token)

        if login[0] == 'OK':
            can_access_app = CanAccessApp()

            if not can_access_app.has_object_permission(self.request, None, netstat):
                raise WSProcessingException('400', 'No permission to access `%s` app' % netstat.name)

        return login

    def get_module(self, module_name):
        """
        Gets module in app with given module_name.

        :param unicode module_name: name of the module
        :return module with given name
        :rtype AbstractModule
        """
        try:
            module_class = netstat.get_module_class_by_name(module_name)
        except Http404 as e:
            raise WSProcessingException('404', e.args[0])

        return module_class(self.request.user)

    def get_module_data(self, module, query, section_name):
        module_data = module.get_data(query, section_name)

        module_data['used_query'] = FilterQuerySerializer(instance=module_data['used_query'],
                                                          many=False, partial=False,
                                                          context={'request': self.request}).data

        return module_data

    def parse_interval(self, interval):
        """
        Parse interval given as string

        :param unicode interval: string representation of interval duration
        :return interval
        :rtype float
        """
        interval = int(interval or 2000)

        if interval < 200:
            interval = 200

        return float(interval)/1000

    def on_load(self, packet):
        """
        Event for one-time data load.

        :param unicode app_name: name of the app
        :param unicode module_name: name of the module
        :param query: query to pass to the module
        :return data of the module
        """
        args = packet.get('args')
        section_name = args[0]
        module_name = args[1]
        query = args[2]

        module = self.get_module(module_name)

        token = uuid.uuid4().hex

        self.spawn(self.job_get_module_data, module, query, section_name, token)

        return [token]

    def job_get_module_data(self, module, query, section_name, token):

        try:
            data = self.get_module_data(module, query, section_name)
        except ModuleDataConnectionError as mce:
            data = mce.message

        self.emit(token, data)

    def save_subscription(self, section_name, module_name, query, interval):
        """
        Event for creating subscription to receive module data repeatedly in certain interval.

        :param unicode section_name: name of the section
        :param unicode module_name: name of the module
        :param query: query to pass to the module
        :param unicode interval: interval in which new data should be sent to client
        :return subscription token identifying this subscription and state if the server-side process
        """
        module = self.get_module(module_name)

        subscription_token = netstat.name + '$' + module.name

        if not subscription_token in self.ns_session:
            self.ns_session[subscription_token] = {
                'section': section_name,
                'module': module,
                'query': query,
                'interval': self.parse_interval(interval),
                'state': 'new',
            }

        return subscription_token

    def on_control(self, subscription_token, command, value=None):
        if subscription_token in self.ns_session:
            if command == 'resume':
                self.ns_session[subscription_token]['state'] = 'running'
            elif command == 'pause':
                self.ns_session[subscription_token]['state'] = 'paused'
            elif command == 'unsubscribe':
                self.ns_session[subscription_token]['state'] = 'unsubscribed'
            elif command == 'interval':
                self.ns_session[subscription_token]['interval'] = self.parse_interval(value)
            else:
                raise WSException('400', 'Bad command')
        else:
            raise WSException('400', 'Bad subscription token')

        return ['OK']

    def recv_disconnect(self):
        """
        Unsubscribe all remaining subscriptions on websocket disconnection.
        """
        for item in self.ns_session:
            subscription = self.ns_session[item]
            if isinstance(subscription, dict) and 'state' in subscription:
                subscription['state'] = 'unsubscribed'

    def job_run_subscription(self, subscription_token):
        subscription = self.ns_session[subscription_token]
        state = subscription['state']

        while state != 'unsubscribed':
            interval = subscription['interval']

            if state == 'paused':
                gevent.sleep(1)
            else:
                module = subscription['module']
                query = subscription['query']
                section_name = subscription['section']

                module_data = self.get_module_data(module, query, section_name)

                self.emit(subscription_token, module_data)

                gevent.sleep(interval)

            subscription = self.ns_session[subscription_token]
            state = subscription['state']

        # after client unsubscribes, delete subscription record from session
        del self.ns_session[subscription_token]


class ACPWebsocketNamespace(AbstractWSNamespace, WSAuthenticationMixin):

    def get_module(self, module_name):
        """
        Gets module in app with given module_name.

        :param unicode module_name: name of the module
        :return module with given name
        :rtype AbstractModule
        """
        try:
            module_class = netstat.get_module_class_by_name(module_name)
        except Http404 as e:
            raise WSProcessingException('404', e.args[0])

        return module_class(self.request.user)

    def on_subscribe(self, module_name):
        """
        Event for creating subscription to receive module data repeatedly in certain interval.

        :param unicode module_name: name of the module
        :param query: query to pass to the module
        :return subscription token identifying this subscription and state if the server-side process
        """
        #module = self.get_module(module_name)

        subscription_token = netstat.name + '$' + module_name

        if not subscription_token in self.ns_session:
            self.ns_session[subscription_token] = {
                'module': module_name,
                'state': 'running',
            }

            self.spawn(self.job_serve_module_data, subscription_token, module_name)

        return [subscription_token, self.ns_session[subscription_token]['state']]

    def on_control(self, subscription_token, command, value=None):
        if subscription_token in self.ns_session:
            if command == 'resume':
                self.ns_session[subscription_token]['state'] = 'running'
            elif command == 'pause':
                self.ns_session[subscription_token]['state'] = 'paused'
            elif command == 'unsubscribe':
                self.ns_session[subscription_token]['state'] = 'unsubscribed'
            else:
                raise WSException('400', 'Bad command')
        else:
            raise WSException('400', 'Bad subscription token')

        return [self.ns_session[subscription_token]['state']]

    def recv_disconnect(self):
        """
        Unsubscribe all remaining subscriptions on websocket disconnection.
        """
        for item in self.ns_session:
            subscription = self.ns_session[item]
            if isinstance(subscription, dict) and 'state' in subscription:
                subscription['state'] = 'unsubscribed'

    def job_serve_module_data(self, subscription_token, module_name):
        subscription = self.ns_session[subscription_token]
        state = subscription['state']
        n = 0
        #print module_name

        r = redis.StrictRedis(host='localhost', port=6379, db=0)
        #TODO nahradit start na filter
        r.publish('ACP',module_name + '.start')

        p = r.pubsub()
        p.subscribe(module_name)

        for message in p.listen():
            if state == 'paused':
                gevent.sleep(1)
            else:
                if message['data'] != 1:
                    if message['data'] != 0:
                        #parsed_data = json.dumps(message['data'])
                        data = json.loads(message['data'])
                        self.emit(subscription_token, [data['time'],data[module_name]])

            subscription = self.ns_session[subscription_token]
            state = subscription['state']

            if state == 'unsubscribed':
                p.unsubscribe(module_name)
                r.publish('ACP', module_name + '.stop')

        # after client unsubscribes, delete subscription record from session
        del self.ns_session[subscription_token]

