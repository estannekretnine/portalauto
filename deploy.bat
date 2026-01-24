@echo off
cd /d d:\auto

echo ========================================
echo    Automatski deploy na Git i Vercel
echo ========================================
echo.

git status --short
echo.

git add .

set COMMIT_MSG=Auto deploy %date% %time%
git commit -m "%COMMIT_MSG%"

if %errorlevel% neq 0 (
    echo.
    echo Nema promena za commit.
    pause
    exit /b
)

echo.
echo Pushing na GitHub...
git push origin main

echo.
echo ========================================
echo    Deploy zavrsen!
echo ========================================
pause
