// main.js - hero rotation, register modal, google sign-in hook, chatbox

document.addEventListener('DOMContentLoaded', () => {
  // HERO rotation using hero1..hero5.jpg
  const hero = document.querySelector('.hero');
  const heroImgs = [
    '/images/hero6.jpg',
    '/images/hero2.jpg',
    '/images/hero3.jpg',
    '/images/hero4.jpg',
    '/images/hero5.jpg',
     '/images/hero1.jpg'

  ];
  let idx = 0;
  function setHero() {
    if (!hero) return;
    hero.style.backgroundImage = `url("${heroImgs[idx]}")`;
    idx = (idx + 1) % heroImgs.length;
  }
  setHero();
  setInterval(setHero, 10000); // change every 10s

  // Open register modal (for header button class .open-register)
  document.querySelectorAll('.open-register').forEach(btn => {
    btn.addEventListener('click', openRegisterModal);
  });

  function openRegisterModal() {
    if (document.querySelector('.modal')) return;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-inner">
        <h3>Register with TripSync</h3>
        <form id="registerForm">
          <input name="name" placeholder="Full Name" required />
          <input name="email" type="email" placeholder="Email" required />
          <div style="display:flex;gap:8px;margin-top:8px">
            <button type="submit" class="cta-btn">Register</button>
            <div id="g_id_signin_container"></div>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    document.getElementById('registerForm').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const payload = { name: fd.get('name'), email: fd.get('email') };
      const res = await fetch('/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (res.ok) {
        const html = await res.text();
        document.open(); document.write(html); document.close();
      } else {
        alert('Registration failed');
      }
    });

    // Render Google Sign-in button if client id is present in meta
    const clientId = document.querySelector('meta[name="google-client-id"]')?.content || '';
    if (clientId && window.google) {
      // use Google Identity Services to render button
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential
      });
      google.accounts.id.renderButton(
        document.getElementById('g_id_signin_container'),
        { theme: 'outline', size: 'medium' }
      );
    } else {
      // if not configured, show a simple fallback button
      const fallback = document.createElement('button');
      fallback.className = 'cta-btn';
      fallback.style.background = '#db4437';
      fallback.textContent = 'Continue with Google (not configured)';
      fallback.addEventListener('click', () => alert('Please set GOOGLE_CLIENT_ID in .env and restart the server.'));
      document.getElementById('g_id_signin_container').appendChild(fallback);
    }
  }

  // Google credential callback
  async function handleGoogleCredential(response) {
    try {
      const res = await fetch('/auth/google', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ credential: response.credential })
      });
      if (res.ok) {
        const data = await res.json();
        // redirect to success page
        document.open();
        document.write(`<html><head><meta charset="utf-8"><title>Success</title><link rel="stylesheet" href="/css/style.css"></head><body><%- include('partials/header') %><div class="success-box"><h2>Registration Successful 🎉</h2><p>Thanks, ${data.name}! An email has been sent to ${data.email}.</p><p><a href="/locations">Explore Locations</a></p></div><script>setTimeout(()=>location.href='/locations',3000)</script></body></html>`);
        document.close();
      } else {
        alert('Google sign-in failed');
      }
    } catch (err) {
      console.error(err);
      alert('Google sign-in error');
    }
  }

  // AI Chatbox (simple)
  function createChatbox() {
    if (document.querySelector('.chatbox')) return;
    const box = document.createElement('div');
    box.className = 'chatbox';
    box.innerHTML = `
      <header><span>TripSync Chat</span><button id="chatClose">X</button></header>
      <div class="messages" id="chatMessages"></div>
      <div class="input">
        <input id="chatInput" placeholder="Ask about locations, registration..." />
        <button id="chatSend">Send</button>
      </div>
    `;
    document.body.appendChild(box);
    document.getElementById('chatClose').addEventListener('click', () => box.remove());
    const send = async () => {
      const input = document.getElementById('chatInput');
      const text = input.value.trim();
      if (!text) return;
      const msgBox = document.getElementById('chatMessages');
      const userMsg = document.createElement('div'); userMsg.className = 'msg user'; userMsg.textContent = text;
      msgBox.appendChild(userMsg);
      input.value = '';
      const res = await fetch('/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: text }) });
      const data = await res.json();
      const bot = document.createElement('div'); bot.className = 'msg bot'; bot.textContent = data.reply;
      msgBox.appendChild(bot);
      msgBox.scrollTop = msgBox.scrollHeight;
    };
    document.getElementById('chatSend').addEventListener('click', send);
    document.getElementById('chatInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  }
  createChatbox(); // add chatbox on load
});
