# -*- coding: utf-8 -*-
"""
Custom relations for `rest_framework`.
"""
from __future__ import unicode_literals

from django.core.urlresolvers import NoReverseMatch
from rest_framework.relations import HyperlinkedIdentityField
from rest_framework.reverse import reverse


class NestedHyperlinkedIdentityField(HyperlinkedIdentityField):
    """
    `HyperlinkedIdentityField` for nested relations.
    """

    def get_url(self, obj, view_name, request, format):
        """
        Given an object, return the URL that hyperlinks to the object.

        May raise a `NoReverseMatch` if the `view_name` and `lookup_field`
        attributes are not configured to correctly match the URL conf.
        """
        lookup_field = getattr(obj, self.lookup_field, None)
        kwargs = self.context['view'].kwargs.copy()
        kwargs[self.lookup_field] = lookup_field

        # Handle unsaved object case
        if lookup_field is None:
            return None

        try:
            return reverse(view_name, kwargs=kwargs, request=request, format=format)
        except NoReverseMatch:
            pass

        if self.pk_url_kwarg != 'pk':
            # Only try pk lookup if it has been explicitly set.
            # Otherwise, the default `lookup_field = 'pk'` has us covered.
            kwargs = {self.pk_url_kwarg: obj.pk}
            try:
                return reverse(view_name, kwargs=kwargs, request=request, format=format)
            except NoReverseMatch:
                pass

        slug = getattr(obj, self.slug_field, None)
        if slug:
            # Only use slug lookup if a slug field exists on the model
            kwargs = {self.slug_url_kwarg: slug}
            try:
                return reverse(view_name, kwargs=kwargs, request=request, format=format)
            except NoReverseMatch:
                pass

        raise NoReverseMatch()