# api/views.py

from rest_framework import viewsets, permissions, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Complaint, Proof, User
from .serializers import (
    ComplaintSerializer, 
    ProofSerializer, 
    UserRegistrationSerializer, 
    MyTokenObtainPairSerializer,
    ForeignerLoginSerializer
)

# --- Existing Views (Keep these) ---
class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all().order_by('-created_at')
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)

class ProofViewSet(viewsets.ModelViewSet):
    queryset = Proof.objects.all()
    serializer_class = ProofSerializer
    permission_classes = [permissions.IsAuthenticated]

# --- Views for Login/Registration ---
class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class ForeignerLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = ForeignerLoginSerializer(data=request.data)
        if serializer.is_valid():
            visa_number = serializer.validated_data['visa_number']
            try:
                user = User.objects.get(visa_number=visa_number, user_type='foreigner')
                refresh = RefreshToken.for_user(user)
                refresh.payload['username'] = user.username
                refresh.payload['user_type'] = user.user_type
                refresh.payload['email'] = user.email

                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({'error': 'Invalid visa number'}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- ADD THIS NEW VIEW ---
# This view allows logged-in users to fetch only their own complaints.
class MyComplaintsView(generics.ListAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter complaints to only those created by the current user
        return Complaint.objects.filter(reporter=self.request.user).order_by('-created_at')