from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('local', 'Local'),
        ('foreigner', 'Foreigner'),
        ('official', 'Official'),
        ('admin', 'Admin'),
    )
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='local')
    civic_score = models.IntegerField(default=0)
    department = models.CharField(max_length=50, blank=True, null=True)
    visa_number = models.CharField(max_length=100, unique=True, null=True, blank=True)

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='api_users',
        blank=True,
        help_text='The groups this user belongs to.',
        related_query_name='api_user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='api_users_permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_query_name='api_user_permission',
    )

    def __str__(self):
        return self.username


class Complaint(models.Model):
    STATUS_CHOICES = (
        ('submitted', 'Submitted'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
    )
    DEPARTMENT_CHOICES = (
        ('sanitation', 'Sanitation'),
        ('roads', 'Roads'),
        ('water', 'Water'),
        ('electricity', 'Electricity'),
        ('other', 'Other'),
    )

    reporter = models.ForeignKey(User, on_delete=models.CASCADE)
    description = models.TextField()
    photo = models.ImageField(upload_to='complaint_photos/')
    location_lat = models.DecimalField(max_digits=9, decimal_places=6)
    location_lon = models.DecimalField(max_digits=9, decimal_places=6)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    funds_spent = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    def __str__(self):
        return f"Complaint #{self.id} by {self.reporter.username}"


class Proof(models.Model):
    complaint = models.ForeignKey(Complaint, related_name='proofs', on_delete=models.CASCADE)
    official = models.ForeignKey(User, on_delete=models.CASCADE)
    proof_image = models.ImageField(upload_to='proof_images/')
    notes = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Proof for Complaint #{self.complaint.id}"
