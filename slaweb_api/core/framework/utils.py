# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import collections
from copy import deepcopy
from django.core.exceptions import ValidationError
import simplejson
from simplejson.scanner import JSONDecodeError


def load_config(config_file_path, user):
    """
    Gets config from config file for given type of user

    Config file should be of ``json`` format and should contain these 3 sections:

        * common
        * provider
        * client

    Config will be at first read from common section,
    then it will be deep-merged with provider or client section,
    based on ``user.is_staff`` value.

    :param unicode config_file_path: path to the config file
    :param core.User user: user making request
    :return: config dict
    :rtype: OrderedDict
    """
    with open(config_file_path, 'r') as config_file:
        try:
            full_config = simplejson.load(config_file, object_pairs_hook=collections.OrderedDict)
            config = full_config.get('common', {})
            user_config = full_config.get('provider', {}) if user.is_staff else full_config.get('client', {})

            return merge_configs(config, user_config)
        except JSONDecodeError:
            raise ValidationError('Config file %s is not a valid json file' % config_file_path)


def merge_configs(target, *args):
    """
    Performs deep merge of config files.
    Deep-merge is performed on dicts and lists

    :param target: object to deep-merge to
    :param args: object that will update values of target
    :return: deep-merged target
    """
    if len(args) > 1:
        for obj in args:
            merge_configs(target, obj)
        return target

    obj = args[0]
    
    needs_to_merge = lambda o: isinstance(o, dict) or isinstance(o, list)
   
    if isinstance(obj, dict):
        for key, value in obj.iteritems():
            if key in target and needs_to_merge(target[key]):
                merge_configs(target[key], value)
            else:
                target[key] = deepcopy(value)
    elif isinstance(obj, list):
        for index, item in enumerate(obj):
            if index < len(target) and needs_to_merge(target[index]):
                merge_configs(target[index], item)
            elif index < len(target):
                target[index] = item
            else:
                target.append(item)
    else: 
        return obj
    
    return target