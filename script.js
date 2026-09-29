const DATA = {};
let currentLanguage = localStorage.getItem('caio-cobra-lang') || 'pt';

const esc = (v='') => String(v)
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');

function pick(obj, base) {
  return obj?.[`${base}_${currentLanguage}`] ?? obj?.[`${base}_pt`] ?? '';
}
function fmtDate(value) {
  if (!value) return '';
  const d = new Date(value + 'T12:00:00');
  return new Intl.DateTimeFormat(currentLanguage === 'en' ? 'en-US' : 'pt-BR', {
    day:'2-digit', month:'long', year:'numeric'
  }).format(d);
}
async function getJSON(path) {
  const r = await fetch(path, {cache:'no-store'});
  if (!r.ok) throw new Error(path);
  return r.json();
}

async function loadAll() {
  const base = document.body.dataset.base || '';
  const files = ['settings','films','writing','texts','press','about','contact'];
  const values = await Promise.all(files.map(f => getJSON(`${base}data/${f}.json`)));
  files.forEach((f,i) => DATA[f] = values[i]);
  render();
}

function render() {
  const s = DATA.settings;
  if (!s) return;

  document.documentElement.lang = currentLanguage === 'en' ? 'en' : 'pt-BR';
  document.title = currentLanguage === 'en' ? s.page_title_en : s.page_title_pt;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.content = currentLanguage === 'en' ? s.meta_description_en : s.meta_description_pt;

  document.getElementById('site-logo').textContent = s.site_name;
  document.getElementById('footer-name').textContent = s.hero?.name || s.site_name;

  const navItems = [
    ['#direcao','directing'], ['#escrita','writing'], ['#textos','texts'],
    ['#imprensa','press'], ['#sobre','about'], ['#contato','contact']
  ];
  document.getElementById('main-nav').innerHTML = navItems.map(([href,key]) =>
    `<a href="${href}">${esc(pick(s.nav,key))}</a>`).join('');

  document.getElementById('hero-content').innerHTML = `
    <p class="eyebrow">${esc(pick(s.hero,'eyebrow'))}</p>
    <h1>${esc(s.hero.name)}</h1>
    <p class="hero-text">${esc(pick(s.hero,'subtitle'))}</p>
    <a class="button" href="#direcao">${esc(pick(s.hero,'button'))}</a>`;

  const f = DATA.films;
  document.getElementById('films-heading').innerHTML =
    `<p class="eyebrow">${esc(pick(f,'eyebrow'))}</p><h2>${esc(pick(f,'title'))}</h2>`;
  document.getElementById('films-list').innerHTML = (f.items || []).map(item => {
    const hasTrailer = Boolean((item.trailer || '').trim());
    const poster = hasTrailer
      ? `<a class="poster-link" href="${esc(item.trailer)}" target="_blank" rel="noopener">
          <img src="${esc(item.poster)}" alt="${esc(item.title)}">
          <span class="watch">${currentLanguage==='en'?'Watch trailer ↗':'Ver trailer ↗'}</span>
        </a>`
      : `<div class="poster-link no-link">
          <img src="${esc(item.poster)}" alt="${esc(item.title)}">
        </div>`;

    const buttonText = pick(item,'button') || (currentLanguage === 'en' ? 'Watch trailer ↗' : 'Ver trailer ↗');
    const trailerLink = hasTrailer
      ? `<a class="text-link" href="${esc(item.trailer)}" target="_blank" rel="noopener">${esc(buttonText)}</a>`
      : '';

    return `<article class="film-card">
      ${poster}
      <div class="film-info">
        <p class="meta">${esc(pick(item,'type'))} · ${esc(item.year)}</p>
        <h3>${esc(item.title)}</h3>
        ${trailerLink}
      </div>
    </article>`;
  }).join('');

  const w = DATA.writing;
  document.getElementById('writing-heading').innerHTML =
    `<p class="eyebrow">${esc(pick(w,'eyebrow'))}</p><h2>${esc(pick(w,'title'))}</h2>`;
  document.getElementById('writing-list').innerHTML = (w.items || []).map(item => `
    <article class="book">
      <div class="book-cover"><img src="${esc(item.cover)}" alt="${esc(item.title)}"></div>
      <div class="book-copy">
        <p class="meta">${esc(item.meta)}</p>
        <h3>${esc(item.title)}</h3>
        <p>${esc(pick(item,'description'))}</p>
        <a class="button button-small" href="${esc(item.url)}" target="_blank" rel="noopener">${esc(pick(item,'button'))}</a>
      </div>
    </article>`).join('');

  const t = DATA.texts;
  document.getElementById('texts-heading').innerHTML =
    `<p class="eyebrow">${esc(pick(t,'eyebrow'))}</p><h2>${esc(pick(t,'title'))}</h2>`;
  document.getElementById('texts-intro').innerHTML = `<p>${esc(pick(t,'intro'))}</p>`;
  const published = (t.items || []).filter(x => x.publicado !== false)
    .sort((a,b)=>(b.data||'').localeCompare(a.data||''));
  document.getElementById('texts-list').innerHTML = published.length ? published.map(item => {
    const title = currentLanguage === 'en' && item.titulo_en ? item.titulo_en : item.titulo_pt;
    const resumo = currentLanguage === 'en' && item.resumo_en ? item.resumo_en : item.resumo_pt;
    return `<article class="editorial-card">
      <p class="meta">${esc(fmtDate(item.data))}</p>
      <h3>${esc(title)}</h3>
      <p>${esc(resumo)}</p>
      <a class="text-link" href="textos/texto.html?id=${encodeURIComponent(item.id)}">${currentLanguage==='en'?'Read text ↗':'Ler texto ↗'}</a>
    </article>`;
  }).join('') : `<p class="texts-empty">${currentLanguage==='en'?'No texts published yet.':'Nenhum texto publicado ainda.'}</p>`;

  const p = DATA.press;
  document.getElementById('press-heading').innerHTML =
    `<p class="eyebrow">${esc(pick(p,'eyebrow'))}</p><h2>${esc(pick(p,'title'))}</h2>`;
  document.getElementById('press-list').innerHTML = (p.items || []).map(item => `
    <a href="${esc(item.url)}" target="_blank" rel="noopener">
      <span>${esc(item.source)}</span><strong>${esc(pick(item,'title'))}</strong><b>↗</b>
    </a>`).join('');

  const a = DATA.about;
  document.getElementById('about-heading').innerHTML =
    `<p class="eyebrow">${esc(a.eyebrow)}</p><h2>${esc(pick(a,'title'))}</h2>`;
  document.getElementById('about-portrait').innerHTML =
    `<img src="${esc(a.portrait)}" alt="${esc(s.hero.name)}">`;
  document.getElementById('about-copy').innerHTML = (a.paragraphs || [])
    .map(x => `<p>${esc(currentLanguage==='en' ? x.en : x.pt)}</p>`).join('');

  const c = DATA.contact;
  document.getElementById('contact-content').innerHTML = `
    <p class="eyebrow">${esc(pick(c,'eyebrow'))}</p>
    <p>${esc(pick(c,'intro'))}</p>
    <a class="contact-mail" href="mailto:${esc(c.email)}">${esc(c.email)}</a>
    <div class="socials">${(c.links||[]).map(l =>
      `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('')}</div>`;

  document.querySelectorAll('.lang-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.langSelect === currentLanguage));

  bindMenuLinks();
  renderArticle();
}

function bindMenuLinks() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    document.querySelector('.menu-toggle')?.setAttribute('aria-expanded','false');
  }));
}

function setLanguage(lang) {
  currentLanguage = lang === 'en' ? 'en' : 'pt';
  localStorage.setItem('caio-cobra-lang', currentLanguage);
  render();
}
document.querySelectorAll('[data-lang-select]').forEach(btn =>
  btn.addEventListener('click', () => setLanguage(btn.dataset.langSelect)));

const menuButton = document.querySelector('.menu-toggle');
const nav = document.getElementById('main-nav');
if (menuButton && nav) {
  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

function renderArticle() {
  const root = document.getElementById('article-root');
  if (!root || !DATA.texts) return;
  const id = new URLSearchParams(location.search).get('id');
  const item = (DATA.texts.items || []).find(x => String(x.id) === String(id) && x.publicado !== false);
  if (!item) {
    root.innerHTML = `<section class="article-header"><div class="article-header-inner">
      <a class="back-link" href="../index.html#textos">${currentLanguage==='en'?'← Back to Texts':'← Voltar para Textos'}</a>
      <h1>${currentLanguage==='en'?'Text not found':'Texto não encontrado'}</h1>
    </div></section>`;
    return;
  }
  const title = currentLanguage==='en' && item.titulo_en ? item.titulo_en : item.titulo_pt;
  const resumo = currentLanguage==='en' && item.resumo_en ? item.resumo_en : item.resumo_pt;
  const content = currentLanguage==='en' && item.conteudo_en ? item.conteudo_en : item.conteudo_pt;
  document.title = `${title} — ${DATA.settings.hero.name}`;
  const paragraphs = String(content || '').split(/\n\s*\n/).filter(Boolean)
    .map(p => `<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('');
  root.innerHTML = `<section class="article-header"><div class="article-header-inner">
    <a class="back-link" href="../index.html#textos">${currentLanguage==='en'?'← Back to Texts':'← Voltar para Textos'}</a>
    <p class="eyebrow">${esc(fmtDate(item.data))}</p>
    <h1>${esc(title)}</h1><p class="article-deck">${esc(resumo)}</p>
  </div></section><article class="article-body">${paragraphs}</article>`;
}

loadAll().catch(err => {
  console.error(err);
  document.body.insertAdjacentHTML('beforeend',
    '<div style="position:fixed;bottom:10px;left:10px;background:#300;color:white;padding:10px;z-index:9999">Erro ao carregar conteúdo.</div>');
});
