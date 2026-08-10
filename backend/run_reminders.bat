@echo off
cd /d "D:\PROJECT\LMS\backend"
"D:\PROJECT\LMS\backend\venv\Scripts\python.exe" manage.py remind_due_assignments >> "D:\PROJECT\LMS\backend\reminder_log.txt" 2>&1
