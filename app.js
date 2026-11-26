const direct = [
  { id:'dandong', name:'丹东红颜草莓', detail:'500 g / 盒', photo:'strawberries', base:42, tiers:[6800,5900,4900] },
  { id:'tiger', name:'现捞冰鲜黑虎虾', detail:'400 g / 份', photo:'shrimp', base:29, tiers:[7900,6900,5900] },
  { id:'chile', name:'智利车厘子 3J', detail:'500 g / 盒', photo:'cherries', base:9, tiers:[8900,7900,6900] },
  { id:'hairtail', name:'舟山带鱼段', detail:'500 g / 份', photo:'fish', base:24, tiers:[3900,3500,2900] },
];
const thresholds = [10,30,50];
const limit = thresholds.at(-1);
const deliveryOptions = {
  pickup:{ label:'小区北门管家自提点', detail:'免费', fee:0, status:'待自提' },
  courier:{ label:'本小区跑腿送上门', detail:'+¥2 · 15 分钟达', fee:200, status:'待配送' },
};
const products = [
  { id:'berry', name:'红颜草莓', detail:'晨采 · 250 g / 盒', category:'时令水果', price:1690, photo:'strawberries' },
  { id:'tomato', name:'沙瓤番茄', detail:'自然熟 · 500 g / 份', category:'新鲜蔬菜', price:890, photo:'tomatoes' },
  { id:'greens', name:'农场蔬菜拼盘', detail:'当季搭配 · 600 g / 份', category:'新鲜蔬菜', price:1290, photo:'greens' },
  { id:'bread', name:'手作乡村面包', detail:'邻里烘焙 · 1 个', category:'邻里严选', price:2200, photo:'bread' },
];
const tabs = ['fresh', 'select', 'service', 'community'];
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
let delivery = 'pickup';
let previewFrame = 0;
let previewTimer;
const chinaOffset = 8 * 60 * 60 * 1000;
function batchTime(now = Date.now()) {
  const local = new Date(now + chinaOffset);
  const { year, month, day } = {
    year:local.getUTCFullYear(), month:local.getUTCMonth(), day:local.getUTCDate(),
  };
  return {
    day:local.toISOString().slice(0,10),
    remaining:Math.max(0, Date.UTC(year, month, day, 22) - chinaOffset - now),
  };
}
function syncBatch() {
  const { day } = batchTime();
  if (state.batch?.day === day) return;
  for (const item of direct) delete state.cart[item.id];
  state.batch = { day, quantities:{} };
  save();
}
function joined(item) {
  return item.base + (state.batch.quantities[item.id] || 0) + (state.cart[item.id] || 0);
}
function tier(item) {
  const count = joined(item);
  return thresholds.reduce((level, threshold, index) => count >= threshold ? index : level, -1);
}
const displayPrice = item => item.tiers[Math.max(0, tier(item))];
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
  return [...direct, ...products].filter(item => state.cart[item.id] > 0)
    .map(item => ({
      id:item.id, name:item.name, price:item.tiers ? displayPrice(item) : item.price,
      quantity:state.cart[item.id],
    }));
}

