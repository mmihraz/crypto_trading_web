from django.contrib.auth import login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import UserWallet

@csrf_exempt
def wallet_connect(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            wallet_address = data.get('wallet_address')
            if not wallet_address:
                return JsonResponse({'status': 'error', 'message': 'Wallet address not provided'}, status=400)

            user, created = UserWallet.objects.get_or_create(wallet_address=wallet_address)
            
            if user:
                login(request, user, backend='django.contrib.auth.backends.ModelBackend')
                return JsonResponse({'status': 'success', 'message': 'User logged in successfully'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)

@csrf_exempt
def wallet_disconnect(request):
    logout(request)
    return JsonResponse({'status': 'success', 'message': 'User logged out successfully'})