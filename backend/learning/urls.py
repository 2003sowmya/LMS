from rest_framework.routers import DefaultRouter
from .views import LectureViewSet, AssignmentViewSet, SubmissionViewSet

router = DefaultRouter()
router.register(r'lectures', LectureViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'submissions', SubmissionViewSet)

urlpatterns = router.urls