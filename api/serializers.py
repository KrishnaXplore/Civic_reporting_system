# api/serializers.py

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Complaint, Proof
import uuid

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'user_type', 'civic_score']

class ProofSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proof
        fields = '__all__'

class ComplaintSerializer(serializers.ModelSerializer):
    reporter = UserSerializer(read_only=True)
    proofs = ProofSerializer(many=True, read_only=True)

    class Meta:
        model = Complaint
        fields = '__all__'

# --- UPDATED REGISTRATION SERIALIZER (FIX) ---
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    visa_number = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'user_type', 'visa_number')

    def create(self, validated_data):
        user_type = validated_data.get('user_type')
        if user_type == 'foreigner':
            # --> FIX: Ensures all required fields are used for foreigners
            user = User.objects.create_user(
                username=validated_data['username'],
                password=str(uuid.uuid4()), # Auto-generate a secure, random password
                email=validated_data.get('email', ''),
                user_type='foreigner',
                visa_number=validated_data['visa_number']
            )
        else:
            # --> FIX: Ensures all required fields are used for locals
            user = User.objects.create_user(
                username=validated_data['username'],
                password=validated_data['password'],
                email=validated_data.get('email', ''),
                user_type='local'
            )
        return user

class ForeignerLoginSerializer(serializers.Serializer):
    visa_number = serializers.CharField(max_length=100)

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['user_type'] = user.user_type
        token['email'] = user.email
        return token