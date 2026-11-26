const products = [
  { id:'berry', name:'红颜草莓', detail:'晨采 · 250 g / 盒', category:'时令水果', price:1690, photo:'strawberries' },
  { id:'tomato', name:'沙瓤番茄', detail:'自然熟 · 500 g / 份', category:'新鲜蔬菜', price:890, photo:'tomatoes' },
  { id:'greens', name:'农场蔬菜拼盘', detail:'当季搭配 · 600 g / 份', category:'新鲜蔬菜', price:1290, photo:'greens' },
  { id:'bread', name:'手作乡村面包', detail:'邻里烘焙 · 1 个', category:'邻里严选', price:2200, photo:'bread' },
];
const tabs = ['fresh', 'select', 'service', 'community'];
const filters = ['全部', '时令水果', '新鲜蔬菜'];
const storageKey = 'community-butler-demo-v1';
const defaults = { cart:{}, orders:[], requests:[] };
let state;
try {
  state = { ...defaults, ...JSON.parse(localStorage.getItem(storageKey)) };
} catch {
  state = defaults;
}

const main = document.querySelector('#main');
const dialog = document.querySelector('#dialog');
const dialogContent = document.querySelector('#dialog-content');
const toast = document.querySelector('#toast');
const money = cents => '¥' + (cents / 100).toFixed(2);
const timestamp = () => new Date().toLocaleString('zh-CN', { dateStyle:'short', timeStyle:'short' });
const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
})[character]);
let filter = filters[0];
let toastTimer;

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function notify(message, saved = true) {
  clearTimeout(toastTimer);
  toast.textContent = saved ? message : message + '（仅保留在当前页面）';
  toastTimer = setTimeout(() => { toast.textContent = ''; }, 2800);
}

function cartLines() {
  return products.filter(item => state.cart[item.id] > 0)
    .map(item => ({ ...item, quantity:state.cart[item.id] }));
}

function refreshBag() {
  const count = cartLines().reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.querySelector('#bag-count');
  badge.textContent = count;
  badge.hidden = count === 0;
  badge.parentElement.setAttribute('aria-label', count ? `购物袋，${count} 件商品` : '购物袋');
}

function drawIcons() {
  window.lucide?.createIcons();
}

function cards(items) {
  return `<div class="products">${items.map(item => `
    <article class="product">
      <img src="./assets/${item.photo}.jpg" alt="" width="480" height="320">
      <div class="product-copy">
        <h3>${item.name}</h3><p>${item.detail}</p>
        <div class="product-foot"><span class="price">${money(item.price)}</span>
          <button class="add" data-action="add" data-id="${item.id}" aria-label="加购${item.name}"><span>+</span></button>
        </div>
      </div>
    </article>`).join('')}</div>`;
}

function freshPage() {
  const items = products.filter(item => item.category !== '邻里严选' && (filter === '全部' || item.category === filter));
  return `<section class="hero">
    <img src="./assets/market.jpg" alt="" fetchpriority="high" width="1000" height="689">
    <div><span class="eyebrow">青禾里 · 当季直采</span>
      <h1>今天的新鲜<br>就在楼下</h1>
      <p>农场发货，小区自提。</p>
      <button class="primary" data-action="browse">选购今日鲜货</button>
    </div>
  </section>
  <aside class="pickup">${icon('map-pin')}<div><strong>南门邻里服务站</strong><small>每日 17:00–20:00 自提</small></div></aside>
  <section id="catalog" aria-labelledby="catalog-title">
    <div class="section-head"><h2 id="catalog-title" tabindex="-1">今日鲜货</h2><p>按份选购</p></div>
    <div class="filters" aria-label="商品分类">${filters.map(label => `<button class="filter" data-action="filter" data-id="${label}" aria-pressed="${filter === label}">${label}</button>`).join('')}</div>
    ${cards(items)}
  </section>`;
}

const pageHead = (title, description) => `<header class="page-head"><h1>${title}</h1><p>${description}</p></header>`;

function selectPage() {
  return pageHead('邻里严选', '青禾里附近的手作好物，和生鲜一起自提。') +
    '<div class="section-head"><h2>本周推荐</h2></div>' +
    cards(products.filter(item => item.category === '邻里严选'));
}

function servicePage() {
  const orderOptions = state.orders.map(order => `<option value="${order.id}">${order.id} · ${money(order.total)}</option>`).join('');
  const requests = state.requests.map(request => `<div class="row"><div><strong>${escapeHtml(request.type)}</strong><p class="muted">${escapeHtml(request.detail)}</p><small>${escapeHtml(request.order || '未关联订单')} · ${escapeHtml(request.time)}</small></div><span class="status">已登记</span></div>`).join('');
  return pageHead('管家售后', '遇到商品或自提问题，可以在这里登记。') + `
    <form id="request-form" class="panel">
      <h2>提交售后申请</h2>
      <label class="field">关联订单<select name="order"><option value="">未关联订单</option>${orderOptions}</select></label>
      <label class="field">问题类型<select name="type"><option>商品品质</option><option>漏发或错发</option><option>自提问题</option><option>其他</option></select></label>
      <label class="field">问题说明<textarea name="detail" rows="3" maxlength="240" required placeholder="请简单描述遇到的问题"></textarea></label>
      <button class="primary" type="submit">提交演示申请</button>
    </form>
    <section class="panel"><h2>申请记录</h2>${requests || '<p class="muted">暂无售后申请</p>'}</section>`;
}

