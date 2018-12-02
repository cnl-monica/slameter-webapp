# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from django import forms
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from core.models import User, Client, Exporter


class UserCreationForm(forms.ModelForm):
    password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
    password2 = forms.CharField(label="Password confirmation", widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ("email",)

    def clean_password2(self):
        data = self.cleaned_data
        password1 = data.get("password1")
        password2 = data.get("password2")
        if password1 and password2 and password1 != password2:
            msg = "Passwords don't match"
            raise forms.ValidationError(msg)
        return password2

    def save(self, commit=True):
        user = super(UserCreationForm, self).save(commit=False)
        data = self.cleaned_data
        user.set_password(data["password1"])
        if commit:
            user.save()
        return user


class UserChangeForm(forms.ModelForm):
    password = ReadOnlyPasswordHashField()

    class Meta:
        model = User

    def clean_password(self):
        return self.initial["password"]


class UserAdmin(DjangoUserAdmin):
    add_form = UserCreationForm
    form = UserChangeForm

    my_fieldsets = {
        "base": (None, {"fields": ("email", "password")}),
        "permissions": ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")})
    }

    list_display = ("email", "is_staff",)
    list_filter = ("is_staff", "is_superuser", "is_active", "groups", )
    search_fields = ("email",)
    ordering = ("email",)
    filter_horizontal = ("groups", "user_permissions",)
    fieldsets = (
        my_fieldsets["base"],
        my_fieldsets["permissions"],
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "password1", "password2")
        }),
    )


class ClientAdmin(UserAdmin):
    client_fields = (None, {"fields": ("email", "name", "password")})
    search_fields = ("name", "ip_address",)
    list_display = ("name", "ip_address")
    fieldsets = (
        client_fields,
        ("Network Settings", {"fields": ("exporter", "ip_address")}),
        UserAdmin.fieldsets[1]
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "name", "password1", "password2"),
        }),
        ("Network settings", {
            "classes": ("wide",),
            "fields": ("ip_address", "exporter")
        })
    )


admin.site.register(User, UserAdmin)
admin.site.register(Client, ClientAdmin)
admin.site.register(Exporter)

