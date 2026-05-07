/* ============================================================
   CLUN. — Main JS
   3D parallax · Scroll animations · Chat agent · WhatsApp form
   ============================================================ */

const WA = '17875994838';

/* ── Nav on scroll ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

/* ── Scroll fade-up (hero fires immediately, rest on scroll) ── */
const observer = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
  }),
  { threshold: 0.08 }
);
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
document.querySelectorAll('.hero .fade-up').forEach((el, i) => {
  setTimeout(() => el.classList.add('visible'), 120 + i * 130);
});

/* ── Smooth anchor scroll ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  });
});

/* ── 3D Cloud Parallax ── */
const cloud3d = document.getElementById('cloud3d');
if (cloud3d) {
  let rotX = 0, rotY = 0, tX = 0, tY = 0, timer;
  document.addEventListener('mousemove', e => {
    const nx = (e.clientX / window.innerWidth  - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    tX = ny * -16; tY = nx * 16;
    clearTimeout(timer);
    timer = setTimeout(() => { tX = 0; tY = 0; }, 3500);
  });
  document.addEventListener('touchmove', e => {
    const t = e.touches[0];
    tX = ((t.clientY / window.innerHeight) - 0.5) * -20;
    tY = ((t.clientX / window.innerWidth)  - 0.5) *  20;
  }, { passive: true });
  (function tick() {
    rotX += (tX - rotX) * 0.055;
    rotY += (tY - rotY) * 0.055;
    cloud3d.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    requestAnimationFrame(tick);
  })();
}

/* ── Contact form → WhatsApp ── */
const form       = document.getElementById('contactForm');
const successBox = document.getElementById('formSuccess');
const submitBtn  = document.getElementById('submitBtn');

if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.name.value.trim(), business = form.business.value.trim(),
          phone = form.phone.value.trim(), interest = form.interest.value.trim(),
          message = form.message.value.trim();
    let valid = true;
    [{ el: form.name, v: name }, { el: form.phone, v: phone }, { el: form.interest, v: interest }]
      .forEach(({ el, v }) => { if (!v) { el.classList.add('error'); if (valid) { el.focus(); valid = false; } } });
    if (!valid) return;
    const lines = [
      `👋 Hello, I'm ${name}${business ? ` from ${business}` : ''}.`,
      `📱 My number: ${phone}`,
      `🎯 I need: ${interest}`,
      message ? `💬 ${message}` : null,
      `\n— Sent from clun.co`,
    ].filter(Boolean).join('\n');
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;
    setTimeout(() => {
      form.style.display = 'none';
      successBox.hidden = false;
      window.open(`https://wa.me/${WA}?text=${encodeURIComponent(lines)}`, '_blank', 'noopener');
    }, 700);
  });
  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', () => el.classList.remove('error'));
  });
}

/* ════════════════════════════════════
   CHAT AGENT
════════════════════════════════════ */

const chatTrigger  = document.getElementById('chatTrigger');
const chatPanel    = document.getElementById('chatPanel');
const chatClose    = document.getElementById('chatClose');
const chatMessages = document.getElementById('chatMessages');
const chatReplies  = document.getElementById('chatQuickReplies');
const chatInputRow = document.getElementById('chatInputRow');
const chatInput    = document.getElementById('chatInput');
const chatSend     = document.getElementById('chatSend');

let chatOpen = false;
let chatState = 'idle';   // tracks conversation stage
let userName  = '';

/* Open / close */
chatTrigger.addEventListener('click', () => toggleChat(true));
chatClose.addEventListener('click',   () => toggleChat(false));

function toggleChat(open) {
  chatOpen = open;
  chatPanel.classList.toggle('open', open);
  chatPanel.setAttribute('aria-hidden', String(!open));
  if (open && chatState === 'idle') startConversation();
}

/* ── Helpers ── */
function scrollBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addTyping() {
  const el = document.createElement('div');
  el.className = 'chat-typing';
  el.innerHTML = '<span></span><span></span><span></span>';
  chatMessages.appendChild(el);
  scrollBottom();
  return el;
}

function removeTyping(el) { el?.remove(); }

function addMsg(text, role = 'bot') {
  const el = document.createElement('div');
  el.className = `chat-msg chat-msg--${role}`;
  el.innerHTML = text;
  chatMessages.appendChild(el);
  scrollBottom();
  return el;
}

