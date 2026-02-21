from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

# -------------------------------
# ✅ 1️⃣ Custom User Model
# -------------------------------
class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('citizen', 'Citizen'),
        ('department', 'Department'),
        ('admin', 'Admin'),
    )

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='citizen')
    phone = models.CharField(max_length=15, blank=True, null=True)

    USERNAME_FIELD = 'email'   # Use email as login field
    REQUIRED_FIELDS = ['username']  # username still exists but is secondary

    def __str__(self):
        return self.email


# -------------------------------
# ✅ 2️⃣ Complaint Model
# -------------------------------
class Complaint(models.Model):
    CATEGORY_CHOICES = [
        ('road-damage', 'Road Damage'),
        ('water-supply', 'Water Supply'),
        ('streetlight', 'Street Light'),
        ('garbage', 'Garbage Collection'),
        ('drainage', 'Drainage'),
        ('other', 'Other'),
    ]

    PRIORITY_CHOICES = [
        ('high', 'High - Urgent attention needed'),
        ('medium', 'Medium - Important but not urgent'),
        ('low', 'Low - Can be addressed later'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in-progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('assigned','Assigned'),
    ]

    citizen = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='complaints')
    department = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,  # If dept is deleted, un-assign complaint
        related_name='assigned_complaints',
        null=True,
        blank=True,
        limit_choices_to={'role': 'department'} # Only allows department users here
    )
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField()
    #image = models.ImageField(upload_to='complaint_images/', blank=True, null=True)
    location = models.CharField(max_length=255)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.citizen.email})"
    
# -------------------------------
# ✅ 3️⃣ Complaint Update Model
# -------------------------------
class ComplaintUpdate(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='updates')
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='updates_made')
    message = models.TextField()
    new_status = models.CharField(max_length=20, choices=Complaint.STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at'] # Show newest updates first

    def __str__(self):
        return f"Update for {self.complaint.title} at {self.created_at}"
    
class Feedback(models.Model):
    # One-to-One link: One complaint can only have one feedback
    complaint = models.OneToOneField(
        Complaint, 
        on_delete=models.CASCADE, 
        related_name='feedback'
    )
    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='feedbacks_given'
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for {self.complaint.title} ({self.rating} stars)"
# backend/myproject/myapp/models.py
# ... (at the end of the file, after the Feedback model)

# -------------------------------
# ✅ 4️⃣ Notification Model
# -------------------------------
class Notification(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    message = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    # Optional: Link to the complaint
    complaint = models.ForeignKey(
        Complaint, 
        on_delete=models.CASCADE, 
        related_name='related_notifications',
        null=True, 
        blank=True
    )

    class Meta:
        ordering = ['-created_at'] # Show newest first

    def __str__(self):
        return f"Notification for {self.recipient.email}: {self.message[:20]}..."
class ComplaintImage(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='complaint_images/')

    def __str__(self):
        return f"Image for complaint {self.complaint.id}"