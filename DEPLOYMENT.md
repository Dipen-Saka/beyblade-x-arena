# Beyblade X — Deployment Guide
## Node.js → Supabase → GitHub → Vercel

---

## STEP 1 — Install Node.js on your machine

1. Go to https://nodejs.org
2. Download the **LTS** version (green button)
3. Run the installer — keep all defaults
4. Open a new terminal (Command Prompt / PowerShell on Windows, Terminal on Mac)
5. Verify:
   ```
   node --version   # should show v20.x.x or higher
   npm --version    # should show 10.x.x or higher
   ```

---

## STEP 2 — Set up the project folder

1. Copy the entire `beyblade-x` folder to your Desktop (or anywhere you like)
2. Open a terminal and navigate to it:
   ```
   cd Desktop/beyblade-x
   ```
3. Install all dependencies:
   ```
   npm install
   ```
   This will take 1–2 minutes.

---

## STEP 3 — Set up Supabase

### 3a. Create the database tables

1. Go to https://supabase.com and log in
2. Open your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Open the file `supabase-schema.sql` from the project folder
6. Copy its entire contents and paste into the SQL editor
7. Click **Run** (green button)
8. You should see "Success. No rows returned" — that's correct.

### 3b. Create the Storage bucket for part images

1. In Supabase, click **Storage** in the left sidebar
2. Click **New bucket**
3. Name it exactly: `part-images`
4. Check ✅ **Public bucket** (so part images load without auth)
5. Click **Save**

### 3c. Add storage policy so admins can upload

1. Click on the `part-images` bucket
2. Click **Policies** tab
3. Click **New policy** → **For full customization**
4. Policy name: `Admin uploads`
5. Allowed operation: **INSERT**
6. Policy definition:
   ```sql
   (auth.role() = 'authenticated')
   ```
7. Click **Review** → **Save policy**

### 3d. Create the Admin account

1. Go to **Authentication** → **Users** in Supabase
2. Click **Invite user** (or **Add user**)
3. Enter your admin email (e.g. `admin@yourdomain.com`)
4. Click **Send invite** — you'll get an email to set a password
5. Set a strong password when you open the email link

### 3e. Get your API keys

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon / public key** (long string starting with `eyJ...`)

---

## STEP 4 — Configure environment variables

1. In the `beyblade-x` folder, duplicate `.env.local.example`
2. Rename the copy to `.env.local`
3. Fill it in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
   NEXT_PUBLIC_ADMIN_EMAIL=admin@yourdomain.com
   ```
4. Save the file

### Test locally:
```
npm run dev
```
Open http://localhost:3000 — the login screen should appear.

---

## STEP 5 — Push to GitHub

1. Go to https://github.com and log in
2. Click **New repository** (top right, green button)
3. Name it `beyblade-x-arena`
4. Leave it **Private** (recommended)
5. Click **Create repository**
6. In your terminal (inside the `beyblade-x` folder):
   ```
   git init
   git add .
   git commit -m "Initial commit — Beyblade X Arena"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/beyblade-x-arena.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` with your GitHub username.

---

## STEP 6 — Deploy on Vercel

1. Go to https://vercel.com and log in
2. Click **Add New** → **Project**
3. Click **Import** next to `beyblade-x-arena` from GitHub
4. Under **Environment Variables**, add all three:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
   | `NEXT_PUBLIC_ADMIN_EMAIL` | your admin email |

5. Click **Deploy**
6. Vercel builds and gives you a URL like `https://beyblade-x-arena.vercel.app`

---

## STEP 7 — Set the OTP redirect URL in Supabase

This is required for the player email OTP login to work after deploying.

1. Go to Supabase → **Authentication** → **URL Configuration**
2. Under **Site URL**, enter your Vercel URL:
   ```
   https://beyblade-x-arena.vercel.app
   ```
3. Under **Redirect URLs**, click **Add URL** and add:
   ```
   https://beyblade-x-arena.vercel.app/auth/callback
   ```
4. Click **Save**

---

## STEP 8 — Upload part images (after deploy)

1. Log in as Admin at your Vercel URL
2. Go to **Inventory** → click any part → **Edit**
3. Click the image upload area and choose a PNG or SVG
4. The image uploads to Supabase Storage and links to the part automatically

Recommended: Use transparent-background PNG images (400×400px) for best results.
You can find official Beyblade X part renders on fan wikis or render them yourself.

---

## QUICK REFERENCE — All commands

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build (Vercel does this automatically)
npm run build
```

---

## TROUBLESHOOTING

**"Cannot find module" errors after npm install**
→ Delete the `node_modules` folder and `package-lock.json`, then run `npm install` again.

**Login redirects to wrong page**
→ Make sure Step 7 (redirect URLs) is done in Supabase.

**Images not showing**
→ Check that the `part-images` bucket is set to **Public** in Supabase Storage.

**Admin login not working**
→ Confirm `NEXT_PUBLIC_ADMIN_EMAIL` exactly matches the email in Supabase Auth → Users.

**Stock not updating**
→ The `decrement_stock` and `increment_stock` SQL functions must exist. Re-run `supabase-schema.sql`.
