from django.urls import path

from main.views import show_main, show_experience, show_skill, create_skill, get_skills_json, delete_skill, create_experience, get_experience_json

app_name = "main"

urlpatterns = [
    path("", show_main, name="show_main"),
    path("experience/", show_experience, name="show_experience"),
    path("skills/", show_skill, name="show_skill"),
    path("skills/add/", create_skill, name="create_skill"),
    path("api/skills/", get_skills_json, name="get_skills_json"),
    path("skills/<uuid:skill_id>/delete/", delete_skill, name="delete_skill"),
    path("experience/add/", create_experience, name="create_experience"),
    path("api/experience/", get_experience_json, name="get_experience_json"),
]