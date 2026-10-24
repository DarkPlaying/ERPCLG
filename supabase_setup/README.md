# Supabase Setup Guide

## 1. Connect to Supabase

1.  Go to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2.  Go to **Project Settings** -> **API**.
3.  Copy the `Project URL` and `anon` / `public` Key.
4.  Open your project's `.env` file and update/add:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

## 2. Initialize Database

1.  In Supabase Dashboard, go to **SQL Editor**.
2.  Open `supabase_setup/schema.sql` from this project.
3.  Copy the contents and paste them into the SQL Editor.
4.  Click **Run**.

This creates the `profiles` table and sets up a Trigger. When you create a user in Auth, a profile is automatically created in the `profiles` table.

## 3. Create Default Admin

There are two ways to do this:

### Option A: Using the App (Recommended)

1.  Start the app: `npm run dev`.
2.  Navigate to `http://localhost:5173/setup` (or your local port).
3.  Fill in the details:
    *   **Email**: `admin@examportal.com`
    *   **Password**: `Dark` (or your choice)
    *   **Role**: `admin`
4.  Click **Create Admin**.

### Option B: Using Supabase Dashboard

1.  Go to **Authentication** -> **Users**.
2.  Click **Add User**.
3.  Enter Email (`admin@examportal.com`) and Password.
4.  **Important**: The Dashboard doesn't let you set metadata (Role/Name) easily. You will have to manually edit the `profiles` table row after creation.
    *   Go to **Table Editor** -> `profiles`.
    *   Find the user and change `role` to `admin`.

## 4. Verification

1.  Go to `/login`.
2.  Login with `admin@examportal.com` / `Dark`.
3.  You should be redirected to the Admin Dashboard.
