from django.urls import path
from main import api_views

app_name = "api"
urlpatterns = [
    path("experiences/", api_views.experience_list, name="experience-list"),
]