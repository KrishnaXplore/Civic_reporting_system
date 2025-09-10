# api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ComplaintViewSet, 
    ProofViewSet, 
    UserRegistrationView, 
    ForeignerLoginView,
    MyComplaintsView
)

router = DefaultRouter()
router.register(r'complaints', ComplaintViewSet, basename='complaint')
router.register(r'proofs', ProofViewSet, basename='proof')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('foreigner-login/', ForeignerLoginView.as_view(), name='foreigner-login'),
    path('my-complaints/', MyComplaintsView.as_view(), name='my-complaints'),
]