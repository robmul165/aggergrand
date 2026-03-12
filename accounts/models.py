from __future__ import annotations

from django.conf import settings
from django.db import models


class OnboardingRecord(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="onboarding_records",
    )
    profile = models.JSONField(default=dict, blank=True)
    inputs = models.JSONField(default=dict, blank=True)
    metrics = models.JSONField(default=dict, blank=True)
    discussion = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"OnboardingRecord<{self.pk}> user={self.user_id}"
