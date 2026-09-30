from main.models import Skill, Experience, User
from django.forms import TextInput, Textarea, ModelForm, URLInput
from django.contrib.auth.forms import UserCreationForm
from django import forms
from django.core.exceptions import ValidationError
from django.utils.html import strip_tags
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
    def clean_title(self):
        title = strip_tags(self.cleaned_data["title"]).strip()
        if not title:
            raise ValidationError("Project name can't contain only HTML tags.")
        return title

    def clean_tech_stack(self):
        return strip_tags(self.cleaned_data["category"]).strip()

    def clean_description(self):
        return strip_tags(self.cleaned_data["description"]).strip()
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
    def clean_title(self):
            title = strip_tags(self.cleaned_data["title"]).strip()
            if not title:
                raise ValidationError("Project name can't contain only HTML tags.")
            return title
    
    def clean_tech_stack(self):
        return strip_tags(self.cleaned_data["category"]).strip()

    def clean_description(self):
        return strip_tags(self.cleaned_data["description"]).strip()
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
        


