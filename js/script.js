const store = window.ADARA_STORE || { brand: 'ADARA PARFUM', currency: 'COP', locale: 'es-CO' };
const seenProductIds = new Set();
const products = (window.ADARA_PRODUCTS || []).filter((product) => {
  if (!isValidProduct(product) || seenProductIds.has(product.id)) return false;
  seenProductIds.add(product.id);
  return true;
});
const cartKey = 'adara-parfum-cart-v1';
const money = new Intl.NumberFormat(store.locale, { style: 'currency', currency: store.currency, maximumFractionDigits: 0 });

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.primary-nav');
const cartButton = document.querySelector('.cart-trigger');
const cartDrawer = document.querySelector('.cart-drawer');
const cartBackdrop = document.querySelector('.cart-backdrop');
const cartClose = document.querySelector('.cart-close');
const cartContent = document.querySelector('.cart-content');
const cartAnnouncement = document.querySelector('#cart-announcement');
const productGrid = document.querySelector('#product-grid');
const catalogToolbar = document.querySelector('.catalog-toolbar');
const catalogStatus = document.querySelector('#catalog-status');
const searchInput = document.querySelector('#product-search');
const familySelect = document.querySelector('#product-family');
const sortSelect = document.querySelector('#product-sort');
const productDialog = document.querySelector('.product-dialog');
let lastDialogTrigger = null;

function isValidProduct(product) {
  return product && typeof product.id === 'string' && typeof product.name === 'string' &&
    typeof product.priceCOP === 'number' && Number.isInteger(product.priceCOP) && product.priceCOP >= 0 &&
    typeof product.volume === 'string' && typeof product.description === 'string' &&
    ['available', 'sold-out'].includes(product.availability);
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menú');
  navigation.classList.remove('is-open');
}

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
  navigation.classList.toggle('is-open', !isOpen);
});
navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

function readCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(cartKey) || '[]');
    if (!Array.isArray(stored)) return [];
    return stored.filter((item) => products.some((product) => product.id === item.id && product.availability === 'available') && Number.isInteger(item.quantity) && item.quantity > 0);
  } catch {
    return [];
  }
}

let cart = readCart();

function saveCart() {
  try {
    localStorage.setItem(cartKey, JSON.stringify(cart));
  } catch {
    catalogStatus.textContent = 'No pudimos guardar tu bolsa en este dispositivo.';
  }
  renderCart();
}

function formatPrice(amount) {
  return money.format(amount).replace(/\s/g, ' ');
}

function productImage(product, className = '') {
  const alt = escapeHTML(product.imageAlt || `Imagen de ${product.name}`);
  if (product.image) {
    return `<img class="${className}" src="${escapeHTML(product.image)}" alt="${alt}" loading="lazy" />`;
  }
  return `<div class="${className} product-image-fallback" role="img" aria-label="Fotografía pendiente de ${escapeHTML(product.name)}"><span>Imagen pendiente</span></div>`;
}

function handleBrokenImages(root) {
  root.querySelectorAll('img').forEach((image) => image.addEventListener('error', () => {
    const fallback = document.createElement('div');
    fallback.className = `${image.className} product-image-fallback`;
    fallback.setAttribute('role', 'img');
    fallback.setAttribute('aria-label', `Fotografía pendiente de ${image.alt || 'producto ADARA'}`);
    fallback.textContent = 'Imagen pendiente';
    image.replaceWith(fallback);
  }, { once: true }));
}

function renderProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase(store.locale);
  const selectedFamily = familySelect.value;
  const sort = sortSelect.value;
  const visibleProducts = products.filter((product) =>
    (selectedFamily === 'all' || product.family === selectedFamily) &&
    `${product.name} ${product.brand || ''} ${product.description}`.toLocaleLowerCase(store.locale).includes(query));
  if (sort === 'price-asc') visibleProducts.sort((a, b) => a.priceCOP - b.priceCOP);
  if (sort === 'price-desc') visibleProducts.sort((a, b) => b.priceCOP - a.priceCOP);
  if (sort === 'name') visibleProducts.sort((a, b) => a.name.localeCompare(b.name, store.locale));
  if (sort === 'featured') visibleProducts.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));

  catalogToolbar.hidden = products.length === 0;
  if (!products.length) {
    catalogStatus.innerHTML = '<span class="catalog-status-title">La colección está en preparación.</span><span>Pronto compartiremos las fragancias ADARA PARFUM.</span>';
    productGrid.innerHTML = '<div class="catalog-empty-art" aria-hidden="true"><span>A</span></div>';
    return;
  }
  if (!visibleProducts.length) {
    catalogStatus.textContent = 'No encontramos fragancias con esa búsqueda.';
    productGrid.innerHTML = '';
    return;
  }
  catalogStatus.textContent = `${visibleProducts.length} ${visibleProducts.length === 1 ? 'fragancia' : 'fragancias'}`;
  productGrid.innerHTML = visibleProducts.map((product, index) => {
    const unavailable = product.availability === 'sold-out';
    const statusText = unavailable ? 'Agotado' : 'Disponible';
    return `<article class="product-item ${product.featured ? 'product-item--featured' : ''}">
      <button class="product-open" type="button" data-product-id="${escapeHTML(product.id)}" aria-label="Ver detalles de ${escapeHTML(product.name)}">
        <span class="product-image-wrap">${productImage(product, 'product-image')}</span>
        <span class="product-meta"><span><span class="product-brand">${escapeHTML(product.brand || store.brand)}</span><span class="product-title">${escapeHTML(product.name)}</span></span><span class="product-price">${formatPrice(product.priceCOP)}</span></span>
      </button>
      <p class="product-detail">${escapeHTML(product.volume)} · <span class="availability ${unavailable ? 'is-unavailable' : ''}">${statusText}</span></p>
      <button class="product-action" type="button" data-add-id="${escapeHTML(product.id)}" ${unavailable ? 'disabled' : ''}>${unavailable ? 'Agotado' : 'Añadir a la bolsa'} <span aria-hidden="true">↗</span></button>
    </article>`;
  }).join('');
  handleBrokenImages(productGrid);
  productGrid.querySelectorAll('[data-product-id]').forEach((button) => button.addEventListener('click', () => showProduct(button.dataset.productId, button)));
  productGrid.querySelectorAll('[data-add-id]').forEach((button) => button.addEventListener('click', () => addToCart(button.dataset.addId)));
}

function showProduct(id, trigger) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  lastDialogTrigger = trigger;
  productDialog.setAttribute('aria-label', `Detalle de ${product.name}`);
  const unavailable = product.availability === 'sold-out';
  productDialog.querySelector('.dialog-product-image').innerHTML = productImage(product, 'dialog-image');
  handleBrokenImages(productDialog.querySelector('.dialog-product-image'));
  const notes = Array.isArray(product.notes) && product.notes.length
    ? `<div class="detail-notes"><p class="eyebrow">Notas</p><p>${product.notes.map(escapeHTML).join(' · ')}</p></div>` : '';
  productDialog.querySelector('.dialog-product-copy').innerHTML = `<p class="eyebrow">${escapeHTML(product.brand || store.brand)}</p>
    <h2 id="dialog-product-name">${escapeHTML(product.name)}</h2><p class="dialog-volume">${escapeHTML(product.volume)}</p>
    <p class="dialog-description">${escapeHTML(product.description)}</p>${notes}
    <div class="dialog-price-row"><span>${formatPrice(product.priceCOP)}</span><span class="availability ${unavailable ? 'is-unavailable' : ''}">${unavailable ? 'Agotado' : 'Disponible'}</span></div>
    <button class="product-action dialog-add" type="button" ${unavailable ? 'disabled' : ''}>${unavailable ? 'Agotado' : 'Añadir a la bolsa'} <span aria-hidden="true">↗</span></button>`;
  productDialog.querySelector('.dialog-add').addEventListener('click', () => { productDialog.close(); addToCart(id); });
  productDialog.showModal();
}

function addToCart(id) {
  const product = products.find((item) => item.id === id);
  if (!product || product.availability === 'sold-out') return;
  const existing = cart.find((item) => item.id === id);
  if (existing) existing.quantity += 1;
  else cart.push({ id, quantity: 1 });
  saveCart();
  cartAnnouncement.textContent = `${product.name} se agregó a tu bolsa.`;
  openCart();
}

function adjustQuantity(id, delta) {
  cart = cart.map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0);
  saveCart();
  const item = cart.find((entry) => entry.id === id);
  const product = products.find((entry) => entry.id === id);
  cartAnnouncement.textContent = item ? `Cantidad de ${product.name}: ${item.quantity}.` : `${product.name} se quitó de tu bolsa.`;
}

