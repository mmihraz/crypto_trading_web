from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

def app_overview(request):
    return render(request , 'app_overview.html')

def app(request):
    return render(request , 'app.html')

@login_required
def get_wallet_address(request):
    if request.user.is_authenticated:
        full_address = request.user.wallet_address
        return JsonResponse({'address': full_address})
    else:
        return JsonResponse({'error': 'User not authenticated'}, status=401)
