from django.urls import path
from .views import app_overview, app, get_wallet_address

urlpatterns = [
    path('', app_overview, name='app_overview'),
    path('app/', app, name='app'),
    path('app/get-wallet-address/', get_wallet_address ,  name='get_full_wallet_address'),
]