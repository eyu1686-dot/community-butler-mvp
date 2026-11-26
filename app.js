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

const serviceCategories = {
  errands:'最后100米跑腿',
  repairs:'一口价维修',
  cleaning:'严选保洁',
};
const neighborhoodServices = [
  { id:'parcel', category:'errands', name:'代取驿站快递', icon:'package', price:200, unit:'/ 单', scope:'凭取件码代取，送到楼栋门口。' },
  { id:'trash', category:'errands', name:'代扔大件垃圾', icon:'trash-2', price:200, unit:'/ 单', scope:'协助搬至小区指定的大件垃圾投放点。' },
  { id:'takeout', category:'errands', name:'外卖门岗代提上楼', icon:'shopping-bag', price:150, unit:'/ 单', scope:'从门岗代提外卖，送至门牌。' },
  { id:'tools', category:'errands', name:'邻里借工具/急事跑腿', icon:'hammer', price:300, unit:'起', scope:'工具借用或小区内紧急代办，超出起步价需先确认。' },
  { id:'drain', category:'repairs', name:'疏通下水/马桶', icon:'wrench', price:6000, unit:'一口价', scope:'含一次常规疏通和排水检查。', worker:'周师傅', years:12, households:38 },
  { id:'faucet', category:'repairs', name:'更换水龙头/软管', icon:'droplets', price:3000, unit:'工时费', scope:'含拆装与试水，水龙头或软管由住户提供。', worker:'陈师傅', years:9, households:26 },
  { id:'housekeeping', category:'cleaning', name:'三居室深度日常保洁', icon:'sparkles', price:3500, unit:'/ 小时', scope:'按小时计费，预约以 1 小时为起订，延时须先确认。', worker:'李师傅', years:8, households:54 },
  { id:'hood', category:'cleaning', name:'油烟机高温拆洗', icon:'fan', price:11800, unit:'一口价', scope:'含高温去油、滤网拆洗与复装试机。', worker:'王师傅', years:11, households:31 },
];
const buildings = ['1 栋','2 栋','3 栋','5 栋','6 栋'];
const rooms = ['101','102','201','202','301','302','401','402','501','502','601','602'];
const visitWindows = ['09:00–11:00','11:00–13:00','14:00–16:00','16:00–18:00','18:00–20:00'];
const matchingStatus = '管家已接单 · 正在匹配本小区人员';
let serviceCategory = 'errands';

const servicePrice = cents => '¥' + (cents / 100).toString();

function endorsement(item) {
  return `<details class="endorsement">
    <summary>管家实测背书</summary>
    <div class="endorsement-body">
      <p><strong>${item.worker}</strong> · 从业 ${item.years} 年</p>
      <p>本小区已服务 <strong>${item.households} 户</strong></p>
      <p><strong>零隐形消费</strong> · 服务范围和明细事先确认。</p>
      <p><strong>平台资金担保</strong> · 验收满意再结算给师傅。</p>
    </div>
  </details>`;
}

function selectPage() {
  const errands = serviceCategory === 'errands';
  const items = neighborhoodServices.filter(item => item.category === serviceCategory);
  return `<header class="page-head select-hero">
    <h1>邻里严选</h1><p>阳光花园一期 · 本小区实测背书服务</p>
  </header>
  <div class="service-filters" role="group" aria-label="服务分类">
    ${Object.entries(serviceCategories).map(([id, label]) => `<button class="service-filter" data-action="service-category" data-id="${id}" aria-pressed="${id === serviceCategory}">${label}</button>`).join('')}
  </div>
  <p class="service-promise">${errands
    ? '执行员均为本小区实名宝妈/退休邻居 · 平均12分钟送达'
    : '公开服务范围与价格 · 验收满意再结算'}<small>人员与服务记录为演示数据</small></p>
  <section class="service-grid" aria-label="${serviceCategories[serviceCategory]}">
    ${items.map(item => `<article class="service-card">
      <div class="service-card-head"><span class="service-icon" aria-hidden="true">${icon(item.icon)}</span>
        <div><h2>${item.name}</h2><p class="service-price"><strong>${servicePrice(item.price)}</strong> <small>${item.unit}</small></p></div>
      </div>
      <p class="service-scope">${item.scope}</p>
      ${errands ? '' : endorsement(item)}
      <button class="primary service-book" data-action="book-service" data-id="${item.id}" aria-label="${errands ? '一键下单' : '预约上门'} · ${item.name}">${errands ? '一键下单' : '预约上门'}</button>
    </article>`).join('')}
  </section>`;
}

function availableWindows(item) {
  const tomorrow = new Date(Date.now() + chinaOffset + 86400000).toISOString().slice(0, 10);
  const windows = visitWindows.map(window => `${tomorrow} ${window}`);
  return item.category === 'errands' ? ['尽快送达', ...windows] : windows;
}

function bookingOptions(values) {
  return values.map(value => `<option>${value}</option>`).join('');
}

