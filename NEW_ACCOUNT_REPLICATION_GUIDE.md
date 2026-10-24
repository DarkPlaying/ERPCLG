# 🚀 Complete Project Replication & Account Wire-Up Guide
**Project**: Edu Online Management Platform  
**Target**: Recreating and wiring up the entire system on brand-new accounts from scratch (Supabase, Google Cloud / Drive, Firebase, Render, and Gemini AI).

---

## 📋 Architectural Overview

The application relies on 5 core cloud services:

```
                      ┌──────────────────────────────────────┐
                      │    React + Vite Client Application   │
                      │  (Admin, Teacher, Student Dashboards)│
                      └────────┬──────────────┬──────────────┘
                               │              │
              ┌────────────────┘              └────────────────┐
              ▼                                                ▼
┌───────────────────────────┐                    ┌───────────────────────────┐
│     Supabase Project      │                    │    Google Cloud Platform  │
│  - PostgreSQL (24 Tables) │                    │  - Google Drive Storage   │
│  - Supabase Auth          │                    │    (Photos, PDFs, Backups)│
│  - Realtime WebSocket API │                    │  - Google OAuth 2.0 (GIS) │
└─────────────▲─────────────┘                    └─────────────▲─────────────┘
              │                                                │
              │                                                │
┌─────────────┴─────────────┐                    ┌─────────────┴─────────────┐
│  Render Notification Svc  │◀─── FCM Alerts ────│   Firebase Cloud Platform │
│  - Background Push Worker │                    │  - Cloud Messaging (FCM)  │
│  - Node.js Service        │                    │  - Web Push ServiceWorker │
└───────────────────────────┘                    └───────────────────────────┘
```

---

## 1. 🗄️ Step 1: Set Up New Supabase Project

