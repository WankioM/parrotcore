"""Celery config for ParrotCore."""
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "parrotcore.settings")

app = Celery("parrotcore")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()