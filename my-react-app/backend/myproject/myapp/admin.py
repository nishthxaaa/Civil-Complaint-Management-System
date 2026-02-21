from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Complaint,ComplaintUpdate,Notification,ComplaintImage


# --------------------------------------
# 1️⃣ CUSTOM USER ADMIN
# --------------------------------------
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('email', 'username', 'role', 'is_active', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('username',)}),
        ('Roles & Permissions', {'fields': ('role', 'is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'role', 'password1', 'password2', 'is_staff', 'is_active')
        }),
    )

    search_fields = ('email', 'username')
    ordering = ('email',)

class ComplaintImageInline(admin.TabularInline):
    model = ComplaintImage
    extra = 1  # How many empty "add" slots to show
    fields = ('image',) # Only show the image field
# --------------------------------------
# 2️⃣ COMPLAINT ADMIN
# --------------------------------------
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'citizen', 'category', 'priority', 'status', 'created_at')
    list_filter = ('status', 'category', 'priority')
    search_fields = ('title', 'citizen__email', 'location')
    ordering = ('-created_at',)
    inlines = [ComplaintImageInline]

class ComplaintUpdateAdmin(admin.ModelAdmin):
    list_display = ('complaint', 'user', 'new_status', 'created_at')
    list_filter = ('new_status',)
    search_fields = ('complaint__title', 'user__email')

class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'message', 'read', 'created_at')
    list_filter = ('read', 'created_at')
    search_fields = ('recipient__email', 'message')
# --------------------------------------
# 3️⃣ REGISTER MODELS
# --------------------------------------
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Complaint, ComplaintAdmin)
admin.site.register(ComplaintUpdate, ComplaintUpdateAdmin)
admin.site.register(Notification, NotificationAdmin)

