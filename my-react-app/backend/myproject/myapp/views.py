from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from .serializers import (
    MyTokenObtainPairSerializer, ComplaintSerializer, 
    ComplaintCreateSerializer, ComplaintUpdateSerializer,ComplaintUpdateLogSerializer,
    DepartmentUserSerializer,ChangePasswordSerializer,UserProfileSerializer,FeedbackSerializer,
    NotificationSerializer,
    UserRegistrationSerializer # ✅ 1. Import new serializer
)
from .models import CustomUser, Complaint, ComplaintUpdate, Feedback, Notification,ComplaintImage


User = get_user_model()


# ✅ --- NEW REGISTRATION VIEW ---
class UserRegistrationView(generics.CreateAPIView):
    """
    API endpoint for new users to register.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny] # Anyone can register
# --- END NEW VIEW ---


# -------------------------------
# ✅ 1️⃣ LOGIN VIEW (JWT Token)
# -------------------------------
class MyTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT login view — uses email instead of username.
    Returns access/refresh tokens + user info (id, email, username, role)
    """
    serializer_class = MyTokenObtainPairSerializer


# -------------------------------
# ✅ 2️⃣ PROTECTED TEST VIEW
# -------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def protected_view(request):
    """
    Simple test endpoint to verify JWT authentication.
    """
    user = request.user
    return Response({
        "message": f"Welcome, {user.username}!",
        "email": user.email,
        "role": user.role
    }, status=status.HTTP_200_OK)


# -------------------------------
# ✅ 3️⃣ CREATE COMPLAINT VIEW
# -------------------------------
class ComplaintCreateView(generics.CreateAPIView):
    """
    API endpoint for citizens to submit new complaints.
    Automatically assigns the logged-in user as the 'citizen'.
    """
    queryset = Complaint.objects.all()
    serializer_class = ComplaintCreateSerializer # Used for input validation
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    # ✅ --- THIS IS THE FIX ---
    # Override the default 'create' method to handle files manually
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # 1. Manually create the Complaint object from validated data
        complaint = Complaint.objects.create(
            citizen=request.user,
            title=serializer.validated_data.get('title'),
            category=serializer.validated_data.get('category'),
            description=serializer.validated_data.get('description'),
            location=serializer.validated_data.get('location'),
            priority=serializer.validated_data.get('priority'),
            status='pending'  # Set default status
        )

        # 2. Handle the file upload from request.FILES
        images_data = request.FILES.getlist('images')
        for image_data in images_data:
            ComplaintImage.objects.create(complaint=complaint, image=image_data)

        # 3. Handle notifications
        admin_users = User.objects.filter(role='admin')
        notification_message = f"New complaint submitted: '{complaint.title[:30]}...'"
        for admin in admin_users:
            Notification.objects.create(
                recipient=admin,
                message=notification_message,
                complaint=complaint
            )

        # 4. Return a success response
        # We serialize the created complaint with the *full* serializer to send it back
        response_serializer = ComplaintSerializer(complaint)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

# -------------------------------
# ✅ 4️⃣ MY COMPLAINTS VIEW
# -------------------------------
class MyComplaintsView(generics.ListAPIView):
    """
    API endpoint for a citizen to view all their submitted complaints.
    """
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Complaint.objects.filter(citizen=self.request.user).order_by('-created_at')
    
class ComplaintDetailView(generics.RetrieveAPIView):
    """
    API endpoint to get a single complaint by its ID.
    Only the complaint owner or an admin can view it.
    """
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_staff:
            return Complaint.objects.filter(citizen=user)
        return Complaint.objects.all()

# -------------------------------
# ✅ 5️⃣ ADMIN ALL COMPLAINTS VIEW
# -------------------------------
class AllComplaintsView(generics.ListAPIView):
    """
    API endpoint for admins to view ALL complaints in the system.
    """
    queryset = Complaint.objects.all().order_by('-created_at')
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

# -------------------------------
# ✅ 6️⃣ DEPARTMENT COMPLAINTS VIEW
# -------------------------------
class DepartmentComplaintsView(generics.ListAPIView):
    """
    API endpoint for department users to view complaints assigned to them.
    """
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Complaint.objects.filter(department=self.request.user).order_by('-created_at')
    
