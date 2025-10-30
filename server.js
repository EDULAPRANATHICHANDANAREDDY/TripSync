require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ DATABASE CONNECTION
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT
});

// ✅ ENSURE TABLES EXIST
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT,
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Database initialized successfully.");
  } catch (err) {
    console.error("❌ DB init error:", err.message);
  }
}
initDB();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ NODEMAILER TRANSPORTER
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mail transporter error:", error.message);
  } else {
    console.log("✅ Mail transporter ready.");
  }
});

// ✅ LOCATIONS DATA (unchanged)
const locations = [
  { id:1, name:'Goa', image:'/images/locations/img4.jpg', details:'Beaches, water sports, nightlife, Portuguese heritage and seafood.' },
  { id:2, name:'Jaipur', image:'/images/locations/img7.jpg', details:'Amber Fort, City Palace, Hawa Mahal and colorful bazaars.' },
  { id:3, name:'Agra', image:'/images/locations/img1.jpg', details:'Taj Mahal, Agra Fort, Mughlai cuisine and marble crafts.' },
  { id:4, name:'Varanasi', image:'/images/locations/img3.jpg', details:'Ghats of the Ganges, evening aarti, ancient temples and spiritual experiences.' },
  { id:5, name:'Munnar (Kerala)', image:'/images/locations/img18.jpg', details:'Tea gardens, misty hills, Eravikulam NP and scenic trekking.' },
  { id:6, name:'Leh-Ladakh', image:'/images/locations/img19.jpg', details:'High-altitude lakes, monasteries, biking routes and dramatic landscapes.' },
  { id:7, name:'Rishikesh', image:'/images/locations/img12.jpg', details:'Yoga, white-water rafting, temples and riverside cafes.' },
  { id:8, name:'Shimla', image:'/images/locations/img21.jpg', details:'Colonial architecture, Mall Road, scenic mountain walks and pine forests.' },
  { id:9, name:'Darjeeling', image:'/images/locations/img22.jpg', details:'Toy train, tea gardens and views of Kanchenjunga.' },
  { id:10, name:'Udaipur', image:'/images/locations/img23.jpg', details:'City of Lakes, palaces, boat rides and romantic vistas.' },
  { id:11, name:'Hyderabad', image:'/images/locations/img14.jpg', details:'Charminar, Golconda Fort, biryani and pearls.' },
  { id:12, name:'Kolkata', image:'/images/locations/img30.jpg', details:'Cultural capital, colonial architecture, food and festivals.' },
  { id:13, name:'Mumbai', image:'/images/locations/img6.jpg', details:'Gateway of India, Marine Drive, Bollywood and seaside promenades.' },
  { id:14, name:'Pondicherry', image:'/images/locations/img17.jpg', details:'French Quarter, beaches, cafés and Auroville nearby.' },
  { id:15, name:'Hampi', image:'/images/locations/img25.jpg', details:'UNESCO ruins, boulder-strewn landscape and ancient temples.' },
  { id:16, name:'Khajuraho', image:'/images/locations/img26.jpg', details:'Famous for intricately carved temples and sculptures.' },
  { id:17, name:'Coorg', image:'/images/locations/img27.jpg', details:'Coffee plantations, waterfalls and misty hills.' },
  { id:18, name:'Andaman Islands', image:'/images/locations/img28.jpg', details:'Pristine beaches, scuba diving and Radhanagar beach.' },
  { id:19, name:'Gangtok (Sikkim)', image:'/images/locations/img29.jpg', details:'Monasteries, scenic mountain passes and Himalayan culture.' },
  { id:20, name:'Ooty', image:'/images/locations/img10.jpg', details:'Botanical gardens, Nilgiri toy train and pleasant climate.' }
];

// ✅ ROUTES
app.get('/', (req, res) => {
  res.render('index', { googleClientId: process.env.GOOGLE_CLIENT_ID || '' });
});

app.get('/locations', (req, res) => res.render('locations', { locations }));
app.get('/location/:id', (req, res) => {
  const id = Number(req.params.id);
  const loc = locations.find(l => l.id === id);
  if (!loc) return res.status(404).send('Location not found');
  res.render('location', { location: loc });
});
app.get('/about', (req, res) => res.render('about'));
app.get('/contact', (req, res) => res.render('contact'));

// ✅ NEW REGISTER GET ROUTE
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: `Contact from ${name || 'visitor'}`,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong><br/>${message}</p>`
    });
    console.log("📨 Contact message sent from:", email);
  } catch (err) {
    console.error('❌ Contact mail error:', err.message);
  }
  res.render('contact', { message: 'Message sent — we will contact you shortly.' });
});

// ✅ REGISTER POST
app.post('/register', async (req, res) => {
  const { name, email } = req.body;
  console.log("📥 Registration attempt:", { name, email });

  if (!email || !name) return res.status(400).send('Name and email required');

  try {
    const result = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name RETURNING *',
      [name, email]
    );
    console.log("✅ User inserted/updated:", result.rows[0]);

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Welcome to TripSync!',
      html: `<h3>Hi ${name},</h3><p>Thank you for registering with TripSync. We’re excited to help you collect memories.</p><p>— TripSync Team</p>`
    });

    res.render('success', { name, email });
  } catch (err) {
    console.error('❌ Registration failed:', err.message);
    res.status(500).send('Registration failed: ' + err.message);
  }
});

// ✅ FEEDBACK
app.get('/feedback', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM feedback ORDER BY created_at DESC');
  res.render('feedback', { feedbacks: rows });
});
app.post('/feedback', async (req, res) => {
  const { name, email, message } = req.body;
  await pool.query('INSERT INTO feedback (name, email, message) VALUES ($1, $2, $3)', [name, email, message]);
  res.redirect('/feedback');
});

app.listen(PORT, () => console.log(`🚀 TripSync running on http://localhost:${PORT}`));