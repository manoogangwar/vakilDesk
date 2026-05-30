from django.urls import path
from .views import CaseListCreateView, CaseDetailView

urlpatterns = [
    path('', CaseListCreateView.as_view()),
    path('<int:pk>/', CaseDetailView.as_view()),
]
