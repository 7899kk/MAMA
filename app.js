const themeButton = document.querySelector('.theme');
let theme = 'light';
try { theme = localStorage.getItem('portfolio-theme') || 'light'; } catch {}
function setTheme(value) {
  document.body.classList.toggle('dark', value === 'dark');
  themeButton.textContent = value === 'dark' ? '☀' : '☾';
  themeButton.setAttribute('aria-label', `Switch to ${value === 'dark' ? 'light' : 'dark'} theme`);
  document.querySelector('meta[name="theme-color"]').content = value === 'dark' ? '#24282c' : '#ffe34d';
}
setTheme(theme);
themeButton.addEventListener('click', () => {
  theme = document.body.classList.contains('dark') ? 'light' : 'dark';
  setTheme(theme);
  try { localStorage.setItem('portfolio-theme', theme); } catch {}
});
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
  { tag: 'CHAPTER 03', title: 'From architecture to impact.', description: 'At Anvesa, I design RAG pipelines, Agentic AI workflows, and Azure AKS systems that run in production every day.' },
  { tag: 'CHAPTER 02', title: 'A founding engineer’s story.', description: 'Seven years building Anvesa from the ground up. From full-stack engineering to leading architecture, R&D, QA, and production support through the Happiest Minds acquisition.' },
  { tag: 'CHAPTER 01', title: 'Where the journey began.', description: 'Batch Topper at Cognizant’s Learning Academy. Working on the American Express Global Decision Engine taught me to deliver reliable .NET systems across US, EMEA, and APAC markets.' }
];
document.querySelectorAll('.career-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.career-card').forEach(item => {
      item.classList.toggle('active', item === card);
      item.setAttribute('aria-pressed', String(item === card));
    });
    const chapter = chapters[Number(card.dataset.career)];
    document.querySelector('.map-detail .tag').textContent = chapter.tag;
    document.querySelector('#chapter-title').textContent = chapter.title;
    document.querySelector('#chapter-description').textContent = chapter.description;
  });
});
document.querySelector('.contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const subject = `Portfolio inquiry from ${data.get('name')}`;
  const body = `Hi Ashok,\n\n${data.get('message')}\n\nFrom: ${data.get('name')}\nEmail: ${data.get('email')}${data.get('company') ? `\nCompany: ${data.get('company')}` : ''}`;
  const emailUrl = `mailto:ashok@ashokkunchala.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const status = document.querySelector('#form-status');
  status.textContent = 'Your email draft is ready. ';
  const draftLink = document.createElement('a');
  draftLink.href = emailUrl;
  draftLink.textContent = 'Open your email app to send it →';
  draftLink.className = 'draft-link';
  status.append(draftLink);
});
document.querySelector('#year').textContent = new Date().getFullYear();
let mapZoom = 1;
document.querySelectorAll('[data-zoom]').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.zoom === 'reset') mapZoom = 1;
    else mapZoom = Math.max(1, Math.min(2.5, mapZoom + (button.dataset.zoom === 'in' ? .3 : -.3)));
    document.querySelector('.map-canvas').style.transform = `scale(${mapZoom})`;
  });
});