# -------------------------------
# ✅ 7️⃣ UPDATE COMPLAINT VIEW
# -------------------------------
class ComplaintUpdateView(generics.UpdateAPIView):
    """
    API endpoint for admins or departments to update a complaint's status or assignment.
    """
    queryset = Complaint.objects.all()
    serializer_class = ComplaintUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    http_method_names = ['patch']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Complaint.objects.all() 
        if user.role == 'department':
            return Complaint.objects.filter(department=user) 
        return Complaint.objects.none() 

    def update(self, request, *args, **kwargs):
        complaint = self.get_object()
        old_status = complaint.status
        old_department_id = complaint.department_id

        new_status = request.data.get('status')
        new_department_id = request.data.get('department')
        
        response = super().update(request, *args, **kwargs)
        
        # --- Check for STATUS change ---
        if new_status and new_status != old_status:
            
            # --- MODIFIED BLOCK: Notify Citizen (different message if resolved) ---
            citizen_message = ""
            if new_status == 'resolved':
                citizen_message = f"Your complaint '{complaint.title}' is resolved! Please provide your feedback."
            else:
                citizen_message = f"Your complaint '{complaint.title}' is now '{new_status}'."

            if complaint.citizen:
                Notification.objects.create(
                    recipient=complaint.citizen,
                    message=citizen_message,
                    complaint=complaint
                )
            # --- End of modified block ---
            
            # Notify Admins
            admin_message = f"Complaint #{complaint.id} ('{complaint.title}') is now '{new_status}'."
            admin_users = User.objects.filter(role='admin')
            for admin in admin_users:
                if admin != request.user:
                    Notification.objects.create(
                        recipient=admin,
                        message=admin_message,
                        complaint=complaint
                    )

        # --- TRIGGER 2: Check for DEPARTMENT assignment change ---
        if new_department_id and new_department_id != old_department_id:
            try:
                department_user = User.objects.get(id=new_department_id, role='department')
                dept_message = f"You have been assigned a new complaint: '{complaint.title}'."
                Notification.objects.create(
                    recipient=department_user,
                    message=dept_message,
                    complaint=complaint
                )
            except User.DoesNotExist:
                pass 

        return response

# -------------------------------
# ✅ 9️⃣ COMPLAINT UPDATE LOG VIEW
# -------------------------------
class ComplaintUpdateLogView(generics.ListCreateAPIView):
    """
    API endpoint to list all updates for a complaint, or create a new update.
    """
    queryset = ComplaintUpdate.objects.all()
    serializer_class = ComplaintUpdateLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ComplaintUpdate.objects.filter(complaint_id=self.kwargs['pk'])

    def perform_create(self, serializer):
        complaint = Complaint.objects.get(id=self.kwargs['pk'])
        new_status = self.request.data.get('new_status')
        message = self.request.data.get('message')

        serializer.save(
            user=self.request.user,
            complaint=complaint,
            new_status=new_status
        )

        # --- TRIGGER 3b: Notify Citizen & Admins of new MESSAGE ---
        if message: # Only notify if there is a message
            # 1. Notify Citizen
            if complaint.citizen and complaint.citizen != self.request.user:
                notification_message = f"New update on '{complaint.title}': {message[:40]}..."
                Notification.objects.create(
                    recipient=complaint.citizen,
                    message=notification_message,
                    complaint=complaint
                )

            # 2. Notify Admins
            admin_users = User.objects.filter(role='admin')
            admin_message = f"New message on complaint #{complaint.id}: {message[:40]}..."
            for admin in admin_users:
                if admin != self.request.user: 
                    Notification.objects.create(
                        recipient=admin,
                        message=admin_message,
                        complaint=complaint
                    )
        # --- End of new block ---

# -------------------------------
# ✅ 5️⃣ LIST DEPARTMENT USERS
# -------------------------------
class DepartmentListView(generics.ListAPIView):
    """
    API endpoint to list all users with the 'department' role.
    """
    serializer_class = DepartmentUserSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get_queryset(self):
        return CustomUser.objects.filter(role='department')
    
class ChangePasswordView(generics.UpdateAPIView):
    """
    API endpoint for a user to change their own password.
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.UpdateAPIView):
    """
    API endpoint for a user to update their own profile (name/email).
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True) 

        if serializer.is_valid():
            serializer.save()
            response_data = {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'role': user.role,
            }
            return Response(response_data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FeedbackCreateView(generics.CreateAPIView):
    """
    API endpoint for a citizen to submit feedback for a *resolved* complaint.
    """
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            complaint = Complaint.objects.get(id=self.kwargs['pk'])
            
            if complaint.citizen != self.request.user:
                raise permissions.PermissionDenied("You are not the owner of this complaint.")
            
            if complaint.status != 'resolved':
                raise serializers.ValidationError("Feedback can only be submitted for resolved complaints.")
            
            if hasattr(complaint, 'feedback'):
                raise serializers.ValidationError("Feedback has already been submitted for this complaint.")

            return super().create(request, *args, **kwargs)

        except permissions.PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except serializers.ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except Complaint.DoesNotExist:
            return Response({"detail": "Complaint not found."}, status=status.HTTP_404_NOT_FOUND)


    def perform_create(self, serializer):
        complaint = Complaint.objects.get(id=self.kwargs['pk'])
        
        # Save the feedback and get the instance
        feedback = serializer.save(citizen=self.request.user, complaint=complaint)

        # --- ✅ NEW TRIGGER: Notify all admins of new feedback ---
        admin_users = User.objects.filter(role='admin')
        notification_message = f"New feedback (rating: {feedback.rating} stars) received for '{complaint.title[:30]}...'"
        for admin in admin_users:
            Notification.objects.create(
                recipient=admin,
                message=notification_message,
                complaint=complaint
            )
        # --- End of new block ---

# -------------------------------
# ✅ 10️⃣ NOTIFICATION LIST VIEW
# -------------------------------
class NotificationListView(generics.ListAPIView):
    """
    API endpoint to get all notifications for the logged-in user.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

# -------------------------------
# ✅ 11️⃣ MARK NOTIFICATIONS AS READ VIEW
# -------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notifications_read(request):
    """
    API endpoint to mark all unread notifications as read.
    """
    try:
        Notification.objects.filter(recipient=request.user, read=False).update(read=True)
        return Response({"message": "All notifications marked as read."}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)