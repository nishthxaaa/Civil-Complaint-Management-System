from django.urls import path
from .views import MyTokenObtainPairView, protected_view
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserRegistrationView, # ✅ 1. Import new view
    ComplaintCreateView, MyComplaintsView, ComplaintDetailView, AllComplaintsView,
    DepartmentComplaintsView, ComplaintUpdateView, ComplaintUpdateLogView,
    DepartmentListView, ChangePasswordView, UserProfileView, FeedbackCreateView,
    NotificationListView, mark_notifications_read
)

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'), # ✅ 2. Add new path
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('protected/', protected_view, name='protected'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('complaints/', ComplaintCreateView.as_view(), name='complaint-create'),
    path('complaints/my/', MyComplaintsView.as_view(), name='my-complaints'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
     path('complaints/<int:pk>/', ComplaintDetailView.as_view(), name='complaint-detail'),
     path('complaints/all/', AllComplaintsView.as_view(), name='all-complaints'),
     path('complaints/department/', DepartmentComplaintsView.as_view(), name='department-complaints'),
     path('complaints/update/<int:pk>/', ComplaintUpdateView.as_view(), name='complaint-update'),
     path('complaints/<int:pk>/updates/', ComplaintUpdateLogView.as_view(), name='complaint-updates'),
     path('complaints/<int:pk>/feedback/', FeedbackCreateView.as_view(), name='complaint-feedback'),
     path('departments/', DepartmentListView.as_view(), name='department-list'),
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/mark-read/', mark_notifications_read, name='notification-mark-read'),
]