function addLinkMsg(label, href) {
  const el = document.createElement('div');
  el.className = 'chat-msg chat-msg--link';
  el.innerHTML = `<a href="${href}" target="_blank" rel="noopener">${label} →</a>`;
  chatMessages.appendChild(el);
  scrollBottom();
}

function setReplies(options) {
  chatReplies.innerHTML = '';
  options.forEach(({ label, action }) => {
    const btn = document.createElement('button');
    btn.className = 'chat-reply-btn';
    btn.textContent = label;
    btn.addEventListener('click', () => action(label));
    chatReplies.appendChild(btn);
  });
}

function clearReplies() { chatReplies.innerHTML = ''; }

/* Sends a bot message after a typing delay */
function botSay(text, delay = 900) {
  return new Promise(resolve => {
    const typing = addTyping();
    setTimeout(() => {
      removeTyping(typing);
      addMsg(text);
      resolve();
    }, delay);
  });
}

/* Show / hide free-text input */
function showInput(placeholder = 'Type your answer…') {
  chatInputRow.classList.remove('hidden');
  chatInput.placeholder = placeholder;
  chatInput.value = '';
  chatInput.focus();
}
function hideInput() {
  chatInputRow.classList.add('hidden');
  chatInput.value = '';
}

/* ── Conversation flows ── */

async function startConversation() {
  chatState = 'greeting';
  hideInput();
  await botSay('Hello. I\'m CLUN\'s assistant.', 800);
  await botSay('How can I help you today?', 1000);
  chatState = 'main_menu';
  setReplies([
    { label: 'What is digital presence?', action: flowLearn },
    { label: 'Start a project',           action: flowStart },
    { label: 'Talk to the team',          action: flowStart },
  ]);
}

async function flowLearn(label) {
  clearReplies();
  addMsg(label, 'user');
  chatState = 'learn';
  await botSay('Digital presence is the complete image your business projects online — every search result, every first impression, every touchpoint.', 1200);
  await botSay('It\'s the difference between being found<br>and being <em>chosen</em>.', 1000);
  setReplies([
    { label: 'Tell me more',    action: flowLearnMore },
    { label: 'Start a project', action: flowStart },
  ]);
}

async function flowLearnMore(label) {
  clearReplies();
  addMsg(label, 'user');
  await botSay('We work closely with each client to understand their business, their audience, and their ambitions.', 1300);
  await botSay('Then we build the digital presence that attracts exactly who they\'re looking for — with precision and intention.', 1400);
  setReplies([
    { label: 'I\'m ready to start', action: flowStart },
    { label: 'Get in touch',        action: flowStart },
  ]);
}

async function flowStart(label) {
  clearReplies();
  addMsg(label, 'user');
  chatState = 'name_capture';
  await botSay('Perfect. To connect you with our team I just need a couple of details.', 1000);
  await botSay('What\'s your name?', 700);
  showInput('Your name…');
}

async function handleNameSubmit(value) {
  if (!value.trim()) return;
  userName = value.trim();
  hideInput();
  addMsg(userName, 'user');
  chatState = 'phone_capture';
  await botSay(`Nice to meet you, ${userName.split(' ')[0]}. What\'s your WhatsApp number?`, 1000);
  showInput('+1 (787) 000-0000');
}

async function handlePhoneSubmit(value) {
  if (!value.trim()) return;
  const phone = value.trim();
  hideInput();
  addMsg(phone, 'user');
  chatState = 'complete';
  await botSay('Got it — connecting you with the CLUN team now.', 1000);
  const waText = encodeURIComponent(
    `👋 Hi, I'm ${userName}.\n📱 My number: ${phone}\n\n— Sent via CLUN chat`
  );
  addLinkMsg('Open WhatsApp', `https://wa.me/${WA}?text=${waText}`);
  window.open(`https://wa.me/${WA}?text=${waText}`, '_blank', 'noopener');
}

/* ── Input submission ── */
function submitChatInput() {
  const val = chatInput.value.trim();
  if (!val) return;
  if (chatState === 'name_capture')  { handleNameSubmit(val);  return; }
  if (chatState === 'phone_capture') { handlePhoneSubmit(val); return; }
}

chatSend.addEventListener('click', submitChatInput);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitChatInput(); });
