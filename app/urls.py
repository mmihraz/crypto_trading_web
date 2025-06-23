from django.urls import path
from .views import app_overview, app 

urlpatterns = [
    path('', app_overview, name='app_overview'),
    path('app/', app, name='app'),
]