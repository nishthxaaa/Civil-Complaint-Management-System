# myapp/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from rest_framework import serializers
# ✅ 1. Import Notification model
from .models import CustomUser, Complaint,ComplaintUpdate,Feedback, Notification,ComplaintImage
from django.contrib.auth import authenticate

User = get_user_model()

# --- NEW REGISTRATION SERIALIZER ---
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password2 = serializers.CharField(write_only=True, required=True, label="Confirm Password")
    username = serializers.CharField(required=True, label="Full Name") # Map username to Full Name

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')
        extra_kwargs = {
            'email': {'required': True},
        }

    def validate_email(self, value):
        # Check if email is already in use
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, attrs):
        # Check if passwords match
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        # Create the new user
        user = User.objects.create_user(
            username=validated_data['username'], # This is the "Full Name"
            email=validated_data['email'],
            password=validated_data['password'],
            role='citizen'  # Default role for all new signups
        )
        return user


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    # (This class is fine, leave as-is)
    username_field = 'email'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = getattr(user, 'role', None)
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'role': getattr(self.user, 'role', None),
        }
        return data

# --- THIS IS THE SECTION TO REPLACE ---
class ComplaintImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintImage
        fields = ['id', 'image']
class FeedbackReadOnlySerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'rating', 'comment', 'created_at']

class DepartmentUserSerializer(serializers.ModelSerializer):
    """
    Serializer for listing department users (id and email only)
    """
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username']

# ✅ --- 2. ADD THE MISSING NOTIFICATION SERIALIZER ---
class NotificationSerializer(serializers.ModelSerializer):
    complaint_id = serializers.PrimaryKeyRelatedField(
        source='complaint', 
        read_only=True
    )

    class Meta:
        model = Notification
        fields = ['id', 'message', 'read', 'created_at', 'complaint_id']
# --- END NEW SERIALIZER ---


# 1. Main Serializer (Used for GET requests - Listing/Retrieving)
class ComplaintSerializer(serializers.ModelSerializer):
    citizen_name = serializers.CharField(source='citizen.username', read_only=True)
    citizen_email = serializers.EmailField(source='citizen.email', read_only=True)
    department_name = serializers.CharField(source='department.email', read_only=True, allow_null=True)
    feedback = FeedbackReadOnlySerializer(read_only=True, allow_null=True)

    class Meta:
        model = Complaint
        fields = [
            'id', 'title', 'category', 'description',
            'location', 'priority', 'status',
            'citizen_name', 'citizen_email',
            'created_at', 'updated_at',
            'department', # <-- Make sure this is here
            'department_name',
            'feedback',
            'images'

        ]
        # We REMOVE 'status' from read_only_fields here
        read_only_fields = [
            'id', 'citizen_name', 'citizen_email', 
            'created_at', 'updated_at', 'citizen', 'department','department_name','feedback'
        ]

# 2. NEW Serializer (Used for POST requests - Creating)
class ComplaintCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = [
            'title', 'category', 'description', 
             'location', 'priority'
        ]
        # 'status' and 'citizen' are handled automatically by the model and view

# 3. NEW Serializer (Used for PATCH requests - Updating)
class ComplaintUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ['status', 'priority', 'department'] # Only these fields can be updated

# 4. NEW Serializer (For creating and listing updates)
class ComplaintUpdateLogSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username') # For frontend display

    class Meta:
        model = ComplaintUpdate
        fields = ['id', 'user_name', 'message', 'new_status', 'created_at']
        read_only_fields = ['user', 'new_status'] # We will set these from the view
class ChangePasswordSerializer(serializers.Serializer):
    currentPassword = serializers.CharField(write_only=True, required=True)
    newPassword = serializers.CharField(write_only=True, required=True, min_length=8)

    def validate_currentPassword(self, value):
        user = self.context['request'].user
        if not authenticate(username=user.email, password=value):
            raise serializers.ValidationError('Current password is not correct.')
        return value

    def update(self, instance, validated_data):
        # set_password hashes the password
        instance.set_password(validated_data['newPassword'])
        instance.save()
        return instance
class UserProfileSerializer(serializers.ModelSerializer):
    # Map 'name' from frontend to 'username' in Django model
    name = serializers.CharField(source='username') 

    class Meta:
        model = CustomUser
        # 'phone' is ignored by the serializer as it's not in your CustomUser model
        fields = ('name', 'email')
class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'complaint', 'citizen', 'rating', 'comment', 'created_at']
        # We only need to write 'rating' and 'comment'.
        # The view will handle 'citizen' and 'complaint'.
        read_only_fields = ['id', 'complaint', 'citizen', 'created_at']