function showBooking(id) {
  const item = neighborhoodServices.find(service => service.id === id);
  if (!item) return;
  openInfo('预约下单', `<p class="booking-item"><strong>${item.name}</strong> <span>${servicePrice(item.price)} ${item.unit}</span></p>
    <form id="booking-form" data-service="${item.id}">
      <div class="booking-address">
        <label class="field">楼栋<select name="building" required><option value="">选择楼栋</option>${bookingOptions(buildings)}</select></label>
        <label class="field">门牌号<select name="room" required><option value="">选择门牌号</option>${bookingOptions(rooms)}</select></label>
      </div>
      <label class="field">期望上门时间段<select name="slot" required><option value="">选择时间段</option>${bookingOptions(availableWindows(item))}</select></label>
      <label class="field">备注说明（选填）<textarea name="notes" rows="3" maxlength="200" placeholder="可填写服务内容或上门说明"></textarea></label>
      <button class="primary service-book" type="submit">提交演示预约</button>
    </form>`);
}

function orderDetails(order) {
  if (order.kind === 'service') {
    const { address, slot, notes, unit } = order.booking;
    return `<div class="service-order">
      <strong>${escapeHtml(order.items[0].name)}</strong>
      <p class="muted">${escapeHtml(address)} · ${escapeHtml(slot)}</p>
      ${notes ? `<p class="muted">备注：${escapeHtml(notes)}</p>` : ''}
      <p class="muted">${escapeHtml(order.id)} · ${servicePrice(order.total)} ${escapeHtml(unit)} · ${escapeHtml(order.time)}</p>
      <span class="status">${escapeHtml(order.status)}</span>
    </div>`;
  }
  return `<div class="row"><div><strong>${order.id} · ${money(order.total)}</strong><p class="muted">${order.items.map(item => `${item.name} × ${item.quantity}`).join('、')}</p><small>${order.time} · ${escapeHtml(order.deliveryLabel || deliveryOptions.pickup.label)}</small></div><span class="status">${deliveryOptions[order.delivery]?.status || '待自提'}</span></div>`;
}

function servicePage() {
  const orderOptions = state.orders.map(order => `<option value="${order.id}">${order.id} · ${money(order.total)}</option>`).join('');
  const requests = state.requests.map(request => `<div class="row"><div><strong>${escapeHtml(request.type)}</strong><p class="muted">${escapeHtml(request.detail)}</p><small>${escapeHtml(request.order || '未关联订单')} · ${escapeHtml(request.time)}</small></div><span class="status">已登记</span></div>`).join('');
  return pageHead('管家售后', '遇到商品、自提或社区服务问题，可以在这里登记。') + `
    <form id="request-form" class="panel">
      <h2>提交售后申请</h2>
      <label class="field">关联订单<select name="order"><option value="">未关联订单</option>${orderOptions}</select></label>
      <label class="field">问题类型<select name="type"><option>商品品质</option><option>漏发或错发</option><option>自提问题</option><option>社区服务</option><option>其他</option></select></label>
      <label class="field">问题说明<textarea name="detail" rows="3" maxlength="240" required placeholder="请简单描述遇到的问题"></textarea></label>
      <button class="primary" type="submit">提交演示申请</button>
    </form>
    <section class="panel"><h2>申请记录</h2>${requests || '<p class="muted">暂无售后申请</p>'}</section>`;
}

function communityPage() {
  const orders = state.orders.map(orderDetails).join('');
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
  showOrders('下单成功', saved);
}

function showOrders(message, saved) {
  if (location.hash !== '#community') history.pushState(null, '', '#community');
  render();
  document.querySelector('#orders-title').focus();
  notify(message, saved);
}

dialog.addEventListener('submit', event => {
  const form = event.target;
  if (form.id !== 'booking-form') return;
  event.preventDefault();
  const item = neighborhoodServices.find(service => service.id === form.dataset.service);
  if (!item) return;
  const { building, room, slot, notes } = Object.fromEntries(new FormData(form));
  if (!buildings.includes(building) || !rooms.includes(room)) return;
  if (!availableWindows(item).includes(slot)) {
    const select = form.elements.slot;
    select.innerHTML = '<option value="">日期已更新，请重新选择</option>' + bookingOptions(availableWindows(item));
    select.reportValidity();
    return;
  }
  state.orders.unshift({
    id:'NB-' + Date.now().toString(36).toUpperCase(),
    kind:'service', status:matchingStatus, time:timestamp(), total:item.price,
    items:[{ id:item.id, name:item.name, price:item.price, quantity:1 }],
    booking:{ address:`${building} ${room} 室`, slot, notes:notes.trim().slice(0, 200), unit:item.unit },
  });
  const saved = save();
  dialog.close();
  showOrders('预约成功', saved);
});

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
    case 'service-category':
      if (serviceCategory !== id && Object.hasOwn(serviceCategories, id)) {
        serviceCategory = id;
        render();
        main.querySelector('.service-filter[aria-pressed="true"]').focus({ preventScroll:true });
      }
      break;
    case 'book-service': showBooking(id); break;
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
