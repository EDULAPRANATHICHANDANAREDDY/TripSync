TripSync setup notes
--------------------

1) Install deps:
   npm install

2) Create .env from .env.example and fill:
   - PGUSER, PGHOST, PGDATABASE, PGPASSWORD, PGPORT
   - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (if using Gmail, create an app password)
   - ADMIN_EMAIL
   - GOOGLE_CLIENT_ID (optional — for Google Sign-in)
   - OPENAI_API_KEY (optional — if you want advanced AI chat)

3) Database:
   - Create database named in PGDATABASE.
   - server.js will create the `users` and `feedback` tables on first run.

4) Images:
   - Put hero images into public/images as hero1.jpg ... hero5.jpg.
   - Put location images into public/images/locations/1.jpg ... 20.jpg.
   - I provided sample filenames — you can use your own images or download royalty-free pictures.

5) Google Sign-in:
   - Create OAuth Client ID in Google Cloud Console (choose Web application).
   - Add Authorized JavaScript origins: http://localhost:3000
   - Put the client ID into .env GOOGLE_CLIENT_ID.
   - The UI includes the "Continue with Google" button; you'll need to enable the new Google Identity Services to make it fully functional.

6) Run:
   npm start
   Open http://localhost:3000

7) Nodemailer / Gmail:
   - If using Gmail, ensure you use an app-specific password (2FA) and set SMTP_USER to your Gmail address and SMTP_PASS to the app password.

8) Optional: To integrate a real AI backend (OpenAI), follow comments in server.js and add OPENAI_API_KEY.
