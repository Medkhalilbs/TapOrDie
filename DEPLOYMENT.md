# Android Deployment Guide (Google Play)

This guide explains how to convert the **Tap or Die** web project into a native Android App using **Capacitor**.

## 1. Prerequisites
- **Node.js**: Installed on your system.
- **Android Studio**: Installed and configured with Android SDK.

## 2. Initialization
Run these commands in your project root:

```powershell
# Initialize Capacitor
npm init @capacitor/app

# Install Capacitor Core and CLI
npm install @capacitor/core @capacitor/cli

# Initialize with your App ID (e.g., com.yourname.tapordie)
npx cap init
```

## 3. Adding Android Platform
```powershell
# Install the Android platform package
npm install @capacitor/android

# Add the Android folder to your project
npx cap add android
```

## 4. Building & Syncing
Every time you change your code (HTML/JS/CSS), run:
```powershell
# Sync your web files to the Android project
npx cap copy android
```

## 5. Generating the AAB (for Google Play)
1. Open the `./android` folder in **Android Studio**.
2. Go to **Build > Generate Signed Bundle / APK...**.
3. Choose **Android App Bundle**.
4. Create a new **Key Store** (keep this file safe!).
5. Set `Build Type` to `release`.
6. Once finished, you will have a `.aab` file in `app/release`.

## 6. Play Console Upload
1. Go to the [Google Play Console](https://play.google.com/console/).
2. Create a new App.
3. Upload the `.aab` file under **Internal Testing** or **Production**.
4. Fill in the store listing details, icons (512x512), and screenshots.
