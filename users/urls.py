from django.urls import path
from .views import wallet_connect , wallet_disconnect

urlpatterns = [
    path('wallet-connect/', wallet_connect, name='wallet_login'),
    path('wallet-disconnect/', wallet_disconnect, name='wallet_disconnect'),
]