function refreshBag() {
  const count = cartLines().reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.querySelector('#bag-count');
  badge.textContent = count;
  badge.hidden = count === 0;
  const bar = document.querySelector('#checkout-bar');
  bar.hidden = !count || (location.hash && location.hash !== '#fresh');
  document.body.classList.toggle('has-checkout', !bar.hidden);
  bar.querySelector('strong').textContent = money(cartTotal());
  bar.querySelector('small').textContent = `已选 ${count} 份`;
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
  return `<section class="hero market-hero">
    <img src="./assets/market.jpg" alt="" fetchpriority="high" width="724" height="724">
    <div><span class="eyebrow">今晚 22:00 截单 · 明早 5 点采购</span>
      <h1>明日批发市场<br>直采拼团</h1>
      <p>拼得越多，价格越低。当天采，当天到。</p>
      <button class="primary" data-action="browse">查看限量鲜货</button>
    </div>
  </section>
  <button class="trace" data-action="trace">
    <span class="trace-play" aria-hidden="true">▶</span>
    <span><strong>今日早 5:30 批发市场直采实拍</strong><small>演示预览 · 看采购、挑拣与复秤</small></span>
  </button>
  <section id="catalog" aria-labelledby="catalog-title">
    <div class="section-head"><h2 id="catalog-title" tabindex="-1">每日限量直采</h2><p>每款限 50 份</p></div>
    <p class="group-note">已拼份数为演示数据。按提交时已解锁的阶梯价结算。</p>
    <div class="group-products">${direct.map(item => `<article class="group-product" data-product="${item.id}">
      <div class="group-summary"><img src="./assets/${item.photo}.jpg" alt="" width="104" height="90">
        <div><h3>${item.name}</h3><p class="muted">${item.detail}</p>
          <strong class="price" data-group-price></strong><small data-price-label></small></div></div>
      <p class="cutoff" data-cutoff></p>
      <label class="progress-label"><span data-joined></span><progress max="${limit}"></progress></label>
      <div class="tiers" aria-label="阶梯拼团价">${item.tiers.map((price,index) => `<div class="tier"><span>满 ${thresholds[index]} 份</span><strong>¥${price/100}</strong><small data-tier-status></small></div>`).join('')}</div>
      <button class="primary join" data-action="add" data-id="${item.id}"></button>
    </article>`).join('')}</div>
  </section>`;
}

function refreshGroups() {
  const remaining = batchTime().remaining;
  const seconds = Math.ceil(remaining / 1000);
  const clock = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map(value => String(value).padStart(2,'0')).join(':');
  for (const card of main.querySelectorAll('[data-product]')) {
    const item = direct.find(product => product.id === card.dataset.product);
    const count = joined(item);
    const level = tier(item);
    card.querySelector('[data-cutoff]').textContent = remaining ? `距今晚 22:00 截单还剩 ${clock}` : '今晚已截单';
    card.querySelector('[data-group-price]').textContent = money(displayPrice(item));
    card.querySelector('[data-price-label]').textContent = level < 0 ? ' / 份 · 首档参考价' : ' / 份 · 已解锁';
    card.querySelector('[data-joined]').textContent = `已拼 ${count}/${limit} 份`;
    card.querySelector('progress').value = count;
    card.querySelectorAll('.tier').forEach((element,index) => {
      element.classList.toggle('unlocked', index === level);
      element.querySelector('small').textContent = index === level ? '当前团价' : index < level ? '已达标' : '待解锁';
    });
    const button = card.querySelector('.join');
    button.disabled = !remaining || count >= limit;
    button.textContent = !remaining ? '已截单' : count >= limit ? '已拼满' : state.cart[item.id] ? '加一份' : '一键参团';
    button.setAttribute('aria-label', `${button.textContent} · ${item.name}`);
  }
}

function openInfo(title, content) {
  dialog.classList.remove('checkout-sheet');
  dialogContent.innerHTML = `<header class="dialog-head"><h2 id="dialog-title">${title}</h2>
    <button class="icon-button" data-action="close" aria-label="关闭">×</button></header>${content}`;
  if (!dialog.open) dialog.showModal();
}

const preview = [
  ['market', '05:30 · 到场采购', '查看当日批发市场到货，记录货源与批次。'],
  ['sorting', '05:35 · 现场挑拣', '逐盒查看果蒂和表皮，剔除压伤、软烂的果子。'],
  ['shrimp', '05:40 · 称重复核', '先清零去皮，复核净重，冰鲜产品称重后立即复冰。'],
];
function drawPreview() {
  const [photo, title, detail] = preview[previewFrame];
  dialog.querySelector('[data-preview]').innerHTML = `<img src="./assets/${photo}.jpg" alt="">
    <p><strong>${title}</strong></p><p class="muted">${detail}</p>`;
}
function stopPreview() {
  clearInterval(previewTimer);
  previewTimer = undefined;
}
function playPreview() {
  stopPreview();
  previewTimer = setInterval(() => {
    if (!dialog.open || !dialog.querySelector('[data-preview]')) return stopPreview();
    previewFrame = (previewFrame + 1) % preview.length;
    drawPreview();
  }, 3600);
}

const pageHead = (title, description) => `<header class="page-head"><h1>${title}</h1><p>${description}</p></header>`;

