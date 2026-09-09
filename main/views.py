from django.shortcuts import render

from main.models import Experience


def show_main(request):
    context = {
        "name": "Ridho",
        "npm": "2506606212",
        "study_program": "S1 Ilmu Komputer",
        "bio": (
            "CS Student at Fasilkom UI. Love CTFs but not that good."
        ),
    }
    return render(request, "index.html", context)


def show_experience(request):
    context = {
        "name": "Ridho",
        "experience_list": Experience.objects.all(),
    }
    return render(request, "experience.html", context)