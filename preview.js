const samples = [
  {
    id: 'muestra-01', name: 'Sombra mineral', family: 'Amaderada · muestra', volume: '50 ml · muestra', price: 389000,
    description: 'Composición ficticia para revisar la ficha: maderas secas, mineralidad y una salida especiada.', notes: ['Madera seca', 'Pimienta rosa', 'Ámbar'],
    concept: '01'
  },
  {
    id: 'muestra-02', name: 'Luz de ámbar', family: 'Ámbar · muestra', volume: '50 ml · muestra', price: 429000,
    description: 'Composición ficticia para revisar la ficha: un acorde cálido con matices florales y resina.', notes: ['Azahar', 'Resina', 'Vainilla'],
    concept: '02'
  },
  {
    id: 'muestra-03', name: 'Ritual de noche', family: 'Floral · muestra', volume: '50 ml · muestra', price: 459000,
    description: 'Composición ficticia para revisar la ficha: flores oscuras, especias y un fondo amaderado.', notes: ['Rosa oscura', 'Cardamomo', 'Cedro'],
    concept: '03'
  }
];

const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const productGrid = document.querySelector('#sample-products');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#nav');
const bagDrawer = document.querySelector('.bag-drawer');
const backdrop = document.querySelector('.drawer-backdrop');
const bagBody = document.querySelector('.bag-body');
const bagTrigger = document.querySelector('.bag-trigger');
const bagClose = document.querySelector('.drawer-close');
const bagAnnouncement = document.querySelector('#bag-announcement');
const productDialog = document.querySelector('.product-dialog');
const heroImage = document.querySelector('.hero-photo img');
let bag = [];
let lastDetailTrigger = null;

const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

function renderSamples() {
  productGrid.innerHTML = samples.map((sample) => `
    <article class="sample-product">
      <button class="sample-art" type="button" data-detail="${sample.id}" aria-label="Ver detalle de ${escapeHTML(sample.name)}, producto de muestra">
        <span class="sample-art-no">${sample.concept}</span><span class="sample-art-label">Visual abstracto · muestra</span>
      </button>
      <div class="sample-meta"><div><p class="sample-kind">${escapeHTML(sample.family)}</p><h3 class="sample-name">${escapeHTML(sample.name)}</h3></div><p class="sample-price">${money.format(sample.price)} COP</p></div>
      <p class="sample-volume">${escapeHTML(sample.volume)} · precio de muestra</p>
      <div class="sample-actions"><button class="sample-action" type="button" data-add="${sample.id}">Añadir a bolsa</button><button class="sample-detail" type="button" data-detail="${sample.id}">Ver detalle</button></div>
    </article>`).join('');
  productGrid.querySelectorAll('[data-detail]').forEach((button) => button.addEventListener('click', () => openDetail(button.dataset.detail, button)));
  productGrid.querySelectorAll('[data-add]').forEach((button) => button.addEventListener('click', () => addToBag(button.dataset.add)));
}

function openDetail(id, trigger) {
  const sample = samples.find((item) => item.id === id);
  if (!sample) return;
  lastDetailTrigger = trigger;
  productDialog.setAttribute('aria-label', `Detalle del producto de muestra ${sample.name}`);
  productDialog.querySelector('.dialog-visual').textContent = sample.concept;
  productDialog.querySelector('.dialog-copy').innerHTML = `
    <span class="dialog-sample-tag">Datos conceptuales · No es catálogo real</span>
    <p class="eyebrow">${escapeHTML(sample.family)}</p><h2>${escapeHTML(sample.name)}</h2>
    <p>${escapeHTML(sample.description)}</p><p>${sample.notes.map(escapeHTML).join(' · ')}</p>
    <div class="dialog-price"><span>Precio de muestra</span><strong>${money.format(sample.price)} COP</strong></div>
    <button class="dialog-add" type="button">Añadir muestra a la bolsa</button>`;
  productDialog.querySelector('.dialog-add').addEventListener('click', () => {
    productDialog.close();
    addToBag(id);
  });
  productDialog.showModal();
}

function addToBag(id) {
  const sample = samples.find((item) => item.id === id);
  if (!sample) return;
  const current = bag.find((item) => item.id === id);
  if (current) current.quantity += 1;
  else bag.push({ id, quantity: 1 });
  renderBag();
  bagAnnouncement.textContent = `${sample.name}, muestra, se agregó a la bolsa de vista previa.`;
  openBag();
}

