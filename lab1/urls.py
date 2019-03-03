from django.urls import path

from . import views

urlpatterns = [
    # ex: /lab1/
    path('', views.index, name='index'),
    path('parsing/', views.parse, name='parsing')
]