function selectPage() {
  return pageHead('邻里严选', '阳光花园一期附近的手作好物，和生鲜一起自提。') +
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
  const orders = state.orders.map(order => `<div class="row"><div><strong>${order.id} · ${money(order.total)}</strong><p class="muted">${order.items.map(item => `${item.name} × ${item.quantity}`).join('、')}</p><small>${order.time} · ${escapeHtml(order.deliveryLabel || deliveryOptions.pickup.label)}</small></div><span class="status">${deliveryOptions[order.delivery]?.status || '待自提'}</span></div>`).join('');
  return pageHead('我的小区', '阳光花园一期 · 单小区服务演示') + `
    <section class="panel"><h2>北门管家自提点</h2><p>阳光花园一期小区北门内侧</p><p class="muted">自提时间 17:00–20:00</p></section>
    <section class="panel"><h2 id="orders-title" tabindex="-1">我的订单</h2>${orders || '<p class="muted">暂无订单</p>'}</section>
    <section class="panel"><h2>添加到 iPhone 主屏幕</h2><p>在 Safari 点按「分享」，选择「添加到主屏幕」。如出现「作为网页 App 打开」选项，请保持开启。</p></section>`;
}

function render() {
  syncBatch();
  const route = location.hash.slice(1);
  const active = tabs.includes(route) ? route : 'fresh';
  main.innerHTML = { fresh:freshPage, select:selectPage, service:servicePage, community:communityPage }[active]();
  for (const link of document.querySelectorAll('.nav a')) {
    if (link.hash === '#' + active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  refreshBag();
  refreshGroups();
  drawIcons();
}

function cartTotal(lines = cartLines()) {
  return lines.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function checkoutBlocker(lines) {
  for (const line of lines) {
    const item = direct.find(product => product.id === line.id);
    if (!item) continue;
    if (!batchTime().remaining) return '直采已截单，请移除直采商品';
    if (tier(item) < 0) return `${item.name}还差 ${thresholds[0] - joined(item)} 份成团`;
  }
  return '';
}

function showBag(focusAction, focusId) {
  syncBatch();
  const lines = cartLines();
  const blocker = checkoutBlocker(lines);
  const subtotal = cartTotal(lines);
  dialog.classList.add('checkout-sheet');
  dialogContent.innerHTML = `<header class="dialog-head"><h2 id="dialog-title">确认订单</h2>
    <button class="icon-button" data-action="close" aria-label="关闭">×</button></header>
    ${lines.length ? `<div>${lines.map(item => `<div class="row">
      <div><strong>${item.name}</strong><p class="muted">${money(item.price)} / 份</p></div>
      <div class="qty"><button class="icon-button" data-action="minus" data-id="${item.id}" aria-label="减少${item.name}">−</button>
        <span>${item.quantity}</span><button class="icon-button" data-action="plus" data-id="${item.id}" aria-label="增加${item.name}">+</button></div>
    </div>`).join('')}</div>
    <fieldset class="delivery"><legend>选择配送方式</legend>
      ${Object.entries(deliveryOptions).map(([key, option]) => `<label class="delivery-option">
        <input type="radio" name="delivery" value="${key}" ${delivery === key ? 'checked' : ''}>
        <span><strong>${option.label}</strong><small>${option.detail}</small></span></label>`).join('')}
    </fieldset>
    <p class="muted">商品 ${money(subtotal)} · 配送 <span data-delivery-fee>${money(deliveryOptions[delivery].fee)}</span></p>
    <p class="cutoff" data-blocker ${blocker ? '' : 'hidden'}>${blocker}</p>
    <div class="row"><strong>合计 <span data-order-total>${money(subtotal + deliveryOptions[delivery].fee)}</span></strong><button class="primary" data-action="checkout" ${blocker ? 'disabled' : ''}>提交演示订单</button></div>`
    : '<p class="muted">购物袋是空的</p>'}`;
  if (!dialog.open) dialog.showModal();
  if (focusAction) {
    const button = dialog.querySelector(`[data-action="${focusAction}"][data-id="${focusId}"]`);
    (button || dialog.querySelector('[data-action="close"]')).focus();
  }
}

function changeQuantity(id, delta) {
  syncBatch();
  const item = [...direct, ...products].find(product => product.id === id);
  if (!item) return;
  if (delta > 0 && item.tiers && (!batchTime().remaining || joined(item) >= limit)) {
    if (dialog.open) {
      const warning = dialog.querySelector('[data-blocker]');
      warning.hidden = false;
      warning.textContent = batchTime().remaining ? '该商品已拼满' : '该商品已截单';
    } else notify(batchTime().remaining ? '该商品已拼满' : '该商品已截单');
    return;
  }
  const quantity = (state.cart[id] || 0) + delta;
  if (quantity > 99) { notify('单品最多选购 99 份'); return; }
  if (quantity > 0) state.cart[id] = quantity;
  else delete state.cart[id];
  const saved = save();
  refreshBag();
  refreshGroups();
  if (dialog.open) showBag(delta > 0 ? 'plus' : 'minus', id);
  else notify(`${item.name}已加入购物袋`, saved);
}

function checkout() {
  syncBatch();
  const items = cartLines();
  if (!items.length || checkoutBlocker(items)) { showBag(); return; }
  const option = deliveryOptions[delivery];
  state.orders.unshift({
    id:'YG-' + Date.now().toString(36).toUpperCase(),
    items, total:cartTotal(items) + option.fee, time:timestamp(),
    delivery, deliveryFee:option.fee, deliveryLabel:option.label,
  });
  for (const item of items) {
    if (direct.some(product => product.id === item.id)) {
      state.batch.quantities[item.id] = (state.batch.quantities[item.id] || 0) + item.quantity;
    }
  }
  state.cart = {};
  const saved = save();
  dialog.close();
  delivery = 'pickup';
  history.pushState(null, '', '#community');
  render();
  document.querySelector('#orders-title').focus();
  notify('下单成功', saved);
}

dialog.addEventListener('close', stopPreview);
dialog.addEventListener('change', event => {
  if (event.target.name !== 'delivery') return;
  delivery = event.target.value;
  const fee = deliveryOptions[delivery].fee;
  dialog.querySelector('[data-delivery-fee]').textContent = money(fee);
  dialog.querySelector('[data-order-total]').textContent = money(cartTotal() + fee);
});

document.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  switch (action) {
    case 'bag': showBag(); break;
    case 'quality':
      openInfo('本小区品质公约', `<ul class="agreement">
        <li><strong>早 5 点市场直采</strong><p>当天采购，当天分拣到店。</p></li>
        <li><strong>农残 / 新鲜度实拍</strong><p>展示当批抽检与到货状态。</p></li>
        <li><strong>坏果无条件秒赔</strong><p>发现坏果可直接通过管家售后登记。</p></li>
        <li><strong>不卖隔夜货</strong><p>每日限量，批次到期下架。</p></li>
      </ul>`);
      break;
    case 'trace':
      previewFrame = 0;
      openInfo('今日直采实拍 · 模拟画面', '<div class="preview-frame" data-preview></div><div class="preview-actions"><button class="primary" data-action="toggle-preview">暂停预览</button><button class="icon-button" data-action="next-frame">下一幕</button></div>');
      drawPreview();
      playPreview();
      break;
    case 'toggle-preview':
      if (previewTimer) { stopPreview(); button.textContent = '播放预览'; }
      else { playPreview(); button.textContent = '暂停预览'; }
      break;
    case 'next-frame':
      previewFrame = (previewFrame + 1) % preview.length;
      drawPreview();
      break;
    case 'close': dialog.close(); break;
    case 'add': case 'plus': changeQuantity(id, 1); break;
    case 'minus': changeQuantity(id, -1); break;
    case 'checkout': checkout(); break;
    case 'browse':
      document.querySelector('#catalog-title').focus({ preventScroll:true });
      document.querySelector('#catalog').scrollIntoView();
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
setInterval(() => {
  const previousDay = state.batch.day;
  syncBatch();
  refreshGroups();
  if (previousDay !== state.batch.day) {
    refreshBag();
    if (dialog.open && dialog.classList.contains('checkout-sheet')) showBag();
  }
  const submit = dialog.querySelector('[data-action="checkout"]');
  if (dialog.open && submit) {
    const reason = checkoutBlocker(cartLines());
    const warning = dialog.querySelector('[data-blocker]');
    if (submit.disabled !== Boolean(reason)) {
      submit.disabled = Boolean(reason);
      warning.hidden = !reason;
      warning.textContent = reason;
    }
  }
}, 1000);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service worker:', error));
}
