from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email', 'role', 'department']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    # ✅ CREATE USER (FIXED)
    def create(self, validated_data):
        password = validated_data.pop('password')   # 🔥 FIX
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    # ✅ UPDATE USER (VERY IMPORTANT)
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance