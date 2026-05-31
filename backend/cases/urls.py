from django.urls import path
from .views import (
    CaseListCreateView, CaseDetailView,
    UpcomingHearingsView,
    DocumentListCreateView, DocumentDeleteView,
    HearingRecordListCreateView,
    CaseClientListView, CaseClientUnlinkView,
)

urlpatterns = [
    path('', CaseListCreateView.as_view()),
    path('upcoming/', UpcomingHearingsView.as_view()),
    path('<int:pk>/', CaseDetailView.as_view()),
    path('<int:pk>/documents/', DocumentListCreateView.as_view()),
    path('<int:pk>/documents/<int:doc_pk>/', DocumentDeleteView.as_view(pk_url_kwarg='doc_pk')),
    path('<int:pk>/hearings/', HearingRecordListCreateView.as_view()),
    path('<int:pk>/clients/', CaseClientListView.as_view()),
    path('<int:pk>/clients/<int:client_id>/', CaseClientUnlinkView.as_view()),
]
