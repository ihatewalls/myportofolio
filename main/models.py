import uuid

from django.db import models
from django.contrib.auth.models import User 

class Experience(models.Model):
    EXPERIENCE_CHOICES = [
        ("internship", "Internship"),
        ("research", "Research"),
        ("volunteer", "Volunteer"),
        ("part-time", "Part-Time"),
        ("full-time", "Full-Time"),
        ("freelance", "Freelance"),
        ("competition", "Competition"),
        ("organization", "Organization"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(
        max_length=20,
        choices=EXPERIENCE_CHOICES,
    )
    thumbnail = models.URLField(blank=True, null=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(blank=True, null=True)
    starred_by = models.ManyToManyField(
        User, related_name="starred_experience", blank=True
    )
    def __str__(self):
        return self.title

    @property
    def is_ongoing(self):
        return self.ended_at is None
    
class Skill(models.Model):
    SKILL_CHOICES = [
        ("language", "Language"),
        ("programming-language", "Programming Language"),
        ("cybersecurity", "Cybersecurity")
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(
        max_length=20,
        choices=SKILL_CHOICES,
    )
    starred_by = models.ManyToManyField(
        User, related_name="starred_skill", blank=True
    )

    def __str__(self):
        return self.title

    