function changeQuantity(id, delta) {
  bag = bag.map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0);
  const current = bag.find((item) => item.id === id);
  const sample = samples.find((item) => item.id === id);
  renderBag();
  bagAnnouncement.textContent = current ? `Cantidad de muestra de ${sample.name}: ${current.quantity}.` : `${sample.name}, muestra, se quitó de la bolsa.`;
}

function removeFromBag(id) {
  const sample = samples.find((item) => item.id === id);
  bag = bag.filter((item) => item.id !== id);
  renderBag();
  bagAnnouncement.textContent = `${sample.name}, muestra, se quitó de la bolsa.`;
}

function renderBag() {
  const count = bag.reduce((total, item) => total + item.quantity, 0);
  document.querySelector('.bag-count').textContent = String(count).padStart(2, '0');
  document.querySelector('.bag-heading-count').textContent = count ? `(${String(count).padStart(2, '0')})` : '';
  bagTrigger.setAttribute('aria-label', `Abrir bolsa de vista previa, ${count} ${count === 1 ? 'muestra' : 'muestras'}`);
  if (!count) {
    bagBody.innerHTML = '<p class="bag-empty">Todavía no has añadido muestras.</p><p class="bag-warning">La bolsa solo funciona en este preview. No crea pedidos.</p>';
    return;
  }
  const rows = bag.map((item) => {
    const sample = samples.find((entry) => entry.id === item.id);
    return `<article class="bag-row"><div class="bag-thumb" aria-hidden="true">${sample.concept}</div><div><p>${escapeHTML(sample.family)}</p><h3>${escapeHTML(sample.name)}</h3><p>Precio de muestra · ${money.format(sample.price)} COP</p><div class="bag-controls"><button type="button" data-change="${sample.id}" data-delta="-1" aria-label="Quitar una muestra de ${escapeHTML(sample.name)}">−</button><span>${item.quantity}</span><button type="button" data-change="${sample.id}" data-delta="1" aria-label="Añadir una muestra de ${escapeHTML(sample.name)}">+</button></div></div><button class="bag-remove" type="button" data-remove="${sample.id}">Quitar</button></article>`;
  }).join('');
  const subtotal = bag.reduce((sum, item) => sum + samples.find((sample) => sample.id === item.id).price * item.quantity, 0);
  bagBody.innerHTML = `<div>${rows}</div><div class="bag-summary"><p class="bag-total"><span>Subtotal de muestra</span><strong>${money.format(subtotal)} COP</strong></p><p class="bag-warning">Preview: no se procesan pagos ni se envían pedidos.</p></div>`;
  bagBody.querySelectorAll('[data-change]').forEach((button) => button.addEventListener('click', () => changeQuantity(button.dataset.change, Number(button.dataset.delta))));
  bagBody.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => removeFromBag(button.dataset.remove)));
}

function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menú');
  nav.classList.remove('is-open');
}

function openBag() {
  backdrop.hidden = false;
  bagDrawer.inert = false;
  bagDrawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  requestAnimationFrame(() => {
    backdrop.classList.add('is-visible');
    bagDrawer.classList.add('is-open');
    bagClose.focus();
  });
}

function closeBag() {
  if (!bagDrawer.classList.contains('is-open')) return;
  backdrop.classList.remove('is-visible');
  bagDrawer.classList.remove('is-open');
  bagDrawer.setAttribute('aria-hidden', 'true');
  bagDrawer.inert = true;
  document.body.classList.remove('is-locked');
  bagTrigger.focus();
  window.setTimeout(() => { backdrop.hidden = true; }, 320);
}

menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Abrir menú' : 'Cerrar menú');
  nav.classList.toggle('is-open', !expanded);
});
nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
bagTrigger.addEventListener('click', openBag);
bagClose.addEventListener('click', closeBag);
backdrop.addEventListener('click', closeBag);
document.querySelector('.product-dialog-close').addEventListener('click', () => productDialog.close());
productDialog.addEventListener('close', () => lastDetailTrigger?.focus());
productDialog.addEventListener('click', (event) => { if (event.target === productDialog) productDialog.close(); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMenu();
    closeBag();
  }
  if (event.key === 'Tab' && bagDrawer.classList.contains('is-open')) {
    const focusable = [...bagDrawer.querySelectorAll('button:not(:disabled)')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});

renderSamples();
renderBag();
heroImage.addEventListener('error', () => heroImage.closest('.hero-photo').classList.add('image-error'), { once: true });
