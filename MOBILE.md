# 📱 Scholr Mobile App Guide

## Two ways to distribute

| Method | Time | Cost | Where |
|--------|------|------|-------|
| PWA (browser install) | Done! | Free | Share link, users install from Chrome |
| Android APK (Play Store) | ~2 hours | ₹2,100 one-time | Google Play Store |

---

## Method 1: PWA — Already Done!

Your app is already a PWA. After deploying to Vercel:

**For Android users:**
1. Open Chrome → visit your Vercel URL
2. Chrome shows "Add to Home Screen" banner
3. Tap Install → appears on home screen like a native app

**For iOS users:**
1. Open Safari → visit your Vercel URL
2. Tap Share button (bottom) → "Add to Home Screen"
3. Tap Add → appears on home screen

Share this tip with your users and they're set!

---

## Method 2: Android APK for Play Store

### Prerequisites (install once)
1. **Android Studio** → https://developer.android.com/studio (free, ~1GB)
2. **Java JDK 17** → https://adoptium.net (free)
3. **Node.js 18+** → already installed

### Step 1 — Update capacitor.config.ts
Open `capacitor.config.ts` and replace:
```
url: 'https://your-app.vercel.app',
```
with your actual Vercel URL, e.g.:
```
url: 'https://scholr-abc123.vercel.app',
```

### Step 2 — Install Capacitor and add Android
```powershell
npm install --legacy-peer-deps
npx cap add android
```

### Step 3 — Add splash screen and icons to Android
```powershell
npm install @capacitor/assets --legacy-peer-deps
npx capacitor-assets generate --android
```

### Step 4 — Open in Android Studio
```powershell
npx cap open android
```
Android Studio will open. Wait for Gradle sync (2-3 minutes first time).

### Step 5 — Build the APK
In Android Studio:
1. Click **Build → Generate Signed Bundle/APK**
2. Choose **Android App Bundle (.aab)** for Play Store
3. Click **Create new keystore** (first time)
   - Save the keystore file somewhere safe — you need it for every update
   - Fill in the alias, password, your details
4. Click **Finish** — Android Studio builds the AAB
5. Find the file at: `android/app/release/app-release.aab`

### Step 6 — Upload to Play Store
1. Go to **play.google.com/console** → pay ₹2,100 one-time fee
2. Create new app → fill in details:
   - App name: Scholr — AI Attendance Tracker
   - Category: Education
   - Content rating: Everyone
3. Upload the `.aab` file
4. Add screenshots (take them from your phone or browser)
5. Set pricing to **Free** (users pay in-app via Razorpay)
6. Submit for review (1-3 days)

---

## Updating the app

Since your Capacitor app loads from Vercel URL, every time you deploy to Vercel:
- Web users get the update instantly
- App users get the update automatically on next launch

**No need to re-upload to Play Store for most updates!**

Only re-upload to Play Store if you change native features (camera, notifications, etc.)

---

## Adding Push Notifications (optional, later)

```powershell
npm install @capacitor/push-notifications --legacy-peer-deps
npx cap sync android
```

Then follow: https://capacitorjs.com/docs/apis/push-notifications

---

## Useful commands

| Command | What it does |
|---------|-------------|
| `npx cap sync` | Sync web changes to Android |
| `npx cap open android` | Open Android Studio |
| `npx cap run android` | Run on connected phone |
| `npx cap run android --livereload` | Run with live reload |
