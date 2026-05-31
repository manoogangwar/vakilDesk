from django.urls import path
from .views import CaseListCreateView, CaseDetailView, CaseClientListView, CaseClientUnlinkView

urlpatterns = [
    path('', CaseListCreateView.as_view()),
    path('<int:pk>/', CaseDetailView.as_view()),
    path('<int:pk>/clients/', CaseClientListView.as_view()),
    path('<int:pk>/clients/<int:client_id>/', CaseClientUnlinkView.as_view()),
]