### 1.1 Create the Project
1. Log into [supabase.com](https://supabase.com) and click **New Project**.
2. Set your **Project Name** (e.g. `eduonline-prod`), database password, and choose your preferred region.
3. Wait ~2 minutes for the database to provision.

### 1.2 Run the Master Schema SQL
1. Open your Supabase Dashboard and click **SQL Editor** (icon with `>_` on the left sidebar).
2. Click **New Query**.
3. Open the file `MASTER_SCHEMA_NEW_DATABASE.sql` located in this repository.
4. Copy the entire contents, paste into the SQL Editor, and click **Run**.
5. Verify output shows:
   ```
   ✅ ALL-IN-ONE MASTER SCHEMA CREATED SUCCESSFULLY!
     - 24 Production tables initialized
     - Triggers & RPCs ready
     - RLS configured (0 linter warnings, 0 fetch errors)
     - Realtime publication enabled
   ```

### 1.3 Configure Supabase Authentication
1. Go to **Authentication** -> **Providers** -> **Email**:
   - Ensure **Enable Email provider** is **ON**.
   - **Confirm email**: Turn **OFF** (the SQL trigger `auto_confirm_trigger` automatically confirms all users, eliminating email verification friction for students and teachers).
2. Go to **Authentication** -> **Attack Protection** (or **Password Policy**):
   - Toggle **Leaked Password Protection** to **ON** (resolves linter finding `auth_leaked_password_protection`).
3. Go to **Authentication** -> **URL Configuration**:
   - **Site URL**: `http://localhost:8080` (or your production domain).
   - **Redirect URLs**: Add:
     - `http://localhost:8080/**`
     - `http://localhost:5173/**`
     - `https://your-production-app.vercel.app/**`

### 1.4 Get Supabase Credentials
1. Go to **Project Settings** -> **API**:
   - Copy **Project URL** -> `VITE_SUPABASE_URL`
   - Copy **Project API Keys (`anon` / `public`)** -> `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Copy **Service Role Key (`secret`)** -> Keep this safe for the Render service.

---

## 2. 🔑 Step 2: Set Up Google Cloud & Google OAuth

### 2.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown at the top -> **New Project** (e.g. `EduOnline-Cloud`).

### 2.2 Configure OAuth Consent Screen
1. Navigate to **APIs & Services** -> **OAuth consent screen**.
2. Select **External** -> click **Create**.
3. Fill in:
   - **App name**: `Edu Online`
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Scopes: Click **Add or Remove Scopes** and add:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `.../auth/drive.file` (or `https://www.googleapis.com/auth/drive` for uploads)
5. Save and proceed to **Publishing status** -> Click **Publish App** (to avoid 7-day token expirations in testing mode).

### 2.3 Enable Google APIs
1. Navigate to **APIs & Services** -> **Library**.
2. Search for **Google Drive API** -> Click **Enable**.
3. (Optional) Search for **Google Picker API** -> Click **Enable** (if selecting files directly).

### 2.4 Create OAuth 2.0 Client ID
1. Navigate to **APIs & Services** -> **Credentials**.
2. Click **Create Credentials** -> **OAuth client ID**.
3. **Application type**: **Web application**.
4. **Name**: `EduOnline Web Client`.
5. **Authorized JavaScript origins**:
   - `http://localhost:8080`
   - `http://localhost:5173`
   - `https://your-production-app.vercel.app`
6. **Authorized redirect URIs**:
   - `https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/auth/v1/callback`
   - `http://localhost:8080`
   - `https://your-production-app.vercel.app`
7. Click **Create**.
8. Copy:
   - **Client ID** -> save for `VITE_GOOGLE_CLIENT_ID` in `.env`.
   - **Client Secret** -> needed for Supabase Google Sign-In.

### 2.5 Link Google Login to Supabase
1. Go to your **Supabase Dashboard** -> **Authentication** -> **Providers** -> **Google**.
2. Toggle **Enable Google provider** to **ON**.
3. Paste the **Client ID** and **Client Secret** from Step 2.4.
4. Click **Save**.

---

## 3. 📁 Step 3: Set Up Google Drive Folders

The application offloads large files (teacher/student profile pictures, student assignment PDFs, and database backups) directly to Google Drive.

### 3.1 Create the 4 Drive Folders
Open your Google Drive and create 4 folders:
1. `EduOnline Teacher Profiles`
2. `EduOnline Student Profiles`
3. `EduOnline Assignments`
4. `EduOnline Backups`

### 3.2 Configure Folder Permissions
For each of the 4 folders:
1. Right-click folder -> **Share** -> **Share**.
2. Under **General access**, change from *Restricted* to **"Anyone with the link"**.
3. Set role to **Editor** (this allows the client upload flow using the OAuth access token to write files into the folder).

### 3.3 Extract Folder IDs
Open each folder in your browser and look at the URL:
```
https://drive.google.com/drive/folders/1vwD_S2ZwD7NO_p7Njv0Fnl8w8-kVXTE6?usp=sharing
                                       └──────────────────────────────┘
                                                  FOLDER ID
```
Record the IDs for your `.env`:
- `VITE_TEACHER_PROFILE_FOLDER_ID`: Teacher photos folder ID
- `VITE_STUDENT_PROFILE_FOLDER_ID`: Student photos folder ID
- `VITE_ASSIGNMENT_DRIVE_FOLDER_ID`: Assignment uploads folder ID
- Backup folder ID: (Default `1ie0qArIerEv6Adct4s3meChXYImT6RgR` in `AdminDashboard.tsx`)

---

## 4. 🔥 Step 4: Set Up Firebase (FCM & Web Push)

Firebase provides Cloud Messaging (FCM) and Web Push notifications.

### 4.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (you can link your existing Google Cloud project or create a new one).

### 4.2 Add Web App
1. On the project home page, click the Web icon (`</>`) to add an app.
2. App nickname: `EduOnline Web`.
3. Check **Also set up Firebase Hosting** (optional) and click **Register app**.
4. Copy the `firebaseConfig` credentials into `.env`:
   - `apiKey` -> `VITE_FIREBASE_API_KEY`
   - `authDomain` -> `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` -> `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` -> `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` -> `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` -> `VITE_FIREBASE_APP_ID`
   - `measurementId` -> `VITE_FIREBASE_MEASUREMENT_ID`

### 4.3 Generate FCM VAPID Key Pair
1. In Firebase Console, go to **Project Settings** (gear icon) -> **Cloud Messaging** tab.
2. Scroll down to **Web configuration** -> **Web Push certificates**.
3. Click **Generate key pair**.
4. Copy the generated Key (Public key / VAPID key).

### 4.4 Generate Service Account Key (for Render)
1. Go to **Project Settings** -> **Service accounts** tab.
2. Select **Firebase Admin SDK** (Node.js).
3. Click **Generate new private key** -> Download the `.json` file.
4. Keep this file safe; you will paste its content into Render.

---

## 5. 🌐 Step 5: Set Up Render Notification Service

The background service on Render listens for database updates (new announcements, attendance events, assignments) and dispatches FCM push notifications.

### 5.1 Create Web Service on Render
1. Go to [render.com](https://render.com) and log in.
2. Click **New +** -> **Web Service** (or **Background Worker**).
3. Connect your notification server repository / directory (e.g. `notification-service`).
4. Configure:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or Starter)

### 5.2 Set Environment Variables on Render
In your Render Service Dashboard, navigate to **Environment** and add:

| Key | Description | Example / Source |
| :--- | :--- | :--- |
| `SUPABASE_URL` | Your Supabase project URL | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret service_role key | From Supabase API Settings |
| `FIREBASE_SERVICE_ACCOUNT` | Entire JSON from Step 4.4 | Paste the compact single-line JSON |
| `PORT` | Listening port | `10000` |

### 5.3 Verify Service
1. In Render Dashboard, open the **Logs** tab.
2. Look for:
   ```
   ✅ Notification service listening on port 10000
   ✅ Firebase Admin SDK initialized
   ✅ Listening to Supabase Realtime changes
   ```

---

## 6. 🤖 Step 6: Set Up Google Gemini AI API

The AI test generator and syllabus parser in the Teacher Dashboard use the Gemini API.

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click **Create API Key** and select your Google Cloud project.
3. Copy the API Key.
4. Add to your `.env`:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

---

## 7. 📄 Step 7: Master `.env` Configuration Template

Create or replace the `.env` file in the root directory:

```env
# ==============================================================================
# 1. SUPABASE DATABASE & AUTHENTICATION
# ==============================================================================
VITE_SUPABASE_URL=https://<YOUR_PROJECT_ID>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<YOUR_ANON_KEY>

# ==============================================================================
# 2. GOOGLE OAUTH & GOOGLE DRIVE INTEGRATION
# ==============================================================================
VITE_GOOGLE_CLIENT_ID=<YOUR_CLIENT_ID>.apps.googleusercontent.com
VITE_TEACHER_PROFILE_FOLDER_ID=<YOUR_TEACHER_PHOTOS_FOLDER_ID>
VITE_STUDENT_PROFILE_FOLDER_ID=<YOUR_STUDENT_PHOTOS_FOLDER_ID>
VITE_ASSIGNMENT_DRIVE_FOLDER_ID=<YOUR_ASSIGNMENT_FOLDER_ID>

# ==============================================================================
# 3. FIREBASE & CLOUD MESSAGING (FCM)
# ==============================================================================
VITE_FIREBASE_API_KEY=<YOUR_FIREBASE_API_KEY>
VITE_FIREBASE_AUTH_DOMAIN=<YOUR_PROJECT_ID>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<YOUR_PROJECT_ID>
VITE_FIREBASE_STORAGE_BUCKET=<YOUR_PROJECT_ID>.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=<YOUR_SENDER_ID>
VITE_FIREBASE_APP_ID=<YOUR_APP_ID>
VITE_FIREBASE_MEASUREMENT_ID=<YOUR_MEASUREMENT_ID>

# ==============================================================================
# 4. GEMINI AI (Document Parsing & AI Tests)
# ==============================================================================
VITE_GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
```

---

## 8. 🏁 Step 8: Initial Admin Account Setup & Verification Checklist

Once the database and `.env` are configured:

### 8.1 Register the Initial Super-Admin
1. Start the application locally:
   ```bash
   npm run dev
   ```
2. Navigate to the login/signup page.
3. Sign up with email: `sanjay@gmail.com` (or create your own admin account).
4. Run this one SQL query in Supabase SQL Editor to guarantee super-admin privileges:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'sanjay@gmail.com';
   INSERT INTO public.user_roles (user_id, role)
   SELECT id, 'admin'::public.app_role FROM public.profiles WHERE email = 'sanjay@gmail.com'
   ON CONFLICT DO NOTHING;
   ```

### 8.2 Testing Checklist
- [ ] **Admin Dashboard**: Log in as Admin. Verify stats ("Users", "Students", "Teachers", "Workspaces") display without 0-count errors.
- [ ] **Workspace Creation**: Create a new classroom workspace (e.g. "Computer Science - Section A").
- [ ] **Teacher Creation**: Add a teacher in the Admin Dashboard.
- [ ] **Student Creation**: Add a student in the Admin Dashboard.
- [ ] **Teacher Dashboard**: Log in as the teacher. Verify assigned workspaces appear and attendance can be recorded.
- [ ] **Student Dashboard**: Log in as the student. Verify announcements and workspaces are visible.
- [ ] **Google Drive Upload**: In student/teacher profile settings, upload a profile photo and verify it saves to the Google Drive folder.
- [ ] **Notification Test**: Click the **Test** notification button in the header; verify browser system notification appears.
- [ ] **Supabase Security Advisor**: In Supabase Dashboard -> **Security Advisors** / **Linter**, verify **0 warnings** are reported.
