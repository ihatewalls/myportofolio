from main.models import Skill, Experience, User
from django.forms import TextInput, Textarea, ModelForm, URLInput
from django.contrib.auth.forms import UserCreationForm
from django import forms
class SkillForm(ModelForm):
    class Meta:
        model = Skill
        fields = [
            "title",
            "description",
            "category",
        ]

        labels = {
            "title": "Nama Skill",
            "description": "Deskripsi Skill",
            "category": "Kategori Skill",
        }

        widgets = {
            "title": TextInput(
                attrs={
                    "placeholder": "Name of Skill",
                    "maxlength": 255,
                }
            ),
            "description": Textarea(
                attrs={
                    "placeholder": "Description of Skill",
                    "rows": 3,
                }
            ),
            "category": TextInput(
                attrs={
                    "placeholder": "Language, Programming Language, Cybersecurity",
                }
            ),
        }
class ExperienceForm(ModelForm):
    class Meta:
        model = Experience
        fields = [
            "title",
            "description",
            "category",
        ]

        labels = {
            "title": "Nama Experience",
            "description": "Deskripsi Experience",
            "category": "Kategori Experience",
        }

        widgets = {
            "title": TextInput(
                attrs={
                    "placeholder": "Name of Experience",
                    "maxlength": 255,
                }
            ),
            "description": Textarea(
                attrs={
                    "placeholder": "Description of Experience",
                    "rows": 3,
                }
            ),
            "category": TextInput(
                attrs={
                    "placeholder": "Part-Time, Competition, Organization, etc.",
                }
            ),
        }
class UserForm(UserCreationForm):
    editor_key = forms.CharField(
        required=False,
        widget=forms.PasswordInput
    )
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("username",)
        
    def save(self, commit=True):
        user = super().save(commit=False)

        if self.cleaned_data["editor_key"] == "dummy_editor_key":
            user.is_editor = True
        else:
            user.is_editor = False

        if commit:
            user.save()

        return user
        


