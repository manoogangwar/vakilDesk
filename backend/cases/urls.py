from django.urls import path
from .views import (
    CaseListCreateView, CaseDetailView,
    UpcomingHearingsView,
    DocumentListCreateView, DocumentDeleteView,
    HearingRecordListCreateView,
    ClientMyCasesListView, ClientMyCaseDetailView,
    ClientMyCaseHearingsView, ClientMyCaseDocumentsView,
    CaseClientListView, CaseClientUnlinkView,
)

urlpatterns = [
    # Lawyer endpoints
    path('', CaseListCreateView.as_view()),
    path('upcoming/', UpcomingHearingsView.as_view()),
    path('<int:pk>/', CaseDetailView.as_view()),
    path('<int:pk>/documents/', DocumentListCreateView.as_view()),
    path('<int:pk>/documents/<int:doc_pk>/', DocumentDeleteView.as_view()),
    path('<int:pk>/hearings/', HearingRecordListCreateView.as_view()),
    path('<int:pk>/clients/', CaseClientListView.as_view()),
    path('<int:pk>/clients/<int:client_id>/', CaseClientUnlinkView.as_view()),
    # Client (read-only) endpoints
    path('my-cases/', ClientMyCasesListView.as_view()),
    path('my-cases/<int:pk>/', ClientMyCaseDetailView.as_view()),
    path('my-cases/<int:pk>/hearings/', ClientMyCaseHearingsView.as_view()),
    path('my-cases/<int:pk>/documents/', ClientMyCaseDocumentsView.as_view()),
]
