from django.urls import path

from . import views

urlpatterns = [
    path("auth/register", views.auth_register, name="auth_register"),
    path("auth/login", views.auth_login, name="auth_login"),
    path("auth/logout", views.auth_logout, name="auth_logout"),
    path("auth/delete-account", views.auth_delete_account, name="auth_delete_account"),
    path("auth/me", views.auth_me, name="auth_me"),
    path("onboarding/records", views.onboarding_records, name="onboarding_records"),
]
