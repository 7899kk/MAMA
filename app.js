const themeButton = document.querySelector('.theme');
let theme = 'light';
try { theme = localStorage.getItem('portfolio-theme') || 'light'; } catch {}
function setTheme(value) {
  document.body.classList.toggle('dark', value === 'dark');
  themeButton.textContent = value === 'dark' ? '☀' : '☾';
  themeButton.setAttribute('aria-label', `Switch to ${value === 'dark' ? 'light' : 'dark'} theme`);
  document.querySelector('meta[name="theme-color"]').content = value === 'dark' ? '#262626' : '#ffe44d';
}
setTheme(theme);
themeButton.addEventListener('click', () => {
  theme = document.body.classList.contains('dark') ? 'light' : 'dark';
  setTheme(theme);
  try { localStorage.setItem('portfolio-theme', theme); } catch {}
});
document.querySelector('.loader').classList.add('hidden');
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() { navigation.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }
menu.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
const chapters = [
  {title:'Head of Technology · Anvesa', description:'Production RAG pipelines, Agentic AI workflows, and cloud-native systems on Azure AKS. Serving 15+ enterprise clients across the US, India, and Australia.'},
  {title:'Aureus → Happiest Minds', description:'Founding engineer on Anvesa. Grew from full-stack engineering to leading architecture, R&D, QA, and production support through the acquisition.'},
  {title:'Cognizant · American Express', description:'Mainframe-to-.NET migration for the Global Decision Engine. Delivery across US, EMEA, and APAC markets, recognized for quality.'}
];
const popup = document.querySelector('.map-popup');
function showChapter(index) {
  document.querySelectorAll('.career-card').forEach((card, i) => {
    card.classList.toggle('active', i === index);
    card.setAttribute('aria-pressed', String(i === index));
  });
  document.querySelector('#chapter-title').textContent = chapters[index].title;
  document.querySelector('#chapter-description').textContent = chapters[index].description;
  popup.hidden = false;
}
document.querySelectorAll('.career-card').forEach(card => card.addEventListener('click', () => showChapter(Number(card.dataset.career))));
document.querySelector('.popup-close').addEventListener('click', () => { popup.hidden = true; });
let mapZoom = 1;
document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.zoom === 'reset') { mapZoom = 1; popup.hidden = true; }
  else mapZoom = Math.max(1, Math.min(2.5, mapZoom + (button.dataset.zoom === 'in' ? .3 : -.3)));
  document.querySelector('.map-canvas').style.transform = `scale(${mapZoom})`;
}));
document.querySelectorAll('.map-pin').forEach(pin => {
  pin.setAttribute('role', 'button');pin.setAttribute('tabindex', '0');
  pin.setAttribute('aria-label', `Client reach: ${pin.querySelector('span').textContent}`);
  pin.addEventListener('click', () => showChapter(0));
  pin.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault();showChapter(0); } });
});
const dialog = document.querySelector('#terminal-dialog');
const output = document.querySelector('.terminal-output');
const commandInput = document.querySelector('#terminal-input');
document.querySelector('#open-terminal').addEventListener('click', () => { dialog.showModal();commandInput.focus(); });
document.querySelector('#close-terminal').addEventListener('click', () => dialog.close());
document.querySelector('.terminal-form').addEventListener('submit', event => {
  event.preventDefault();
  const command = commandInput.value.trim().toLowerCase();
  commandInput.value = '';
  const replies = {help:'Commands: about, work, skills, contact, theme, clear, exit',about:'Ashok Kunchala — Head of Technology at Anvesa. Enterprise AI architect. 13+ years building production systems.',work:'Anvesa: AI-native eDiscovery. 15+ enterprise clients across the US, India, and Australia.',skills:'Agentic AI · RAG · Azure · .NET Core · Angular · SQL Server · Kubernetes',contact:'Use the Email contact card to open the contact form.\nLinkedIn: linkedin.com/in/ashok-kumar-kunchala'};
  if (command === 'exit') { dialog.close();return; }
  if (command === 'clear') { output.textContent = '';return; }
  if (command === 'theme') themeButton.click();
  output.textContent += `\n\n$ ${command}\n${command === 'theme' ? 'Theme switched.' : replies[command] || 'Unknown command. Type help.'}`;
  output.scrollTop = output.scrollHeight;
});
document.querySelector('#year').textContent = new Date().getFullYear();
const mapCanvas = document.querySelector('.map-canvas');
let mapPanX = 0, mapPanY = 0, dragStart = null;
function updateMapTransform() { mapCanvas.style.transform = `translate(${mapPanX}px, ${mapPanY}px) scale(${mapZoom})`; }
mapCanvas.addEventListener('pointerdown', event => {
  if (event.target.closest('.map-pin')) return;
  dragStart = {x:event.clientX-mapPanX, y:event.clientY-mapPanY};
  mapCanvas.setPointerCapture(event.pointerId);mapCanvas.classList.add('dragging');
});
mapCanvas.addEventListener('pointermove', event => {
  if (!dragStart) return;
  const limitX = mapCanvas.clientWidth * .3, limitY = mapCanvas.clientHeight * .3;
  mapPanX = Math.max(-limitX, Math.min(limitX, event.clientX-dragStart.x));
  mapPanY = Math.max(-limitY, Math.min(limitY, event.clientY-dragStart.y));
  updateMapTransform();
});
function endMapDrag() { dragStart = null; mapCanvas.classList.remove('dragging'); }
mapCanvas.addEventListener('pointerup', endMapDrag);mapCanvas.addEventListener('pointercancel', endMapDrag);
document.querySelector('[data-zoom="reset"]').addEventListener('click', () => { mapPanX=0;mapPanY=0;updateMapTransform(); });
const journalDialog = document.querySelector('#journal-dialog');
const projectDialog = document.querySelector('#project-dialog');
document.querySelectorAll('[data-open-journal]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();closeMenu();journalDialog.showModal();
}));
document.querySelectorAll('[data-open-project]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();projectDialog.showModal();
}));
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('.content-dialog').forEach(dialog => dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
}));
const contactDialog = document.querySelector('#contact-dialog');
const contactForm = document.querySelector('#contact-form');
const contactStatus = document.querySelector('#contact-status');
const contactSubmit = contactForm.querySelector('button[type="submit"]');
let contactServiceChecked = false;
async function checkContactService() {
  if (contactServiceChecked) return;
  contactServiceChecked = true;
  try {
    const response = await fetch('api/contact', {headers: {Accept: 'application/json'}, signal: AbortSignal.timeout(5000)});
    if (!response.ok) throw new Error('Unavailable');
    const service = await response.json();
    if (!service.configured) throw new Error('Unavailable');
  } catch {
    contactStatus.textContent = 'The contact form is temporarily unavailable. You can connect with me on LinkedIn.';
  }
}
document.querySelectorAll('[data-open-contact]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();closeMenu();contactDialog.showModal();checkContactService();
}));
contactForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  contactSubmit.disabled = true;contactSubmit.textContent = 'Sending…';contactStatus.textContent = '';
  try {
    const response = await fetch('api/contact', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify(Object.fromEntries(new FormData(contactForm))), signal: AbortSignal.timeout(25000)
    });
    let result;
    try {result = await response.json();} catch {throw new Error('The contact form is temporarily unavailable. Please connect on LinkedIn.');}
    if (!response.ok || result.ok !== true) throw new Error(result.error || 'Your message could not be sent. Please try again.');
    contactStatus.textContent = result.message;contactForm.reset();
  } catch (error) {
    contactStatus.textContent = error.name === 'TimeoutError' ? 'Sending timed out. Please try again later.' : error.message;
  } finally {contactSubmit.disabled = false;contactSubmit.textContent = 'Send message';}
});
