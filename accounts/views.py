from __future__ import annotations

import json
import logging
from typing import Any

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.http import HttpRequest, HttpResponseNotAllowed, JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import OnboardingRecord
from .tasks import send_welcome_email

User = get_user_model()
logger = logging.getLogger(__name__)


def parse_json_body(request: HttpRequest) -> dict[str, Any]:
    if not request.body:
        return {}
    try:
        parsed = json.loads(request.body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError("Invalid JSON payload.") from exc
    if not isinstance(parsed, dict):
        raise ValueError("JSON payload must be an object.")
    return parsed


def normalize_email(value: Any) -> str:
    return str(value or "").strip().lower()


def user_to_payload(user: User) -> dict[str, Any]:
    return {
        "id": str(user.pk),
        "email": user.email or user.username,
        "displayName": (user.first_name or "").strip(),
        "createdAt": user.date_joined.isoformat() if user.date_joined else None,
        "lastLoginAt": user.last_login.isoformat() if user.last_login else None,
    }


def onboarding_record_to_payload(record: OnboardingRecord) -> dict[str, Any]:
    return {
        "id": str(record.pk),
        "userId": str(record.user_id),
        "createdAt": record.created_at.isoformat() if record.created_at else None,
        "updatedAt": record.updated_at.isoformat() if record.updated_at else None,
        "profile": record.profile or {},
        "inputs": record.inputs or {},
        "metrics": record.metrics or {},
        "discussion": record.discussion or "",
    }


@csrf_exempt
def auth_register(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        payload = parse_json_body(request)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    email = normalize_email(payload.get("email"))
    password = str(payload.get("password") or "")
    display_name = str(payload.get("displayName") or "").strip()

    if not email or "@" not in email:
        return JsonResponse({"error": "Please provide a valid email address."}, status=400)
    if len(password.strip()) < 8:
        return JsonResponse({"error": "Password must be at least 8 characters."}, status=400)
    if User.objects.filter(username=email).exists():
        return JsonResponse({"error": "An account with this email already exists."}, status=409)

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=display_name,
    )
    login(request, user)

    # Keep registration fast, but fall back to direct send for local testing.
    try:
        send_welcome_email.delay(email, display_name)
    except Exception as exc:
        logger.warning("Failed to enqueue welcome email (%s). Falling back to direct send.", exc)
        try:
            send_welcome_email(email, display_name)
        except Exception:
            logger.exception("Direct email send failed.")

    return JsonResponse({"user": user_to_payload(user)}, status=201)


@csrf_exempt
def auth_login(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        payload = parse_json_body(request)
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    email = normalize_email(payload.get("email"))
    password = str(payload.get("password") or "")
    user = authenticate(request, username=email, password=password)
    if user is None:
        return JsonResponse({"error": "Email and password do not match."}, status=401)

    login(request, user)
    return JsonResponse({"user": user_to_payload(user)})


@csrf_exempt
def auth_logout(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    logout(request)
    return JsonResponse({"ok": True})


@csrf_exempt
def auth_delete_account(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if not settings.DEV_ACCOUNT_DELETE_ENABLED:
        return JsonResponse({"error": "Account deletion is disabled in this environment."}, status=403)
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required."}, status=401)

    user = request.user
    deleted_email = user.email or user.username
    logout(request)
    user.delete()
    return JsonResponse({"ok": True, "deletedEmail": deleted_email})


def auth_me(request: HttpRequest) -> JsonResponse:
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    if not request.user.is_authenticated:
        return JsonResponse({"user": None})
    return JsonResponse({"user": user_to_payload(request.user)})


@csrf_exempt
def onboarding_records(request: HttpRequest) -> JsonResponse:
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required."}, status=401)

    if request.method == "GET":
        records = OnboardingRecord.objects.filter(user=request.user).order_by("-created_at")
        return JsonResponse({"records": [onboarding_record_to_payload(record) for record in records]})

    if request.method == "POST":
        try:
            payload = parse_json_body(request)
        except ValueError as exc:
            return JsonResponse({"error": str(exc)}, status=400)

        profile = payload.get("profile") if isinstance(payload.get("profile"), dict) else {}
        inputs = payload.get("inputs") if isinstance(payload.get("inputs"), dict) else {}
        metrics = payload.get("metrics") if isinstance(payload.get("metrics"), dict) else {}
        discussion = str(payload.get("discussion") or "")

        record = OnboardingRecord.objects.create(
            user=request.user,
            profile=profile,
            inputs=inputs,
            metrics=metrics,
            discussion=discussion,
        )
        return JsonResponse({"record": onboarding_record_to_payload(record)}, status=201)

    return HttpResponseNotAllowed(["GET", "POST"])
