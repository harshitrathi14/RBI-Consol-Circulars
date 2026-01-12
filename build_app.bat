@echo off
echo ==========================================
echo RBI Circulars App - Build Script
echo ==========================================
cd rbi-circulars-app

echo.
echo [1/4] Installing dependencies...
call npm install
call npm install -g eas-cli

echo.
echo [2/4] Verifying data...
if exist "src\data\circulars.json" (
    echo Data file found.
) else (
    echo WARNING: src\data\circulars.json not found!
    echo Please run 'python ../export_to_mobile.py' first.
    pause
    exit /b
)

echo.
echo [3/4] Logging in to Expo (Required for building)...
call eas login

echo.
echo [4/4] Building APK...
echo This will upload the code to Expo servers and generate an APK download link.
call eas build -p android --profile preview

echo.
echo Build process initiated. Check the link above when ready.
pause
