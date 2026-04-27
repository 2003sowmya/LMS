# ===================== IMPORTS =====================
from django.contrib.auth import authenticate

from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import UserSerializer


# ===================== USER VIEWSET =====================
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    # ✅ CREATE USER
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ✅ UPDATE USER
    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ✅ DELETE USER
    def destroy(self, request, *args, **kwargs):
        user = self.get_object()

        # 🔒 Prevent deleting admin
        if user.role == "admin":
            return Response(
                {"error": "Admin user cannot be deleted"},
                status=status.HTTP_403_FORBIDDEN
            )

        user.delete()

        return Response(
            {"message": "User deleted successfully"},
            status=status.HTTP_200_OK
        )


# ===================== LOGIN API =====================
@api_view(['POST'])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")

    # 🔐 Authenticate user
    user = authenticate(username=username, password=password)

    if user:
        # ✅ Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),   # 🔥 IMPORTANT
            "refresh": str(refresh),
            "id": user.id,
            "username": user.username,
            "role": user.role
        })

    return Response(
        {"error": "Invalid credentials"},
        status=status.HTTP_400_BAD_REQUEST
    )