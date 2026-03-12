from __future__ import annotations

import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


@shared_task(
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_jitter=True,
    retry_kwargs={"max_retries": 5},
)
def send_welcome_email(email: str, display_name: str = "") -> bool:
    recipient = (email or "").strip().lower()
    if not recipient:
        raise ValueError("Recipient email is required.")

    name = (display_name or "").strip() or "there"
    subject = "Welcome to Agger Grand"
    message = (
        f"Hi {name},\n\n"
        "Welcome to Agger Grand. Your account is ready and you can start onboarding now.\n\n"
        "If this wasn't you, you can ignore this message.\n"
    )

    sent_count = send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient],
        fail_silently=False,
    )
    if sent_count != 1:
        raise RuntimeError(f"Email delivery was not confirmed for {recipient}.")

    logger.info("Welcome email sent to %s", recipient)
    return True