function communityPage() {
  const orders = state.orders.map(order => `<div class="row"><div><strong>${order.id} · ${money(order.total)}</strong><p class="muted">${order.items.map(item => `${item.name} × ${item.quantity}`).join('、')}</p><small>${order.time}</small></div><span class="status">待自提</span></div>`).join('');
  return pageHead('我的小区', '青禾里 · 单小区服务演示') + `
    <section class="panel"><h2>南门邻里服务站</h2><p>青禾里小区南门内侧</p><p class="muted">自提时间 17:00–20:00</p></section>
    <section class="panel"><h2>我的订单</h2>${orders || '<p class="muted">暂无订单</p>'}</section>
    <section class="panel"><h2>添加到 iPhone 主屏幕</h2><p>在 Safari 点按「分享」，选择「添加到主屏幕」。如出现「作为网页 App 打开」选项，请保持开启。</p></section>`;
}

function render() {
  const route = location.hash.slice(1);
  const active = tabs.includes(route) ? route : 'fresh';
  main.innerHTML = { fresh:freshPage, select:selectPage, service:servicePage, community:communityPage }[active]();
  for (const link of document.querySelectorAll('.nav a')) {
    if (link.hash === '#' + active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  refreshBag();
  drawIcons();
}

function showBag(focusAction, focusId) {
  const lines = cartLines();
  const total = lines.reduce((sum, item) => sum + item.price * item.quantity, 0);
  dialogContent.innerHTML = `<header class="dialog-head"><h2 id="dialog-title">购物袋</h2>
    <button class="icon-button" data-action="close" aria-label="关闭">×</button></header>
    ${lines.length ? `<div>${lines.map(item => `<div class="row">
      <div><strong>${item.name}</strong><p class="muted">${money(item.price)} / 份</p></div>
      <div class="qty"><button class="icon-button" data-action="minus" data-id="${item.id}" aria-label="减少${item.name}">−</button>
        <span>${item.quantity}</span><button class="icon-button" data-action="plus" data-id="${item.id}" aria-label="增加${item.name}">+</button></div>
    </div>`).join('')}</div>
    <p class="muted">南门邻里服务站 · 17:00–20:00</p>
    <div class="row"><strong>合计 ${money(total)}</strong><button class="primary" data-action="checkout">模拟下单</button></div>`
    : '<p class="muted">购物袋是空的</p>'}`;
  if (!dialog.open) dialog.showModal();
  if (focusAction) {
    const button = dialog.querySelector(`[data-action="${focusAction}"][data-id="${focusId}"]`);
    (button || dialog.querySelector('[data-action="close"]')).focus();
  }
}

function changeQuantity(id, delta) {
  const item = products.find(product => product.id === id);
  if (!item) return;
  const quantity = (state.cart[id] || 0) + delta;
  if (quantity > 99) {
    if (dialog.open) dialog.querySelector('[data-action="plus"][data-id="' + id + '"]').focus();
    else notify('单品最多选购 99 份');
    return;
  }
  if (quantity > 0) state.cart[id] = quantity;
  else delete state.cart[id];
  const saved = save();
  refreshBag();
  if (dialog.open) showBag(delta > 0 ? 'plus' : 'minus', id);
  else notify(`${item.name}已加入购物袋`, saved);
}

function checkout() {
  const items = cartLines();
  if (!items.length) return;
  state.orders.unshift({
    id:'QH-' + Date.now().toString(36).toUpperCase(),
    items, total:items.reduce((sum, item) => sum + item.price * item.quantity, 0), time:timestamp(),
  });
  state.cart = {};
  const saved = save();
  dialog.close();
  location.hash = 'community';
  render();
  notify('模拟订单已生成', saved);
}

document.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  switch (action) {
    case 'bag': showBag(); break;
    case 'close': dialog.close(); break;
    case 'add': case 'plus': changeQuantity(id, 1); break;
    case 'minus': changeQuantity(id, -1); break;
    case 'checkout': checkout(); break;
    case 'browse':
      document.querySelector('#catalog-title').focus({ preventScroll:true });
      document.querySelector('#catalog').scrollIntoView();
      break;
    case 'filter':
      filter = id;
      render();
      main.querySelector('[aria-pressed="true"]').focus({ preventScroll:true });
      break;
  }
});

main.addEventListener('submit', event => {
  if (event.target.id !== 'request-form') return;
  event.preventDefault();
  const form = event.target;
  const description = form.elements.detail;
  const detail = description.value.trim();
  if (!detail) {
    description.setCustomValidity('请输入问题说明');
    description.reportValidity();
    return;
  }
  state.requests.unshift({ order:form.elements.order.value, type:form.elements.type.value, detail, time:timestamp() });
  const saved = save();
  render();
  notify('售后申请已登记', saved);
});
main.addEventListener('input', event => {
  if (event.target.name === 'detail') event.target.setCustomValidity('');
});
window.addEventListener('hashchange', () => {
  render();
  window.scrollTo(0, 0);
});
render();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service worker:', error));
}
