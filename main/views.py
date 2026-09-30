from math import exp

from django.contrib import messages
from django.core import serializers
from django.http import HttpResponse
from django.contrib.auth import login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.decorators import login_required  
from django.core.exceptions import PermissionDenied   
from django.shortcuts import get_object_or_404, redirect, render
from main.models import Experience, Skill
from main.forms import SkillForm, ExperienceForm, UserForm
from django.http import JsonResponse
import datetime
from django.views.decorators.http import require_POST

def show_main(request):
    last_login = request.COOKIES.get('last_login', 'No active login session / Cookie not found')
    context = {
        "name": "Ridho",
        "npm": "2506606212",
        "study_program": "S1 Ilmu Komputer",
        "bio": (
            "CS Student at Fasilkom UI. Love CTFs but not that good."
        ),
        "last_login": last_login,
    }
    return render(request, "index.html", context)


def show_experience(request):
    title_query = request.GET.get("title", "").strip()
    context = {
        "name": "Ridho",
        "title": title_query,
        "form": ExperienceForm(),
    }
    return render(request, "experience.html", context)

def show_skill(request):
    title_query = request.GET.get("title", "").strip()

    context = {
        "name": "Ridho",
        "title": title_query,
        "form": SkillForm(),
        
    }
    return render(request, "skill.html", context)

@login_required(login_url="/login/")
def create_skill(request):
    if not request.user.is_superuser and not request.user.is_editor:
        raise PermissionDenied
    form = SkillForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Skill baru berhasil ditambahkan!")
        return redirect("main:show_skill")

    context = {
        "name": "Ridho",
        "form": form,
    }
    return render(request, "skills_form.html", context)

def get_skills_json(request):
    title_query = request.GET.get("title", "").strip()
    skills = Skill.objects.all()

    if title_query:
        skills = skills.filter(title__icontains=title_query)

    data = []
    for skill in skills:
        data.append({
            "pk": str(skill.id),
            "fields": {
                "title": skill.title,
                "description": skill.description,
                "category": skill.category,
            }
        })

    return JsonResponse(data, safe=False)

@login_required(login_url="/login/")
def delete_skill(request, skill_id):
    if not request.user.is_superuser and not request.user.is_editor:
        raise PermissionDenied
    skill = get_object_or_404(Skill, pk=skill_id)

    if request.method == "POST":
        skill.delete()
        messages.success(request, "Skill berhasil dihapus!")
        return redirect("main:show_skill")

    return redirect("main:show_skill")

@login_required(login_url="/login/")
def create_experience(request):
    if not request.user.is_superuser and not request.user.is_editor:
        raise PermissionDenied
    form = ExperienceForm(request.POST or None)
    
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Experience baru berhasil ditambahkan!")
        return redirect("main:show_experience")

    context = {
        "name": "Ridho",
        "form": form,
    }
    return render(request, "experience_form.html", context)

def get_experience_json(request):
    title_query = request.GET.get("title", "").strip()
    experiences = Experience.objects.prefetch_related('starred_by').all()

    if title_query:
        experiences = experiences.filter(title__icontains=title_query)

    data = []
    
    for experience in experiences:
        starred_users = experience.starred_by.all()
        is_starred = request.user in starred_users if request.user.is_authenticated else False
        starred_by_names = ", ".join([u.username for u in starred_users])
        data.append({
            "pk": str(experience.id),
            "fields": {
                "title": experience.title,
                "description": experience.description,
                "category": experience.category,
                "star_count": starred_users.count(),
                "is_starred": is_starred,
                "starred_by_names": starred_by_names,
            }
        })

    return JsonResponse(data, safe=False)

@login_required(login_url="/login/")
def delete_experience(request, experience_id):
    if not request.user.is_superuser and not request.user.is_editor:
        raise PermissionDenied
    experience = get_object_or_404(Experience, pk=experience_id)

    if request.method == "POST":
        experience.delete()
        messages.success(request, "Experience berhasil dihapus!")
        return redirect("main:show_experience")

    return redirect("main:show_experience")

@login_required(login_url="/login/")
def edit_experience(request, experience_id):
    if not request.user.is_superuser and not request.user.is_editor:
        raise PermissionDenied
    experience = get_object_or_404(Experience, pk=experience_id)
    form = ExperienceForm(request.POST or None, instance=experience)
    
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Experience baru berhasil ditambahkan!")
        return redirect("main:show_experience")

    context = {
        "name": "Ridho",
        "form": form,
        "experience": experience,
    }
    return render(request, "experience_edit_form.html", context)

@login_required(login_url="/login/")
def edit_skills(request, skill_id):
    if not request.user.is_superuser and not request.user.is_editor:
        raise PermissionDenied
    skill = get_object_or_404(Skill, pk=skill_id)
    form = SkillForm(request.POST or None, instance=skill)
    
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Changes have been saved!")
        return redirect("main:show_skill")

    context = {
        "name": "Ridho",
        "form": form,
        "skill": skill,
    }
    return render(request, "skill_edit_form.html", context)

def register(request):
    form = UserForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Account created successfully. Please log in.")
        return redirect("main:login")

    context = {
        "name": "Ridho",
        "form": form,
    }
    return render(request, "register.html", context)

def login_user(request):
    form = AuthenticationForm(request, data=request.POST or None)

    if request.method == "POST" and form.is_valid():
        user = form.get_user()
        login(request, user)
        response = redirect("main:show_main")
        response.set_cookie('last_login', datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        return response

    context = {
        "name": "Ridho",
        "form": form,
    }
    return render(request, "login.html", context)

def logout_user(request):
    logout(request)
    response = redirect("main:show_main")
    response.delete_cookie('last_login')
    return response

@login_required(login_url="/login/")
def toggle_star(request, experience_id):
    experience = get_object_or_404(Experience, pk=experience_id)

    if request.method == "POST":
        if request.user in experience.starred_by.all():
            experience.starred_by.remove(request.user)
        else:
            experience.starred_by.add(request.user)

    return redirect("main:show_experience")

def afk_page(request):
    return render(request, "afk.html")

@require_POST
def create_skill_ajax(request):
    if not request.user.is_superuser and not request.user.is_editor:
        return JsonResponse(
            {"message": "Only those with edit access can add skills."},
            status=403,
        )

    form = SkillForm(request.POST)
    if form.is_valid():
        skill = form.save()
        return JsonResponse(
            {"message": "Skill added successfully.", "pk": str(skill.id)},
            status=201,
        )

    return JsonResponse({"errors": form.errors.get_json_data()}, status=400)

@require_POST
def create_experience_ajax(request):
    if not request.user.is_superuser and not request.user.is_editor:
        return JsonResponse(
            {"message": "Only those with edit access can add experiences."},
            status=403,
        )

    form = ExperienceForm(request.POST)
    if form.is_valid():
        experience = form.save()
        return JsonResponse(
            {"message": "Experience added successfully.", "pk": str(experience.id)},
            status=201,
        )

    return JsonResponse({"errors": form.errors.get_json_data()}, status=400)