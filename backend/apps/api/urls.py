"""API URL routing."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from . import views

router = DefaultRouter()
router.register(r"voices", views.VoiceProfileViewSet, basename="voice")
router.register(r"tts", views.TTSJobViewSet, basename="tts")
router.register(r"covers", views.CoverJobViewSet, basename="cover")

urlpatterns = [
    # Health check
    path("health/", views.health_check, name="health-check"),
    
    # Auth
    path("v1/auth/token/", TokenObtainPairView.as_view(), name="token-obtain"),
    path("v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    
    # API routes
    path("v1/", include(router.urls)),
]