from django.contrib import admin
from django.conf import settings
from django.http import JsonResponse
from django.urls import include, path, re_path
from django.views.static import serve


def health(_request):
    return JsonResponse({"status": "ok"})


def serve_index(request):
    return serve(request, "index.html", document_root=str(settings.BASE_DIR))


urlpatterns = [
    path("", serve_index),
    path("admin/", admin.site.urls),
    path("health/", health),
    path("api/", include("accounts.urls")),
    # Dev-only static hosting for existing plain HTML/JS/CSS files in repo root.
    re_path(r"^(?P<path>.*)$", serve, {"document_root": str(settings.BASE_DIR)}),
]
