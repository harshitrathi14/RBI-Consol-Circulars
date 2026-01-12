# Mobile App Setup Guide (Offline Version)

The `rbi-circulars-app` is now a **standalone offline application**. It comes pre-loaded with all RBI Master Circulars and does NOT require a backend server or internet connection to answer queries.

## 1. Prerequisites

1.  **Install Node.js**: [nodejs.org](https://nodejs.org/)
2.  **Install Expo CLI**: `npm install -g eas-cli`

## 2. Setup

Since Node.js was missing during creation, initialize the project dependencies manually:

1.  **Initialize Project** (if not done):
    ```bash
    # Create a temp project to get config files if needed
    npx create-expo-app@latest temp-app --template blank
    # Copy package.json, app.json etc to rbi-circulars-app if missing
    ```

2.  **Install Dependencies**:
    ```bash
    cd rbi-circulars-app
    npm install
    npm install @react-navigation/native @react-navigation/native-stack react-native-safe-area-context react-native-screens
    ```

## 3. Data Updates

The app uses `src/data/circulars.json` for its knowledge base.
To update this data when you add new PDFs:

1.  Add PDFs to `../` (parent folder).
2.  Run the export script from the parent folder:
    ```bash
    python export_to_mobile.py
    ```
    This updates `rbi-circulars-app/src/data/circulars.json`.

## 4. Building for Stores

### Android (Play Store / APK)
1.  `eas login`
2.  `eas build:configure` (Select Android)
3.  `eas build -p android --profile preview` (Test APK)
4.  `eas build -p android --profile production` (Play Store AAB)

### iOS (App Store)
1.  Requires Apple Developer Account ($99/year).
2.  `eas build:configure` (Select iOS)
3.  `eas build -p ios --profile production`

## 5. Local Testing
```bash
npx expo start
```
- Press `a` for Android Emulator.
- Scan QR code with Expo Go app on iPhone/Android.
