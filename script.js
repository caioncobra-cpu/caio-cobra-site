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
  const raw = String(value);
  const d = new Date(raw.includes('T') ? raw : raw + 'T12:00:00');
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

  const articleRoot = document.getElementById('article-root');
  const isArticlePage = Boolean(articleRoot);

  if (!isArticlePage) {
    document.title = currentLanguage === 'en' ? s.page_title_en : s.page_title_pt;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = currentLanguage === 'en' ? s.meta_description_en : s.meta_description_pt;
  }

  const siteLogo = document.getElementById('site-logo');
  if (siteLogo) siteLogo.textContent = s.site_name;

  const footerName = document.getElementById('footer-name');
  if (footerName) footerName.textContent = s.hero?.name || s.site_name;

  const nav = document.getElementById('main-nav');
  if (nav) {
    const navItems = [
      ['#direcao','directing'], ['#escrita','writing'], ['#textos','texts'],
      ['#imprensa','press'], ['#sobre','about'], ['#contato','contact']
    ];
    nav.innerHTML = navItems.map(([href,key]) =>
      `<a href="${href}">${esc(pick(s.nav,key))}</a>`).join('');
  }

  const hero = document.getElementById('hero-content');
  if (hero) {
    hero.innerHTML = `
      <p class="eyebrow">${esc(pick(s.hero,'eyebrow'))}</p>
      <h1>${esc(s.hero.name)}</h1>
      <p class="hero-text">${esc(pick(s.hero,'subtitle'))}</p>
      <a class="button" href="#direcao">${esc(pick(s.hero,'button'))}</a>`;
  }

  const f = DATA.films;
  const filmsHeading = document.getElementById('films-heading');
  const filmsList = document.getElementById('films-list');
  if (f && filmsHeading && filmsList) {
    filmsHeading.innerHTML =
      `<p class="eyebrow">${esc(pick(f,'eyebrow'))}</p><h2>${esc(pick(f,'title'))}</h2>`;

    filmsList.innerHTML = (f.items || []).map(item => {
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
  }

  const w = DATA.writing;
  const writingHeading = document.getElementById('writing-heading');
  const writingList = document.getElementById('writing-list');
  if (w && writingHeading && writingList) {
    writingHeading.innerHTML =
      `<p class="eyebrow">${esc(pick(w,'eyebrow'))}</p><h2>${esc(pick(w,'title'))}</h2>`;
    writingList.innerHTML = (w.items || []).map(item => `
      <article class="book">
        <div class="book-cover"><img src="${esc(item.cover)}" alt="${esc(item.title)}"></div>
        <div class="book-copy">
          <p class="meta">${esc(item.meta)}</p>
          <h3>${esc(item.title)}</h3>
          <p>${esc(pick(item,'description'))}</p>
          <a class="button button-small" href="${esc(item.url)}" target="_blank" rel="noopener">${esc(pick(item,'button'))}</a>
        </div>
      </article>`).join('');
  }

  const t = DATA.texts;
  const textsHeading = document.getElementById('texts-heading');
  const textsIntro = document.getElementById('texts-intro');
  const textsList = document.getElementById('texts-list');
  if (t && textsHeading && textsIntro && textsList) {
    textsHeading.innerHTML =
      `<p class="eyebrow">${esc(pick(t,'eyebrow'))}</p><h2>${esc(pick(t,'title'))}</h2>`;
    textsIntro.innerHTML = `<p>${esc(pick(t,'intro'))}</p>`;
    const published = (t.items || []).filter(x => x.publicado !== false)
      .sort((a,b)=>(b.data||'').localeCompare(a.data||''));

    textsList.innerHTML = published.length ? published.map(item => {
      const title = currentLanguage === 'en' && item.titulo_en ? item.titulo_en : item.titulo_pt;
      const resumo = currentLanguage === 'en' && item.resumo_en ? item.resumo_en : item.resumo_pt;
      return `<article class="editorial-card">
        <p class="meta">${esc(fmtDate(item.data))}</p>
        <h3>${esc(title)}</h3>
        <p>${esc(resumo)}</p>
        <a class="text-link" href="textos/texto.html?id=${encodeURIComponent(item.id)}">${currentLanguage==='en'?'Read text ↗':'Ler texto ↗'}</a>
      </article>`;
    }).join('') : `<p class="texts-empty">${currentLanguage==='en'?'No texts published yet.':'Nenhum texto publicado ainda.'}</p>`;
  }

  const p = DATA.press;
  const pressHeading = document.getElementById('press-heading');
  const pressList = document.getElementById('press-list');
  if (p && pressHeading && pressList) {
    pressHeading.innerHTML =
      `<p class="eyebrow">${esc(pick(p,'eyebrow'))}</p><h2>${esc(pick(p,'title'))}</h2>`;
    pressList.innerHTML = (p.items || []).map(item => `
      <a href="${esc(item.url)}" target="_blank" rel="noopener">
        <span>${esc(item.source)}</span><strong>${esc(pick(item,'title'))}</strong><b>↗</b>
      </a>`).join('');
  }

  const a = DATA.about;
  const aboutHeading = document.getElementById('about-heading');
  const aboutPortrait = document.getElementById('about-portrait');
  const aboutCopy = document.getElementById('about-copy');
  if (a && aboutHeading && aboutPortrait && aboutCopy) {
    aboutHeading.innerHTML =
      `<p class="eyebrow">${esc(a.eyebrow)}</p><h2>${esc(pick(a,'title'))}</h2>`;
    aboutPortrait.innerHTML =
      `<img src="${esc(a.portrait)}" alt="${esc(s.hero.name)}">`;
    aboutCopy.innerHTML = (a.paragraphs || [])
      .map(x => `<p>${esc(currentLanguage==='en' ? x.en : x.pt)}</p>`).join('');
  }

  const c = DATA.contact;
  const contact = document.getElementById('contact-content');
  if (c && contact) {
    contact.innerHTML = `
      <p class="eyebrow">${esc(pick(c,'eyebrow'))}</p>
      <p>${esc(pick(c,'intro'))}</p>
      <a class="contact-mail" href="mailto:${esc(c.email)}">${esc(c.email)}</a>
      <div class="socials">${(c.links||[]).map(l =>
        `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('')}</div>`;
  }

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
  const shareLabel = currentLanguage === 'en' ? 'Share' : 'Compartilhar';
  const copyLabel = currentLanguage === 'en' ? 'Copy link' : 'Copiar link';
  const articleImage = (item.imagem || '').trim()
    ? `<figure class="article-image"><img src="${esc(item.imagem)}" alt="${esc(title)}"></figure>`
    : '';

  root.innerHTML = `<section class="article-header"><div class="article-header-inner">
    <a class="back-link" href="../index.html#textos">${currentLanguage==='en'?'← Back to Texts':'← Voltar para Textos'}</a>
    <p class="eyebrow">${esc(fmtDate(item.data))}</p>
    <h1>${esc(title)}</h1><p class="article-deck">${esc(resumo)}</p>
  </div></section>${articleImage}<article class="article-body">${paragraphs}
    <div class="article-share">
      <p class="article-share-label">${shareLabel}</p>
      <div class="article-share-actions">
        <button class="article-share-button" id="article-share-btn" type="button">${shareLabel} ↗</button>
        <button class="article-copy-button" id="article-copy-btn" type="button">${copyLabel}</button>
      </div>
      <p class="article-share-feedback" id="article-share-feedback" aria-live="polite"></p>
    </div>
  </article>`;

  bindArticleShare(title);
}

async function copyArticleLink() {
  const url = window.location.href;
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(url);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = url;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

function bindArticleShare(title) {
  const shareButton = document.getElementById('article-share-btn');
  const copyButton = document.getElementById('article-copy-btn');
  const feedback = document.getElementById('article-share-feedback');
  if (!shareButton || !copyButton) return;

  const setFeedback = (message) => {
    if (!feedback) return;
    feedback.textContent = message;
    window.clearTimeout(setFeedback.timeoutId);
    setFeedback.timeoutId = window.setTimeout(() => { feedback.textContent = ''; }, 2600);
  };

  shareButton.addEventListener('click', async () => {
    const shareData = {
      title: `${title} — ${DATA.settings.hero.name}`,
      text: title,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }

    try {
      await copyArticleLink();
      setFeedback(currentLanguage === 'en' ? 'Link copied.' : 'Link copiado.');
    } catch (err) {
      console.error(err);
      setFeedback(currentLanguage === 'en' ? 'Could not copy the link.' : 'Não foi possível copiar o link.');
    }
  });

  copyButton.addEventListener('click', async () => {
    try {
      await copyArticleLink();
      setFeedback(currentLanguage === 'en' ? 'Link copied.' : 'Link copiado.');
    } catch (err) {
      console.error(err);
      setFeedback(currentLanguage === 'en' ? 'Could not copy the link.' : 'Não foi possível copiar o link.');
    }
  });
}

loadAll().catch(err => {
  console.error(err);
  document.body.insertAdjacentHTML('beforeend',
    '<div style="position:fixed;bottom:10px;left:10px;background:#300;color:white;padding:10px;z-index:9999">Erro ao carregar conteúdo.</div>');
});
