from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'password',
            'email',
            'role',
            'department',
            'roll_number',
            'employee_id'
        ]

        extra_kwargs = {
            'password': {
                'write_only': True,
                'required': False
            },
            'email': {
                'required': True   # ✅ EMAIL MUST BE PROVIDED
            },
            'roll_number': {'read_only': True},
            'employee_id': {'read_only': True}
        }

    # ================= VALIDATION =================

    def validate_username(self, value):
        if not value:
            raise serializers.ValidationError("Username is required")
        return value

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email is required")

        # optional: unique check
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")

        return value

    def validate_role(self, value):
        valid_roles = ['student', 'teacher', 'admin']
        if value not in valid_roles:
            raise serializers.ValidationError("Invalid role")
        return value

    # ================= CREATE =================

    def create(self, validated_data):
        password = validated_data.pop('password', None)

        user = User(**validated_data)

        if password:
            user.set_password(password)
        else:
            user.set_password(User.objects.make_random_password())

        user.save()
        return user

    # ================= UPDATE =================

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance