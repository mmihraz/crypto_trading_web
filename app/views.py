from django.shortcuts import render

def app_overview(request):
    return render(request , 'app_overview.html')

def app(request):
    return render(request , 'app.html')