function removeFromCart(id) {
  const product = products.find((entry) => entry.id === id);
  cart = cart.filter((item) => item.id !== id);
  saveCart();
  cartAnnouncement.textContent = `${product.name} se quitó de tu bolsa.`;
}

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const countLabel = String(count).padStart(2, '0');
  document.querySelector('.cart-count').textContent = countLabel;
  document.querySelector('.cart-heading-count').textContent = count ? `(${countLabel})` : '';
  cartButton.setAttribute('aria-label', `Abrir bolsa de compra, ${count} ${count === 1 ? 'producto' : 'productos'}`);
  if (!count) {
    cartContent.innerHTML = '<p class="cart-empty">Tu bolsa está vacía.</p><a class="text-link" href="#coleccion">Explorar la colección <span aria-hidden="true">↗</span></a>';
    cartContent.querySelector('a').addEventListener('click', closeCart);
    return;
  }
  const rows = cart.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    return `<article class="cart-line"><div class="cart-thumb">${productImage(product, 'cart-image')}</div>
      <div class="cart-line-copy"><p class="product-brand">${escapeHTML(product.brand || store.brand)}</p><h3>${escapeHTML(product.name)}</h3><p>${escapeHTML(product.volume)} · ${formatPrice(product.priceCOP)}</p>
      <div class="quantity-control" aria-label="Cantidad de ${escapeHTML(product.name)}"><button type="button" data-quantity="${escapeHTML(product.id)}" data-delta="-1" aria-label="Quitar una unidad">−</button><span>${item.quantity}</span><button type="button" data-quantity="${escapeHTML(product.id)}" data-delta="1" aria-label="Añadir una unidad">+</button></div></div>
      <button class="remove-item" type="button" data-remove="${escapeHTML(product.id)}">Eliminar</button></article>`;
  }).join('');
  const total = cart.reduce((sum, item) => sum + products.find((product) => product.id === item.id).priceCOP * item.quantity, 0);
  cartContent.innerHTML = `<div class="cart-lines">${rows}</div><div class="cart-summary"><p><span>Subtotal</span><strong>${formatPrice(total)}</strong></p><p class="shipping-note">Envío calculado al confirmar el pedido.</p>
    ${store.checkoutUrl ? '<button class="checkout-button" type="button">Continuar al pedido</button>' : '<p class="checkout-note">El proceso de compra estará disponible pronto.</p>'}</div>`;
  cartContent.querySelectorAll('[data-quantity]').forEach((button) => button.addEventListener('click', () => adjustQuantity(button.dataset.quantity, Number(button.dataset.delta))));
  cartContent.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => removeFromCart(button.dataset.remove)));
  handleBrokenImages(cartContent);
  const checkout = cartContent.querySelector('.checkout-button');
  if (checkout) checkout.addEventListener('click', continueToCheckout);
}

function continueToCheckout() {
  if (!store.checkoutUrl || !cart.length) return;
  const total = cart.reduce((sum, item) => sum + products.find((product) => product.id === item.id).priceCOP * item.quantity, 0);
  const destination = new URL(store.checkoutUrl, window.location.href);
  destination.searchParams.set('items', cart.map((item) => `${item.id}:${item.quantity}`).join(','));
  destination.searchParams.set('currency', store.currency);
  destination.searchParams.set('total', String(total));
  window.location.assign(destination.href);
}

function openCart() {
  cartBackdrop.hidden = false;
  cartDrawer.inert = false;
  cartDrawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('drawer-open');
  requestAnimationFrame(() => {
    cartBackdrop.classList.add('is-visible');
    cartDrawer.classList.add('is-open');
    cartClose.focus();
  });
}

function closeCart() {
  if (!cartDrawer.classList.contains('is-open')) return;
  cartBackdrop.classList.remove('is-visible');
  cartDrawer.classList.remove('is-open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  cartDrawer.inert = true;
  document.body.classList.remove('drawer-open');
  cartButton.focus();
  window.setTimeout(() => { cartBackdrop.hidden = true; }, 320);
}

function renderContact() {
  const content = document.querySelector('#contact-content');
  if (store.contactEmail) {
    const email = escapeHTML(store.contactEmail);
    content.innerHTML = `<a class="text-link" href="mailto:${email}">Escríbenos <span aria-hidden="true">↗</span></a>`;
  } else {
    content.innerHTML = '<p class="contact-pending">El canal de contacto oficial se anunciará pronto.</p>';
  }
}

function renderFamilyOptions() {
  const families = [...new Set(products.map((product) => product.family).filter(Boolean))].sort((a, b) => a.localeCompare(b, store.locale));
  familySelect.innerHTML = '<option value="all">Todas</option>' + families.map((family) => `<option value="${escapeHTML(family)}">${escapeHTML(family)}</option>`).join('');
}

cartButton.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartBackdrop.addEventListener('click', closeCart);
document.querySelector('.dialog-close').addEventListener('click', () => productDialog.close());
productDialog.addEventListener('close', () => lastDialogTrigger?.focus());
productDialog.addEventListener('click', (event) => { if (event.target === productDialog) productDialog.close(); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMenu();
    closeCart();
  }
  if (event.key === 'Tab' && cartDrawer.classList.contains('is-open')) {
    const focusable = [...cartDrawer.querySelectorAll('button:not(:disabled), a[href]')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
searchInput.addEventListener('input', renderProducts);
familySelect.addEventListener('change', renderProducts);
sortSelect.addEventListener('change', renderProducts);
renderFamilyOptions();
renderProducts();
renderCart();
renderContact();
