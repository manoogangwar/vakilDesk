from django.urls import path
from .views import TemplateListCreateView, TemplateDetailView, TemplateDuplicateView

urlpatterns = [
    path('', TemplateListCreateView.as_view()),
    path('<int:pk>/', TemplateDetailView.as_view()),
    path('<int:pk>/duplicate/', TemplateDuplicateView.as_view()),
]
