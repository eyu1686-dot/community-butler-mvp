const direct = [
  { id:'dandong', name:'丹东红颜草莓', detail:'500 g / 盒', photo:'strawberries', base:42, tiers:[6800,5900,4900], category:'fruit',
    quality:['当季头茬','逐盒挑拣'], origin:'辽宁丹东', storage:'冷藏 0–4°C，食用前再洗，建议 2 日内吃完。', review:'3栋李姐：草莓颗颗饱满，孩子一次吃半盒。' },
  { id:'tiger', name:'现捞冰鲜黑虎虾', detail:'400 g / 份', photo:'shrimp', base:29, tiers:[7900,6900,5900], category:'seafood',
    quality:['足斤足两去冰重','全程冰鲜'], origin:'广东湛江', storage:'收货后冷藏，当天煮熟食用；不能当天吃可密封冷冻。', review:'6栋刘叔：复秤去冰重，回家一煮肉质很紧实。' },
  { id:'chile', name:'智利车厘子 3J', detail:'500 g / 盒', photo:'cherries', base:9, tiers:[8900,7900,6900], category:'fruit',
    quality:['3J 大果规格','逐盒挑检'], origin:'智利中部产区', storage:'保持干燥冷藏，食用前冲洗。', review:'2栋张姐：果柄青绿，果肉脆甜。' },
  { id:'hairtail', name:'舟山带鱼段', detail:'500 g / 份', photo:'fish', base:24, tiers:[3900,3500,2900], category:'seafood',
    quality:['净重 500 g','分段净切'], origin:'浙江舟山', storage:'密封冷藏，当天烧制；暂不食用请冷冻。', review:'5栋吴姨：鱼段切得整齐，红烧省了不少工。' },
  { id:'eggs', name:'农家散养土鸡蛋 30 枚', detail:'30 枚 / 盒', photo:'eggs', base:34, tiers:[4900,4500,3900], category:'pantry',
    quality:['逐枚查裂','当天装盒'], origin:'安徽宣城', storage:'原盒冷藏，生熟分开，充分加热后食用。', review:'1栋何姐：到手每颗都完整，正好够一家人吃几天。' },
  { id:'pumpkin', name:'贝贝南瓜', detail:'约 1 kg / 份', photo:'pumpkin', base:19, tiers:[2900,2400,1990], category:'vegetable',
    quality:['粉糯小果','整果分装'], origin:'山东寿光', storage:'完整果放阴凉处，切开后密封冷藏并尽快食用。', review:'3栋周姐：蒸熟很粉糯，孩子用勺挖着吃。' },
];
const freshCategories = { all:'全部臻选', fruit:'时令鲜果', seafood:'现捞海鲜', vegetable:'当季蔬菜', pantry:'粮油蛋奶' };
const allocationLabels = ['基础礼遇价 · 满 10 份','满 30 份尊享价','满 50 份优选配额价'];
let freshCategory = 'all';

function freshImage(photo, label, loading = 'lazy') {
  return `<span class="fresh-media"><span class="fresh-fallback" aria-hidden="true">${label}</span><img data-fresh-image src="./assets/${photo}.jpg" alt="${label}" loading="${loading}" decoding="async"></span>`;
}

function carouselMarkup(label, slides) {
  return `<div class="photo-carousel" data-carousel role="group" aria-label="${label}">
    <div class="carousel-track" tabindex="0" aria-label="左右滑动或按方向键查看">
      ${slides.map((slide, index) => `<div class="carousel-slide" role="group" aria-label="第 ${index + 1} 张，共 ${slides.length} 张">${slide}</div>`).join('')}
    </div>
    <div class="carousel-controls">
      <div class="carousel-dots" role="group" aria-label="选择图片">
        ${slides.map((_, index) => `<button class="carousel-dot" data-slide="${index}" aria-label="第 ${index + 1} 张图片" aria-current="${index === 0}"><span></span></button>`).join('')}
      </div>
      <button class="carousel-toggle" data-carousel-toggle aria-label="暂停自动轮播">暂停</button>
    </div>
  </div>`;
}

const carouselControllers = new Map();
const carouselInterval = 3000;

function startCarousel(root) {
  const track = root.querySelector('.carousel-track');
  const count = track.children.length;
  const dots = [...root.querySelectorAll('[data-slide]')];
  const toggle = root.querySelector('[data-carousel-toggle]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController();
  const clone = track.firstElementChild.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  track.append(clone);
  let paused = motion.matches;
  let touching = false;
  let inView = false;
  let timer;
  let settling;
  const visible = () => inView && !document.hidden && (dialog.open === dialog.contains(root));
  const page = () => Math.min(count, Math.round(track.scrollLeft / (track.clientWidth || 1)));

  function move(index, smooth = true) {
    track.scrollTo({ left:index * track.clientWidth, behavior:smooth && !motion.matches ? 'smooth' : 'instant' });
  }

  function schedule() {
    clearTimeout(timer);
    if (paused || touching || !visible()) return;
    timer = setTimeout(() => {
      if (!visible() || touching) return;
      const current = page();
      if (current === count) move(0, false);
      else move(current + 1);
      schedule();
    }, carouselInterval);
  }

  function paint() {
    for (const [index, dot] of dots.entries()) dot.setAttribute('aria-current', String(index === page() % count));
  }

  function updateToggle() {
    toggle.textContent = paused ? '播放' : '暂停';
    toggle.setAttribute('aria-label', paused ? '播放自动轮播' : '暂停自动轮播');
    schedule();
  }

  const listen = (element, name, handler) => element.addEventListener(name, handler, { signal:events.signal, passive:name !== 'keydown' });
  listen(track, 'scroll', () => {
    paint();
    clearTimeout(settling);
    settling = setTimeout(() => {
      if (!touching && page() === count) move(0, false);
    }, 120);
    schedule();
  });
  listen(track, 'touchstart', () => { touching = true; schedule(); });
  const release = event => {
    if (event.touches.length) return;
    touching = false;
    if (page() === count) move(0, false);
    schedule();
  };
  listen(track, 'touchend', release);
  listen(track, 'touchcancel', release);
  listen(track, 'keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : -1;
    move((page() % count + step + count) % count);
    schedule();
  });
  listen(root, 'click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button === toggle) { paused = !paused; updateToggle(); return; }
    if (button.hasAttribute('data-slide')) move(Number(button.dataset.slide));
    else return;
    schedule();
  });
  listen(document, 'visibilitychange', schedule);
  listen(motion, 'change', event => { paused = event.matches; updateToggle(); });
  const viewport = new IntersectionObserver(([entry]) => {
    inView = entry.intersectionRatio >= 0.35;
    schedule();
  }, { threshold:0.35 });
  viewport.observe(track);
  updateToggle();
  return {
    schedule,
    stop() {
      events.abort();
      viewport.disconnect();
      clearTimeout(timer);
      clearTimeout(settling);
    },
  };
}

function syncCarousels() {
  for (const [root, controller] of carouselControllers) {
    if (!root.isConnected || (dialog.contains(root) && !dialog.open)) {
      controller.stop();
      carouselControllers.delete(root);
    } else controller.schedule();
  }
  for (const root of document.querySelectorAll('[data-carousel]')) {
    if (dialog.contains(root) && !dialog.open) continue;
    if (!carouselControllers.has(root)) carouselControllers.set(root, startCarousel(root));
  }
}

function groupTiers(item) {
  const level = tier(item);
  return `<div class="tiers" aria-label="邻里私享订购配额">${item.tiers.map((price,index) =>
    `<div class="tier ${index === level ? 'unlocked' : ''}"><span>${allocationLabels[index]}</span><strong>¥${price/100}</strong><small>${index === level ? '当前礼遇价' : index < level ? '已达标' : '待解锁'}</small></div>`).join('')}</div>`;
}

function freshGallery(item, loading = 'eager') {
  const images = [['外观全貌',item.photo], ['细节特写',item.id + '-cut'], ['现场去皮称重',item.id + '-scale']];
  return carouselMarkup(item.name + '商品图片', images.map(([label,photo], index) => `
    ${freshImage(photo, item.name + ' · ' + label, loading)}
    <span class="carousel-caption">${index + 1}/${images.length} · ${label}</span>`));
}

function showFreshDetail(item, fromSearch = false) {
  openInfo(item.name, `<div class="search-detail fresh-detail" data-detail-product="${item.id}">
    ${fromSearch ? '<button class="secondary" data-action="search-back">返回搜索结果</button>' : ''}
    <div class="fresh-gallery">${freshGallery(item)}</div>
    <p class="search-price" data-group-price>${searchPrice(item)}</p>
    <p>${item.detail} · <span data-joined>已预订 ${joined(item)}/${limit} 份</span></p>
    <section><h3>生鲜详情与溯源</h3><p>${item.origin}</p><p>储藏建议：${item.storage}</p><p>商品图片仅供参考，产地记录为演示。</p></section>
    <section><h3>本小区已购短评 · 演示</h3><p>“${item.review}”</p></section>
    <section><h3>邻里私享订购配额</h3>${groupTiers(item)}<p data-cutoff></p></section>
    ${searchAction(item)}
  </div>`);
  refreshGroups();
  dialog.scrollTop = 0;
  dialog.querySelector('.dialog-head button').focus({ preventScroll:true });
}

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
const demoOrder = {
  id:'YG-DEMO-BERRY', demo:true, total:5900, time:'历史订单 · 演示',
  items:[{ id:'dandong', name:'丹东红颜草莓', price:5900, quantity:1 }],
  deliveryLabel:'北门管家自提点',
};
const startingPoints = 150;
const defaults = { pointGrant:startingPoints, cart:{}, orders:[], requests:[], wishes:[], messages:[], pointEarnings:[], redemptions:[] };
let state;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  state = { ...defaults, ...saved };
  // Existing wallets already received the earlier 380-point signup grant.
  if (saved && saved.pointGrant === undefined && Object.hasOwn(saved, 'pointEarnings')) state.pointGrant = 380;
} catch {
  state = defaults;
}

// Older browser snapshots may contain missing or null wallet fields.
const validPoints = value => (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) &&
  Number.isSafeInteger(Number(value)) && Number(value) >= 0;
state.pointGrant = validPoints(state.pointGrant) ? Number(state.pointGrant) : startingPoints;
for (const field of ['pointEarnings','redemptions']) {
  const entries = Array.isArray(state[field]) ? state[field] : [];
  state[field] = entries.filter(entry => entry && validPoints(entry.points))
    .map(entry => ({ ...entry, points:Number(entry.points) }));
}

if (!state.orders.some(order => order.id === demoOrder.id)) state.orders.push({ ...demoOrder });

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

const residentAddress = { building:'3栋2单元', room:'301室' };
const giftCategories = { all:'全部好礼', home:'居家小家电', toys:'孩童玩具', daily:'日常生活' };
const gifts = [
  { id:'blender', category:'home', name:'便携无线榨汁杯', cost:2800, level:'family', stock:6, icon:'cup-soda' },
  { id:'kettle', category:'home', name:'智能恒温电水壶', cost:3800, level:'family', stock:4, icon:'thermometer' },
  { id:'cooker', category:'home', name:'家用多功能电煮锅', cost:5500, level:'family', stock:3, icon:'cooking-pot' },
  { id:'fan', category:'home', name:'桌面静音小风扇', cost:1280, level:'daily', stock:8, icon:'fan' },
  { id:'tiles', category:'toys', name:'磁力片百变拼搭积木套装', cost:2200, level:'family', stock:5, icon:'blocks' },
  { id:'board', category:'toys', name:'儿童双面磁性画板', cost:1080, level:'daily', stock:6, icon:'palette' },
  { id:'trucks', category:'toys', name:'合金回力工程车礼盒', cost:780, level:'daily', stock:8, icon:'truck' },
  { id:'books', category:'toys', name:'恐龙科普立体绘本套装', cost:580, level:'daily', stock:10, icon:'book-open' },
  { id:'voucher', category:'daily', name:'本小区跑腿免单券', cost:100, level:'starter', stock:20, icon:'ticket' },
  { id:'cloths', category:'daily', name:'厨房加厚懒人抹布 3 卷装', cost:180, level:'starter', stock:12, icon:'layers' },
  { id:'fruit-sample', category:'daily', name:'鲜榨果蔬试吃装/小份水果加赠券', cost:260, level:'starter', stock:12, icon:'apple' },
];
const giftLevels = { starter:'入门引流档', daily:'日常实用档', family:'高价值家庭大奖档' };
let giftCategory = 'all';
const errandMinimum = 500;
const pointsFor = (cents, isErrand = false) =>
  isErrand && cents < errandMinimum ? 0 : Math.floor(cents / 100);
const pointsEstimateText = (cents, isErrand = false) =>
  `本单预计可获 +${formatPoints(pointsFor(cents, isErrand))} 积分（¥1 = 1积分，累计可换家电好礼）`;
const formatPoints = value => value.toLocaleString('zh-CN');
const fulfillment = '随下次生鲜订单免费送上门或北门自提点领取';
const availablePoints = () => state.pointGrant
  + state.pointEarnings.reduce((sum, entry) => sum + entry.points, 0)
  - state.redemptions.reduce((sum, entry) => sum + entry.points, 0);
const giftStock = gift => Math.max(0, gift.stock - state.redemptions.filter(entry => entry.giftId === gift.id).length);

function recordOrder(order, isErrand = false) {
  state.orders.unshift(order);
  const points = pointsFor(order.total, isErrand);
  if (!points) return;
  const names = order.items.map(item => item.name).join('、');
  state.pointEarnings.unshift({
    orderId:order.id, label:(order.kind === 'service' ? '预约' : '购买') + names, points, time:order.time, at:Date.now(),
  });
}

function pointsEstimate(cents, isErrand = false) {
  return `<p class="points-estimate" data-points-estimate aria-live="polite">${pointsEstimateText(cents, isErrand)}
    ${isErrand && cents < errandMinimum ? '<br><small>跑腿订单单笔满 ¥5 起计积分。</small>' : ''}</p>`;
}

function nextGiftProgress(className) {
  const points = Math.max(0, availablePoints());
  const stocked = gifts.filter(gift => giftStock(gift) > 0).sort((a,b) => a.cost - b.cost);
  const target = stocked.find(gift => gift.cost > points);
  if (!target) return `<p class="${className}">${stocked.length ? '所有在库好礼均已达到兑换门槛。' : '好礼已兑完。'}</p>`;
  return `<label class="${className}">再攒 ${formatPoints(target.cost - points)} 积分可兑${target.name}
    <progress value="${points}" max="${target.cost}"></progress></label>`;
}

function latestRedemption(entry, success = false) {
  if (!entry) return '';
  return `<div class="redemption-result"${success ? ' role="status"' : ''}>
    <strong>${success ? '兑换成功' : '最近兑换'} · ${escapeHtml(entry.name)}</strong>
    <p>扣除 ${formatPoints(entry.points)} 积分 · 核销码 ${escapeHtml(entry.code)}</p>
    ${success ? `<p>${fulfillment}。</p>` : ''}
  </div>`;
}

function giftCards() {
  return gifts.filter(gift => giftCategory === 'all' || gift.category === giftCategory).map(gift => {
    const stock = giftStock(gift);
    const difference = gift.cost - availablePoints();
    const action = !stock ? '已兑完' : difference > 0 ? `还差 ${formatPoints(difference)} 积分` : '立即兑换';
    return `<article class="gift-card" data-gift="${gift.id}">
      <div class="gift-plate">${freshImage('gift-' + gift.id, gift.name)}</div><h3>${gift.name}</h3>
      <strong>${formatPoints(gift.cost)} 积分</strong><p class="muted">${giftLevels[gift.level]} · 剩余 ${stock} 件</p>
      <button class="primary" data-action="gift-confirm" data-id="${gift.id}" aria-label="${action} · ${gift.name}" ${stock && difference <= 0 ? '' : 'disabled'}>${action}</button>
    </article>`;
  }).join('');
}

function showGiftHall(reset = false, redeemed = null) {
  if (reset) giftCategory = 'all';
  openRewards('积分礼遇馆', `<div class="rewards-balance">
      <div><span class="membership-label">PRIVATE MEMBERSHIP · 私享会籍</span>可用积分<strong>${formatPoints(availablePoints())}</strong></div>
      <button class="secondary" data-action="points-history">积分明细</button>
      <button class="secondary" data-action="gift-history">兑换记录</button>
    </div>
    ${latestRedemption(redeemed, true)}
    ${nextGiftProgress('gift-goal')}
    <p class="muted rewards-rule">每实际消费 ¥1 = 1 邻里积分，按整元累计；跑腿订单单笔满 ¥5 起计积分。新用户赠 ${startingPoints} 积分。</p>
    <div class="service-filters" role="group" aria-label="好礼分类">${Object.entries(giftCategories).map(([id,label]) => `
      <button class="service-filter" data-action="gift-category" data-id="${id}" aria-pressed="${giftCategory === id}">${label}</button>`).join('')}</div>
    <div class="gift-grid">${giftCards()}</div>`);
  if (redeemed) {
    const result = dialog.querySelector('.redemption-result');
    result.tabIndex = -1;
    result.focus({ preventScroll:true });
  }
}

function openRewards(title, body) {
  openInfo(title, `<div class="rewards-content">${body}</div>`);
  dialog.scrollTop = 0;
  drawIcons();
  dialog.querySelector('.dialog-head button').focus({ preventScroll:true });
}

function showPointsHistory() {
  const entries = [
    ...state.pointEarnings.map(entry => ({ ...entry, amount:'+' + formatPoints(entry.points) })),
    ...state.redemptions.map(entry => ({ label:'兑换' + entry.name, time:entry.time, at:entry.at, amount:'−' + formatPoints(entry.points) })),
  ].sort((a, b) => b.at - a.at);
  entries.push({ label:'新用户赠送', amount:'+' + formatPoints(state.pointGrant) });
  openRewards('积分明细', `<p class="muted">当前可用 ${formatPoints(availablePoints())} 积分</p>
    <div>${entries.map(entry => `<div class="row"><div><strong>${escapeHtml(entry.label)}</strong><p class="muted">${escapeHtml(entry.time || '')}</p></div><span class="status">${entry.amount} 积分</span></div>`).join('')}</div>
    <button class="secondary" data-action="gift-back">返回兑换馆</button>`);
}

function showGiftHistory() {
  openRewards('礼品兑换记录', `<p class="muted">当前可用 ${formatPoints(availablePoints())} 积分</p>${state.redemptions.map(entry => `<article class="service-order">
    <strong>${escapeHtml(entry.name)} · ${formatPoints(entry.points)} 积分</strong>
    <p>核销码 ${escapeHtml(entry.code)}</p><p class="muted">${escapeHtml(entry.address)} · ${escapeHtml(entry.time)}</p>
    <p class="muted">${fulfillment}</p></article>`).join('') || '<p class="muted">暂无兑换记录。</p>'}
    <button class="secondary" data-action="gift-back">返回兑换馆</button>`);
}

function confirmGift(id) {
  const gift = gifts.find(item => item.id === id);
  if (!gift || !giftStock(gift) || availablePoints() < gift.cost) return;
  openRewards('确认兑换', `<div class="gift-confirmation">
    <h3>${gift.name}</h3><p>将扣除 ${formatPoints(gift.cost)} 积分</p>
    <p>绑定地址：阳光花园一号院 · ${residentAddress.building} ${residentAddress.room}</p>
    <p>${fulfillment}。</p>
    <div class="search-actions"><button class="secondary" data-action="gift-back">返回兑换馆</button>
    <button class="primary" data-action="gift-redeem" data-id="${gift.id}">确认兑换</button></div></div>`);
}

function redeemGift(id) {
  const gift = gifts.find(item => item.id === id);
  if (!gift || !giftStock(gift) || availablePoints() < gift.cost) {
    showGiftHall();
    return;
  }
  const address = `${residentAddress.building} ${residentAddress.room}`;
  const code = 'YG-' + Date.now().toString(36).toUpperCase() + '-' + (state.redemptions.length + 1);
  const entry = { giftId:id, name:gift.name, points:gift.cost, code, address, time:timestamp(), at:Date.now() };
  state.redemptions.unshift(entry);
  if (!save()) {
    state.redemptions.shift();
    openRewards('暂时无法兑换', '<p>浏览器无法保存兑换记录，积分和库存未扣减。</p><button class="secondary" data-action="gift-back">返回兑换馆</button>');
    return;
  }
  render();
  showGiftHall(false, entry);
}

function freshPage() {
  return `<button class="fresh-guarantee" data-action="fresh-guarantee" aria-haspopup="dialog">
    ${icon('shield-check')}<span>早市首批次买手精选 · 到站逐盒复检去皮重 · 坏果 1 分钟秒赔</span>
  </button>
  <section id="catalog" aria-labelledby="catalog-title">
    <div class="service-filters fresh-filters" role="group" aria-label="鲜食分类">${Object.entries(freshCategories).map(([id,label]) =>
      `<button class="service-filter" data-action="fresh-category" data-id="${id}" aria-pressed="${id === freshCategory}">${label}</button>`).join('')}</div>
    <h1 id="catalog-title" class="content-title">精选鲜食</h1>
    <div class="group-products">${direct.map(item => `<article class="group-product" data-product="${item.id}" ${freshCategory === 'all' || item.category === freshCategory ? '' : 'hidden'}>
      ${freshGallery(item, 'lazy')}
      <h2><button class="fresh-title" data-action="fresh-detail" data-id="${item.id}">${item.name}</button></h2>
      <p class="muted product-summary">${item.quality.join(' · ')} · ${item.detail}</p>
      <div class="product-purchase">
        <button class="product-price" data-action="fresh-detail" data-id="${item.id}" aria-label="查看礼遇价与商品详情 · ${item.name}"><strong class="price" data-group-price></strong><small>阶梯礼遇价</small></button>
        <button class="primary join" data-action="add" data-id="${item.id}"></button>
      </div>
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
    card.querySelector('[data-group-price]').textContent = money(displayPrice(item));
    const button = card.querySelector('.join');
    const label = joined(item) >= limit ? '本批已订满' : '加入购物袋';
    button.disabled = label !== '加入购物袋';
    button.textContent = label;
    button.setAttribute('aria-label', `${label} · ${item.name}`);
  }
  const detail = dialog.open ? dialog.querySelector('[data-detail-product]') : null;
  if (!detail) return;
  const item = direct.find(product => product.id === detail.dataset.detailProduct);
  const level = tier(item);
  detail.querySelector('[data-group-price]').textContent = searchPrice(item);
  detail.querySelector('[data-cutoff]').textContent = remaining ? `距今晚 22:00 截单还剩 ${clock}` : '已过 22:00 截单参考时间 · 仍可下单';
  detail.querySelector('[data-joined]').textContent = `已预订 ${joined(item)}/${limit} 份`;
  detail.querySelectorAll('.tier').forEach((element,index) => {
    element.classList.toggle('unlocked', index === level);
    element.querySelector('small').textContent = index === level ? '当前礼遇价' : index < level ? '已达标' : '待解锁';
  });
  const action = detail.querySelector('[data-action="search-add"]');
  const label = joined(item) >= limit ? '本批已订满' : '加购';
  action.disabled = label !== '加购';
  action.textContent = label;
  action.setAttribute('aria-label', `${label} · ${item.name}`);
}

function openInfo(title, content) {
  dialog.classList.remove('checkout-sheet');
  dialogContent.innerHTML = `<header class="dialog-head"><h2 id="dialog-title">${title}</h2>
    <button class="icon-button" data-action="close" aria-label="关闭">×</button></header>${content}`;
  if (!dialog.open) dialog.showModal();
  syncCarousels();
}

const pageHead = (title, description) => `<header class="page-head"><h1>${title}</h1><p>${description}</p></header>`;

const serviceCategories = {
  cleaning:'深度保洁',
  repairs:'清洗检修',
  errands:'急件跑腿',
  pets:'上门宠物照料',
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
// Additional bookable services are discoverable through global search.
const extraServices = [
  { id:'ac-clean', category:'repairs', name:'空调挂机清洗', price:6800, unit:'/ 台', scope:'含挂机滤网、蒸发器及接水盘清洗，完工试机。', worker:'王师傅', households:46 },
  { id:'ac-repair', category:'repairs', name:'空调维修 · 加氟', price:12000, unit:'起', scope:'先测压力、检查泄漏，再按机型及制冷剂用量确认报价；维修配件另行确认。', worker:'王师傅', households:46 },
  { id:'urgent-errand', category:'errands', name:'急事跑腿代办', price:500, unit:'/ 单', scope:'含小区内单次紧急代办或物品递送。', worker:'赵阿姨', households:32 },
  { id:'switch', category:'repairs', name:'水电维修 · 更换开关', price:3000, unit:'工时费', scope:'含断电检查、单个开关更换和通电测试；开关由住户提供。', worker:'陈师傅', households:26 },
  { id:'lock', category:'repairs', name:'公安备案开锁换锁', price:8000, unit:'起', scope:'上门核验住户身份及房屋使用权；换锁材料和特殊锁型先报价。', worker:'许师傅', households:21 },
  { id:'appliance', category:'repairs', name:'洗衣机/冰箱上门检测', price:3000, unit:'/ 次', scope:'含一次上门故障检测；维修工时和配件另行确认。', worker:'刘师傅', households:37 },
  { id:'city-errand', category:'errands', name:'同城急件跑腿', icon:'bike', price:1800, unit:'起', scope:'同城文件或轻便物品取送，距离与费用预约前确认。', worker:'赵阿姨' },
  { id:'pet-visit', category:'pets', name:'上门喂宠与基础照料', icon:'paw-print', price:4900, unit:'/ 次', scope:'按业主指引添粮换水、清理食盆与猫砂，完成后反馈。', worker:'林管家' },
];
const bookableServices = [...neighborhoodServices, ...extraServices];
const hotSearches = ['修空调 / 加氟','找跑腿 / 代取快递','通下水 / 修水管','日常保洁 / 擦玻璃','丹东草莓'];
const searchAliases = {
  'ac-clean':'修空调 空调不制冷 洗空调 清洗空调 空调清洗与维修',
  'ac-repair':'修空调 空调不制冷 洗空调 加氟 空调清洗与维修',
  parcel:'找跑腿 跑跑 跑腿 拿快递 取快递 代取快递 驿站',
  'city-errand':'同城急件 送文件 紧急配送',
  'pet-visit':'喂猫 喂狗 喂宠 宠物照料 上门喂养',
  'urgent-errand':'找跑腿 跑跑 跑腿 急事跑腿 紧急代办',
  drain:'通下水 修水管 管道疏通 堵塞 通马桶 地漏',
  faucet:'通下水 修水管 水电维修 换水龙头 漏水',
  switch:'水电维修 换开关 修开关 电工',
  housekeeping:'日常保洁 擦玻璃 精细保洁 打扫卫生 家政',
  lock:'开锁 换锁 锁匠 公安备案',
  appliance:'家电维修 修家电 修洗衣机 修冰箱 冰箱不制冷 洗衣机故障',
  dandong:'丹东草莓 红颜草莓 水果 生鲜',
  tiger:'黑虎虾 鲜虾 海鲜 生鲜',
  chile:'车厘子 樱桃 水果 生鲜',
  hairtail:'带鱼 海鲜 生鲜',
  eggs:'鸡蛋 土鸡蛋 蛋奶 粮油 生鲜',
  pumpkin:'贝贝南瓜 当季蔬菜 青菜 生鲜',
};
const searchEndorsements = {
  parcel:'赵阿姨 · 本小区已服务 46 户',
  trash:'顾叔 · 本小区已服务 18 户',
  takeout:'赵阿姨 · 本小区已服务 46 户',
  tools:'顾叔 · 本小区已服务 18 户',
};
const searchEntries = [...bookableServices, ...direct];
let searchQuery = '';
const normalizeSearch = value => value.normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');

function searchMatches(item, query) {
  const groups = query.split(/[/／|、]+/).map(group => group.trim().split(/\s+/).map(normalizeSearch).filter(Boolean)).filter(group => group.length);
  if (!groups.length) return false;
  const keywords = [item.name, item.scope || item.detail, searchAliases[item.id] || '', serviceCategories[item.category] || ''].map(normalizeSearch);
  return groups.some(group => group.every(token => keywords.some(keyword => keyword.includes(token))));
}

function searchPrice(item) {
  return item.tiers ? `${servicePrice(displayPrice(item))} / 份 · ${tier(item) < 0 ? '基础礼遇参考价' : '当前礼遇价'}` : `${servicePrice(item.price)} ${item.unit}`;
}

function searchEndorsement(item) {
  if (item.worker) return `${item.worker} · ${item.households ? `本小区已服务 ${item.households} 户` : '实名资料'}`;
  return searchEndorsements[item.id] || '买手精选 · 到货复秤';
}

function searchAction(item) {
  if (!item.tiers) return `<button class="primary" data-action="book-service" data-id="${item.id}" aria-label="立即预约 · ${item.name}">立即预约</button>`;
  const unavailable = joined(item) >= limit ? '本批已订满' : '';
  return `<button class="primary" data-action="search-add" data-id="${item.id}" aria-label="${unavailable || '加购'} · ${item.name}" ${unavailable ? 'disabled' : ''}>${unavailable || '加购'}</button>`;
}

function paintSearch() {
  const results = dialog.querySelector('#search-results');
  const items = searchEntries.filter(item => searchMatches(item, searchQuery));
  dialog.querySelector('#search-count').textContent = !searchQuery.trim() ? '' : `找到 ${items.length} 项`;
  results.innerHTML = items.map(item => `<article class="search-result" data-search-item="${item.id}">
    <button class="search-result-title" data-action="search-detail" data-id="${item.id}">${item.name}</button>
    <p class="search-price">${searchPrice(item)}</p>
    <p class="search-endorsement">管家实测背书（演示） · ${searchEndorsement(item)}</p>
    <div class="search-actions"><button class="secondary" data-action="search-detail" data-id="${item.id}" aria-label="查看报价详情 · ${item.name}">查看报价详情</button>${searchAction(item)}</div>
  </article>`).join('') || `<p class="muted">${searchQuery.trim() ? '暂无匹配，可试试服务名、商品名或热搜词。' : '试试输入需求，或点选上方热搜。'}</p>`;
}

function showSearch(remember = false) {
  if (!remember) searchQuery = '';
  openInfo('全局服务与生鲜搜索', `<div class="search-panel">
    <label class="field">搜索服务或生鲜<input type="search" id="search-input" autocomplete="off" placeholder="搜服务/生鲜：如 修空调、找跑腿、保洁、草莓..."></label>
    <h3>本小区高频热搜</h3>
    <div class="hot-searches">${hotSearches.map(label => `<button class="secondary" data-action="hot-search" data-id="${label}">${label}</button>`).join('')}</div>
    <p id="search-count" class="muted" role="status"></p>
    <div id="search-results"></div>
  </div>`);
  dialog.scrollTop = 0;
  const input = dialog.querySelector('#search-input');
  input.value = searchQuery;
  paintSearch();
  if (!remember) input.focus({ preventScroll:true });
  else dialog.querySelector('.dialog-head button').focus({ preventScroll:true });
}

function showSearchDetail(id) {
  const item = searchEntries.find(entry => entry.id === id);
  if (!item) return;
  if (item.tiers) return showFreshDetail(item, true);
  const details = `<p>${item.scope}</p>`;
  const review = '“预约前就能看到收费明细，上门后按约定做完。”';
  openInfo(item.name, `<div class="search-detail">
    <button class="secondary" data-action="search-back">返回搜索结果</button>
    <p class="search-price">${searchPrice(item)}</p>
    <p class="search-endorsement">管家实测背书（演示） · ${searchEndorsement(item)}</p>
    <section><h3>服务明细</h3>${details}</section>
    <section><h3>零加价承诺</h3><p>按已确认的服务与价格结算。额外材料或工时先说明并经住户同意。</p></section>
    <section><h3>用户评价 · 演示</h3><p>${review}</p></section>
    ${searchAction(item)}
  </div>`);
  dialog.scrollTop = 0;
  dialog.querySelector('[data-action="search-back"]').focus();
}

const buildings = ['1 栋','2 栋','3 栋','5 栋','6 栋'];
const rooms = ['101','102','201','202','301','302','401','402','501','502','601','602'];
const visitWindows = ['09:00–11:00','11:00–13:00','14:00–16:00','16:00–18:00','18:00–20:00'];
const matchingStatus = '管家已接单 · 正在匹配本小区人员';
let serviceCategory = 'cleaning';

const servicePrice = cents => '¥' + (cents / 100).toString();

function selectPage() {
  const items = bookableServices.filter(item => item.category === serviceCategory);
  return `<header class="simple-heading"><h1>到家服务</h1><p class="muted">人员实名资料与服务报价为演示。</p></header>
  <div class="service-filters" role="group" aria-label="服务分类">
    ${Object.entries(serviceCategories).map(([id, label]) => `<button class="service-filter" data-action="service-category" data-id="${id}" aria-pressed="${id === serviceCategory}">${label}</button>`).join('')}
  </div>
  <section class="service-grid" aria-label="${serviceCategories[serviceCategory]}">
    ${items.map(item => `<article class="service-card">
      <div class="service-card-head"><div><h2>${item.name}</h2><p class="service-price"><strong>${servicePrice(item.price)}</strong> <small>${item.unit}</small></p></div></div>
      <p class="muted">${item.worker || '社区管家'} · 实名资料（演示）</p>
      <p class="service-scope">${item.scope}</p>
      <button class="primary service-book" data-action="book-service" data-id="${item.id}" aria-label="预约上门 · ${item.name}">一键预约</button>
    </article>`).join('')}
  </section>`;
}

function availableWindows(item) {
  const tomorrow = new Date(Date.now() + chinaOffset + 86400000).toISOString().slice(0, 10);
  const windows = visitWindows.map(window => `${tomorrow} ${window}`);
  return item.category === 'errands' ? ['尽快送达', ...windows] : windows;
}

function bookingOptions(values, selected) {
  return values.map(value => `<option ${value === selected ? 'selected' : ''}>${value}</option>`).join('');
}

function showBooking(id, previous) {
  const item = bookableServices.find(service => service.id === id);
  if (!item) return;
  const [building, room] = previous?.address.match(/^(.*栋) (\d+) 室$/)?.slice(1) || [];
  openInfo('预约下单', `<p class="booking-item"><strong>${item.name}</strong> <span>${servicePrice(item.price)} ${item.unit}</span></p>
    ${pointsEstimate(item.price, item.category === 'errands')}
    <form id="booking-form" data-service="${item.id}">
      <div class="booking-address">
        <label class="field">楼栋<select name="building" required><option value="">选择楼栋</option>${bookingOptions(buildings, building)}</select></label>
        <label class="field">门牌号<select name="room" required><option value="">选择门牌号</option>${bookingOptions(rooms, room)}</select></label>
      </div>
      <label class="field">期望上门时间段<select name="slot" required><option value="">选择时间段</option>${bookingOptions(availableWindows(item))}</select></label>
      <label class="field">备注说明（选填）<textarea name="notes" rows="3" maxlength="200" placeholder="可填写服务内容或上门说明"></textarea></label>
      <button class="primary service-book" type="submit">提交演示预约</button>
    </form>`);
  dialog.scrollTop = 0;
  dialog.querySelector('[name="building"]').focus({ preventScroll:true });
}

function orderDetails(order) {
  const reorder = `<button class="secondary" data-action="reorder" data-id="${escapeHtml(order.id)}">再次下单</button>`;
  if (order.kind === 'service') {
    const { address, slot, notes, unit } = order.booking;
    return `<article class="service-order community-order">
      <strong>${escapeHtml(order.items[0].name)}</strong>
      <p class="muted">${escapeHtml(address)} · ${escapeHtml(slot)}</p>
      ${notes ? `<p class="muted">备注：${escapeHtml(notes)}</p>` : ''}
      <p class="muted">${escapeHtml(order.id)} · ${servicePrice(order.total)} ${escapeHtml(unit)} · ${escapeHtml(order.time)}</p>
      <div class="order-actions"><span class="status">${escapeHtml(claimStatus(order) || order.status)}</span>${reorder}</div>
    </article>`;
  }
  return `<article class="service-order community-order">
    <strong>${order.items.map(item => `${escapeHtml(item.name)} × ${item.quantity}`).join('、')}</strong>
    <p class="muted">${escapeHtml(order.id)} · ${money(order.total)}</p>
    <p class="muted">${escapeHtml(order.time)} · ${escapeHtml(order.deliveryLabel || deliveryOptions.pickup.label)}</p>
    <div class="order-actions"><span class="status">${claimStatus(order) || (order.demo ? '已完成' : deliveryOptions[order.delivery]?.status || '待自提')}</span>${reorder}</div>
  </article>`;
}

const issueTypes = ['坏果/磕碰','分量不足','服务不满意'];
const demoDamage = './assets/berry-damage.jpg';
let claimTimer;
let claimPhotoUrl;

function claimStatus(order) {
  if (!order.claim) return '';
  if (order.claim.reviewUntil) return '管家审核中';
  return order.claim.method === 'refund' ? '售后已退款' : '已安排随单补发';
}

function claimResult(claim) {
  return claim.method === 'refund'
    ? `已自动通过！赔付款 ¥${claim.amount / 100} 已退回账户，无需退回商品`
    : '已自动通过！下次随单免费补发，无需退回商品';
}

const sampleCases = [
  { id:'SH-20261124-001', customer:'li', owner:'3栋2单元 李女士', name:'丹东红颜草莓', issue:'个别草莓运输轻微软磕', image:demoDamage, method:'refund', amount:1280, at:Date.parse('2026-11-24T17:42:00+08:00'), duration:80000, note:'李管家：核验果盒与压伤照片，按受损比例退款。', penalty:2 },
  { id:'SH-20261123-002', customer:'wang', owner:'5栋 王先生', name:'现捞冰鲜黑虎虾', issue:'去冰后复秤，净重与标示有差额', image:'./assets/tiger-scale.jpg', method:'replacement', amount:0, at:Date.parse('2026-11-23T18:06:00+08:00'), duration:105000, note:'周管家：已登记差额，下次生鲜订单随单补足。', penalty:1 },
  { id:'SH-20261122-003', customer:'chen', owner:'2栋 陈女士', name:'更换水龙头/软管', issue:'更换后接口仍有轻微渗水', image:'./assets/faucet-evidence.jpg', method:'refund', amount:600, at:Date.parse('2026-11-22T15:20:00+08:00'), duration:156000, note:'陈管家：复核服务记录，退回部分工时费并通知师傅复查。', penalty:2 },
];
const formatCaseTime = at => new Date(at).toLocaleString('zh-CN', {
  timeZone:'Asia/Shanghai', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit',
});

function ownCases() {
  return state.orders.filter(order => order.claim).map(order => {
    const claim = order.claim;
    return {
      id:claim.id || 'SH-' + order.id, customer:'li', owner:'3栋2单元 李女士',
      name:order.items.map(item => item.name).join('、'), issue:claim.issue,
      reason:claim.reason, image:claim.image, method:claim.method, amount:claim.amount,
      at:claim.at, duration:claim.duration, pending:Boolean(claim.reviewUntil),
      note:claim.method === 'refund' ? '管家已核验订单及凭证，按演示规则原路退款。' : '管家已核验订单及凭证，安排下次随单补发。',
      penalty:2, local:true,
    };
  }).reverse().sort((a, b) => (b.at || 0) - (a.at || 0));
}

function caseResult(record) {
  if (record.pending) return '管家审核中';
  return record.method === 'refund' ? `秒退 ${money(record.amount)} · 无需退货` : '随单免费补发 · 无需退货';
}

function caseDuration(record) {
  if (record.pending) return '等待办结';
  if (!record.duration) return '旧记录 · 未记录耗时';
  const seconds = record.duration / 1000;
  const minutes = Math.floor(seconds / 60);
  return `${minutes ? minutes + '分' : ''}${seconds % 60}秒办结`;
}

function caseEvidence(record, large = false) {
  const image = record.image;
  const safe = image === demoDamage || (!record.local && image) ||
    /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(image || '');
  return safe ? `<img class="case-evidence ${large ? 'case-evidence-large' : ''}" src="${escapeHtml(image)}" alt="售后凭证" loading="lazy">`
    : '<span class="case-evidence-placeholder">凭证未公开或未保存</span>';
}

function caseCard(record, fromCustomer = '') {
  return `<article class="case-card">
    <button class="case-card-button" data-action="case-detail" data-id="${escapeHtml(record.id)}" data-customer="${fromCustomer}">
      ${caseEvidence(record)}
      <span><strong>${escapeHtml(record.name)}</strong><small>${escapeHtml(record.id)} · ${escapeHtml(record.owner)}</small>
      <small>${escapeHtml(record.reason || record.issue)}</small><strong class="case-result">${caseResult(record)}</strong><small>${caseDuration(record)}</small></span>
    </button><p class="muted">${escapeHtml(record.pending ? '已收件，正在核验。' : record.note)}</p>
  </article>`;
}

function showCase(id, customer) {
  const profile = customers.find(item => item.id === customer);
  const records = profile ? customerData(profile).claims : ownCases();
  const record = records.find(item => item.id === id);
  if (!record) return;
  const end = record.at && record.duration ? record.at + record.duration : null;
  const final = record.method === 'refund' ? '退款原路到账' : '确认随单补发';
  const steps = [
    ['提交凭证', record.at],
    ['AI / 管家核验', null],
    [final, end],
    [`同步扣减供应商考核分（−${record.penalty} 分）`, end],
  ];
  openInfo('完整售后详情', `<div class="ops-detail">
    ${customer ? `<button class="secondary" data-action="customer-detail" data-id="${customer}">返回客户详情</button>` : ''}
    <h3>${escapeHtml(record.name)}</h3><p class="muted">${escapeHtml(record.id)} · ${escapeHtml(record.owner)}</p>
    <p>问题原因：${escapeHtml(record.reason || record.issue)}</p>${caseEvidence(record, true)}
    <p class="case-result">${caseResult(record)} · ${caseDuration(record)}</p>
    <p class="muted">${escapeHtml(record.pending ? '已收件，正在核验。' : record.note)}</p>
    <h3>申请时间线 · 演示</h3>
    <ol class="case-timeline">${steps.map(([label,time], index) => `<li><strong>${label}</strong>
      <span>${record.pending && index > 0 ? (index === 1 ? '核验中' : '待处理') : time ? formatCaseTime(time) : index === 1 ? '核验通过' : '旧记录未留存时间'}</span></li>`).join('')}</ol>
  </div>`);
  dialog.scrollTop = 0;
}

function servicePage() {
  const orders = state.orders.filter(order => !order.claim);
  const oldRequests = state.requests.map(request => `<li>${escapeHtml(request.type)} · ${escapeHtml(request.detail)}</li>`).join('');
  return `<header class="simple-heading"><h1>管家售后</h1></header>
  <section class="panel"><h2>一键拍照极速赔付</h2>
    ${orders.length ? `<label class="field">选择订单<select id="claim-order">
      ${orders.map(order => `<option value="${escapeHtml(order.id)}">${order.items.map(item => escapeHtml(item.name)).join('、')} · ${money(order.total)}</option>`).join('')}
      </select></label><button class="primary" data-action="claim-selected">申请售后赔付</button>`
      : '<p class="muted">当前没有可申请售后的订单。</p>'}
  </section>
  <section class="panel"><h2>我的售后记录</h2>
    <div id="case-list">${ownCases().map(record => caseCard(record)).join('') || '<p class="muted">暂无个人售后记录。</p>'}</div>
    ${oldRequests ? `<details><summary>历史售后登记</summary><ul>${oldRequests}</ul></details>` : ''}
  </section>`;
}

function ownerMessages() {
  return `
    <form id="wish-form">
      <label class="field">留言去向<select name="audience"><option value="wish">发布到小区许愿池</option><option value="private">仅留言给专属管家</option></select></label>
      <label class="field">想告诉管家什么？<textarea name="wish" required maxlength="160" rows="2" placeholder="希望礼宾下次为您甄选哪些水果或海鲜？"></textarea></label>
      <button class="primary" type="submit">提交留言</button>
    </form>
    <h3 class="wish-heading">邻里许愿列表</h3><p class="muted">留言与投票仅保存在当前浏览器。</p>
    <div id="wish-list">${state.wishes.map(wish => `<article class="wish-row">
      <p>${escapeHtml(wish.text)}</p>
      <button class="wish-vote" data-action="vote" data-id="${escapeHtml(wish.id)}" aria-pressed="${Boolean(wish.voted)}" aria-label="点赞：${escapeHtml(wish.text)}">♥ ${Number(wish.voted || 0)}</button>
    </article>`).join('') || '<p class="muted">还没有公开许愿。</p>'}</div>
    ${state.messages.length ? `<details class="private-messages"><summary>我的管家留言</summary>${state.messages.map(message => `<p>${escapeHtml(message)}</p>`).join('')}</details>` : ''}
  `;
}

function clearClaimPhoto() {
  if (claimPhotoUrl) URL.revokeObjectURL(claimPhotoUrl);
  claimPhotoUrl = undefined;
}

function showClaim(id) {
  const order = state.orders.find(item => item.id === id);
  if (!order || order.claim) return;
  clearClaimPhoto();
  openInfo('申请售后赔付', `<form id="claim-form">
    <p class="muted">${order.items.map(item => escapeHtml(item.name)).join('、')} · ${escapeHtml(order.id)}</p>
    <input type="hidden" name="order" value="${escapeHtml(order.id)}">
    <label class="field">问题类型<select name="issue" required><option value="">选择问题类型</option>${bookingOptions(issueTypes)}</select></label>
    <label class="field">补充说明（选填）<textarea name="reason" maxlength="160" rows="2"></textarea></label>
    <div class="photo-actions">
      <label class="field">选择本地照片<input type="file" name="photo" accept="image/*"></label>
      <button type="button" class="icon-button" data-action="demo-photo">填入演示破损图</button>
    </div>
    <img class="claim-photo" alt="所选售后照片预览" hidden>
    <p data-photo-status class="muted" role="status"></p>
    <fieldset class="delivery"><legend>期望处理方式</legend>
      <label class="delivery-option"><input type="radio" name="method" value="refund" required>按比例秒退金额</label>
      <label class="delivery-option"><input type="radio" name="method" value="replacement" required>下次随单免费补发</label>
    </fieldset>
    <button class="primary service-book" type="submit">提交售后申请</button>
    <small class="muted">赔付为演示，凭证缩略图仅保存到当前浏览器。</small>
  </form>`);
}

function displayClaimPhoto(source, label) {
  const form = dialog.querySelector('#claim-form');
  const photo = form.querySelector('.claim-photo');
  delete form.dataset.photoFailed;
  photo.src = source;
  photo.hidden = false;
  form.querySelector('[data-photo-status]').textContent = label;
}

function completeReviews() {
  clearTimeout(claimTimer);
  const now = Date.now();
  const pending = state.orders.filter(order => order.claim?.reviewUntil);
  const completed = pending.filter(order => order.claim.reviewUntil <= now);
  for (const order of completed) delete order.claim.reviewUntil;
  if (completed.length) {
    const saved = save();
    if (['#service','#community'].includes(location.hash)) render();
    const active = completed.find(order => order.id === dialog.querySelector('[data-review]')?.dataset.review);
    if (active && dialog.open) openInfo('售后审核结果', `<p class="claim-result">${claimResult(active.claim)}</p><p class="muted">演示赔付 · 订单状态已更新</p>`);
    else if (location.hash === '#service') notify('售后审核已通过', saved);
  }
  const next = pending.filter(order => order.claim.reviewUntil).map(order => order.claim.reviewUntil);
  if (next.length) claimTimer = setTimeout(completeReviews, Math.max(0, Math.min(...next) - now));
}

function rejectClaimPhoto(form) {
  clearClaimPhoto();
  form.elements.photo.value = '';
  const photo = form.querySelector('.claim-photo');
  photo.hidden = true;
  photo.removeAttribute('src');
  form.dataset.photoFailed = 'true';
  form.querySelector('[data-photo-status]').textContent = '图片读取失败，请重新选择';
}

async function evidenceThumbnail(image) {
  try {
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) return null;
    if (image.getAttribute('src') === demoDamage) return demoDamage;
    const ratio = Math.min(1, 360 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const thumbnail = canvas.toDataURL('image/jpeg', 0.72);
    return /^data:image\/jpeg;base64,./.test(thumbnail) ? thumbnail : null;
  } catch {
    return null;
  }
}

async function submitClaim(form) {
  const { order:id, issue, method, reason } = Object.fromEntries(new FormData(form));
  const order = state.orders.find(item => item.id === id);
  if (!order || order.claim || !issueTypes.includes(issue) || !['refund','replacement'].includes(method)) return;
  if (form.querySelector('.claim-photo').hidden) {
    if (!form.dataset.photoFailed) form.querySelector('[data-photo-status]').textContent = '请选择本地照片或填入演示破损图。';
    return;
  }
  const submit = form.querySelector('[type="submit"]');
  if (submit.disabled) return;
  submit.disabled = true;
  const photo = form.querySelector('.claim-photo');
  const source = photo.src;
  const image = await evidenceThumbnail(photo);
  if (!form.isConnected || !dialog.open || order.claim) return;
  submit.disabled = false;
  if (photo.hidden || photo.src !== source) return;
  if (!image) {
    rejectClaimPhoto(form);
    return;
  }
  const refund = order.demo ? 1280 : Math.round(order.total * 0.2);
  const at = Date.now();
  const duration = 1500;
  order.claim = { id:'SH-' + order.id, issue, reason:reason.trim(), method, image,
    amount:method === 'refund' ? refund : 0, at, duration, reviewUntil:at + duration };
  if (!save()) {
    delete order.claim;
    form.querySelector('[data-photo-status]').textContent = '无法保存售后申请，请检查浏览器存储空间。';
    return;
  }
  clearClaimPhoto();
  render();
  openInfo('管家极速审核', `<div class="claim-review" data-review="${escapeHtml(id)}" role="status">
    <span class="review-spinner" aria-hidden="true"></span><p>正在核对订单与照片…</p></div>`);
  completeReviews();
}

function orderSavings(items) {
  return items.reduce((sum, item) => {
    const original = direct.find(product => product.id === item.id)?.tiers[0] ?? item.price;
    return sum + Math.max(0, original - item.price) * item.quantity;
  }, 0);
}

const pickupCode = 'YG-3-02-0816';
const inviteCode = 'YG3-28';
let avatarTaps = 0;
let lastAvatarTap = 0;

const dashboardMetrics = [
  ['覆盖户数','1,500 户','阳光花园一号院'],
  ['种子渗透率','21.3%','320 户 / 1,500 户'],
  ['生鲜周复购率','64%','按周统计下单住户'],
  ['单户获客成本','¥3.2','种子住户获客口径'],
  ['生鲜平均毛利率','28.5%','生鲜销售额口径'],
  ['综合月流水预估','¥42,800','生鲜及社区服务'],
];
const buildingReach = [
  ['1 栋',18,100], ['2 栋',22,100], ['3 栋',28,100], ['5 栋',16,100], ['6 栋',25,100],
];

const customers = [
  { id:'li', address:'3栋201', name:'李女士', total:148000, count:14, tags:['生鲜','保洁'], items:['丹东红颜草莓','三居室深度日常保洁','农家散养土鸡蛋 30 枚'], redeemed:100 },
  { id:'wang', address:'5栋1102', name:'王先生', total:89000, count:9, tags:['海鲜','空调维修'], items:['现捞冰鲜黑虎虾','空调挂机清洗','舟山带鱼段'], redeemed:0 },
  { id:'chen', address:'2栋602', name:'陈女士', total:96000, count:11, tags:['水电维修','时令鲜果'], items:['更换水龙头/软管','智利车厘子 3J','丹东红颜草莓'], redeemed:100 },
  { id:'zhou', address:'1栋302', name:'周先生', total:62000, count:6, tags:['粮油蛋奶','海鲜'], items:['农家散养土鸡蛋 30 枚','舟山带鱼段'], redeemed:0 },
  { id:'xu', address:'6栋401', name:'许女士', total:122000, count:12, tags:['日常保洁','当季蔬菜'], items:['三居室深度日常保洁','贝贝南瓜'], redeemed:180 },
  { id:'zhao', address:'3栋902', name:'赵先生', total:46000, count:7, tags:['跑腿','时令鲜果'], items:['代取驿站快递','丹东红颜草莓','智利车厘子 3J'], redeemed:100 },
  { id:'liu', address:'5栋702', name:'刘女士', total:75000, count:8, tags:['海鲜','粮油蛋奶'], items:['现捞冰鲜黑虎虾','舟山带鱼段','农家散养土鸡蛋 30 枚'], redeemed:0 },
];
const customerMoney = cents => '¥' + (cents / 100).toLocaleString('zh-CN', { minimumFractionDigits:2, maximumFractionDigits:2 });
let customerQuery = '';
let customerSort = 'spend';
let customerClaimsOnly = false;

function customerData(customer) {
  const local = customer.id === 'li';
  const orders = local ? state.orders.filter(order => !order.demo) : [];
  const claims = [...(local ? ownCases() : []), ...sampleCases.filter(record => record.customer === customer.id)];
  return {
    ...customer, orders, claims,
    total:customer.total + orders.reduce((sum, order) => sum + order.total, 0),
    count:customer.count + orders.length,
    earned:pointsFor(customer.total) + (local ? state.pointEarnings.reduce((sum, entry) => sum + entry.points, 0) : 0),
    redeemed:customer.redeemed + (local ? state.redemptions.reduce((sum, entry) => sum + entry.points, 0) : 0),
  };
}

function customerList() {
  const tokens = customerQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matching = customers.map(customerData).filter(item =>
    (!customerClaimsOnly || item.claims.length) &&
    tokens.every(token => (item.address + item.name).toLowerCase().includes(token)));
  matching.sort((a,b) => customerSort === 'frequency' ? b.count - a.count || b.total - a.total : b.total - a.total || b.count - a.count);
  return matching.map(item => `<article class="customer-card">
    <button class="customer-button" data-action="customer-detail" data-id="${item.id}">
      <strong>${item.address} ${item.name}</strong>
      <span>累计消费 ${customerMoney(item.total)} · 下单 ${item.count} 次</span>
      <small>偏好 ${item.tags.join(' / ')} · 售后 ${item.claims.length} 条</small>
    </button></article>`).join('') || '<p class="muted">暂无匹配客户。</p>';
}

function customerPanel() {
  return `<section class="panel"><h2>核心客户明细与消费画像</h2>
    <p class="muted">演示档案 · 消费按下单金额汇总，当前浏览器订单计入李女士档案。</p>
    <div class="ops-filters">
      <label class="field">搜索楼栋/姓名<input id="customer-search" type="search" placeholder="如 3栋、李女士" value="${escapeHtml(customerQuery)}"></label>
      <label class="field">排序<select id="customer-sort"><option value="spend" ${customerSort === 'spend' ? 'selected' : ''}>消费金额排序</option>
      <option value="frequency" ${customerSort === 'frequency' ? 'selected' : ''}>复购频次排序</option></select></label>
    </div>
    <label class="customer-filter"><input id="customer-claims-only" type="checkbox" ${customerClaimsOnly ? 'checked' : ''}> 有售后记录</label>
    <div id="customer-list">${customerList()}</div>
  </section>`;
}

function showCustomer(id) {
  const profile = customers.find(customer => customer.id === id);
  if (!profile) return;
  const item = customerData(profile);
  const average = Math.floor(profile.total / profile.count);
  const history = Array.from({ length:profile.count }, (_, index) => ({
    id:`DEMO-${id.toUpperCase()}-${String(profile.count - index).padStart(2,'0')}`,
    total:average + (index === 0 ? profile.total % profile.count : 0),
    time:`2026-11-${String(24 - index).padStart(2,'0')}`,
    items:[{ name:profile.items[index % profile.items.length], quantity:1 }],
  }));
  openInfo('客户详情', `<div class="ops-detail">
    <button class="secondary" data-action="dashboard-back">返回经营看板</button>
    <h3>${item.address} ${item.name}</h3>
    <p>累计消费 ${customerMoney(item.total)} · 下单 ${item.count} 次</p>
    <p>累计获得 ${formatPoints(item.earned)} 积分 · 兑换 ${formatPoints(item.redeemed)} 积分</p>
    <div class="quality-tags" aria-label="偏好标签">${item.tags.map(tag => `<span>${tag}</span>`).join('')}</div>
    <section><h3>历史售后记录</h3>${item.claims.map(record => caseCard(record, id)).join('') || '<p class="muted">暂无售后记录。</p>'}</section>
    <section><h3>历史订单明细</h3>${[...item.orders,...history].map(order => `<article class="service-order">
      <strong>${order.items.map(product => `${escapeHtml(product.name)} × ${product.quantity}`).join('、')}</strong>
      <p>${money(order.total)} · ${escapeHtml(order.time)}</p><p class="muted">${escapeHtml(order.id)} · ${claimStatus(order) || (order.status ? escapeHtml(order.status) : order.id.startsWith('DEMO-') ? '已完成 · 演示' : escapeHtml(deliveryOptions[order.delivery]?.status || '待自提'))}</p>
    </article>`).join('')}</section>
  </div>`);
  dialog.scrollTop = 0;
}

function communityDashboard() {
  return `<section class="panel dashboard" aria-labelledby="dashboard-title">
    <h2 id="dashboard-title">单小区经营看板</h2>
    <p class="muted">路演情景数据 · 月流水为预估</p>
    <dl class="dashboard-metrics">${dashboardMetrics.map(([label,value,detail]) => `<div>
      <dt>${label}</dt><dd>${value}</dd><small>${detail}</small>
    </div>`).join('')}</dl>
  </section>
  ${customerPanel()}
  <section class="panel"><h2>楼栋渗透热力</h2>
    <p class="muted">示例楼栋 · 已加入户数 / 楼栋总户数</p>
    <div class="reach-chart">${buildingReach.map(([building,joined,total]) => `
      <div class="reach-row"><span>${building}</span>
        <div class="reach-track" role="img" aria-label="${building}，${joined} 户加入，共 ${total} 户">
          <span style="width:${joined / total * 100}%;opacity:${0.45 + joined / 55}"></span>
        </div><strong>${joined}%</strong>
      </div>`).join('')}</div>
  </section>
  <section class="panel model"><h2>单小区复制模型</h2><ol>
    <li><strong>从楼栋招募种子住户</strong><p>楼长邀请邻居，达到楼栋目标后解锁配送权益，用每户获客成本核算启动投入。</p></li>
    <li><strong>用生鲜直采建立复购</strong><p>每晚汇总订单后次晨采购，集中履约到小区，跟踪周复购率和生鲜毛利率。</p></li>
    <li><strong>用本地服务扩充流水</strong><p>通过管家验收、售后和口碑积累复购，覆盖跑腿、维修与保洁，再按楼栋节奏复制到相邻小区。</p></li>
  </ol></section>`;
}

function showDashboard() {
  openInfo('经营看板与客户明细', `<div class="ops-detail">${communityDashboard()}</div>`);
  dialog.scrollTop = 0;
  dialog.querySelector('.dialog-head button').focus({ preventScroll:true });
}

function communityPage() {
  const orders = state.orders.map(orderDetails).join('');
  return `<header class="simple-heading community-head">
    <h1>我的</h1>
    <button class="owner-avatar" data-action="owner-avatar" aria-label="阳光花园业主徽章"><img src="./assets/icon-192.png" width="40" height="40" alt=""></button>
  </header>
  <section class="panel resident-card">
    <div class="resident-head"><div><h2>业主会籍</h2><p class="muted">${residentAddress.building} · ¥1 = 1 积分</p></div>
      <p class="member-balance">${formatPoints(availablePoints())}<small> 积分</small></p></div>
    ${nextGiftProgress('member-progress')}
  </section>
  <section class="panel redemption-entry">
    <div class="redemption-heading"><h2>积分礼遇兑换馆</h2><button class="primary" data-action="gift-hall">积分兑换</button></div>
    ${latestRedemption(state.redemptions[0])}
  </section>
  <section class="panel"><h2 id="orders-title" tabindex="-1">我的订单记录</h2>${orders || '<p class="muted">暂无订单</p>'}</section>
  <details class="panel owner-tools"><summary>业主工具</summary>
    <div class="invite-actions"><button class="secondary" data-action="pickup-code">我的提货码</button>
      <button class="secondary" data-action="invite">邀请邻居 · ${inviteCode}</button>
      <button class="secondary" data-action="leader" ${state.leaderApplied ? 'disabled' : ''}>${state.leaderApplied ? '楼长申请已登记' : '申请成为楼长'}</button></div>
    <p class="muted">北门管家自提点 · 17:00–20:00</p>
    <p class="muted">3栋已有 28 户加入，再邀 2 户解锁免配送费特权。</p>
    <p class="muted">累计节省 ${money(state.orders.reduce((sum, order) => sum + (order.savings ?? orderSavings(order.items)), 0))} · 已获售后保障 ${state.orders.filter(order => order.claim && !order.claim.reviewUntil).length} 次</p>
    <details id="owner-messages"><summary>管家留言与需求许愿</summary>${ownerMessages()}</details>
    <details><summary>添加到 iPhone 主屏幕</summary><p>在 Safari 点按「分享」，选择「添加到主屏幕」。如有「作为网页 App 打开」选项，请保持开启。</p></details>
  </details>`;
}

function reorder(id) {
  const order = state.orders.find(item => item.id === id);
  if (!order) return;
  if (order.kind === 'service') {
    showBooking(order.items[0].id, order.booking);
    return;
  }
  syncBatch();
  let added = 0;
  let requested = 0;
  for (const line of order.items) {
    requested += line.quantity;
    const item = [...direct, ...products].find(product => product.id === line.id);
    if (!item) continue;
    const capacity = item.tiers ? limit - joined(item) : 99 - (state.cart[item.id] || 0);
    const quantity = Math.max(0, Math.min(capacity, line.quantity));
    if (!quantity) continue;
    state.cart[item.id] = (state.cart[item.id] || 0) + quantity;
    added += quantity;
  }
  if (!added) {
    notify('原单商品暂无可购份数');
    return;
  }
  const saved = save();
  refreshBag();
  showBag();
  if (added < requested || !saved) {
    const note = document.createElement('p');
    note.className = 'cutoff';
    note.textContent = added < requested ? `原单部分商品暂无可购份数，已加入 ${added} 份。` : '购物袋仅保留在当前页面。';
    dialogContent.querySelector('.dialog-head').after(note);
  }
}

function render() {
  syncBatch();
  const route = location.hash.slice(1);
  const active = tabs.includes(route) ? route : 'fresh';
  document.querySelector('#global-search').hidden = !['fresh','select'].includes(active);
  document.querySelector('.topbar .bag').hidden = active === 'fresh';
  document.querySelector('.topbar').classList.toggle('home-topbar', active === 'fresh');
  if (active !== 'community') avatarTaps = 0;
  main.innerHTML = { fresh:freshPage, select:selectPage, service:servicePage, community:communityPage }[active]();
  for (const link of document.querySelectorAll('.nav a')) {
    if (link.hash === '#' + active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  refreshBag();
  refreshGroups();
  drawIcons();
  syncCarousels();
}

function cartTotal(lines = cartLines()) {
  return lines.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function checkoutBlocker(lines) {
  for (const line of lines) {
    const item = direct.find(product => product.id === line.id);
    if (!item) continue;
    if (tier(item) < 0) return `${item.name}还差 ${thresholds[0] - joined(item)} 份达到基础配额`;
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
    ${pointsEstimate(subtotal + deliveryOptions[delivery].fee)}
    <p class="cutoff" data-blocker ${blocker ? '' : 'hidden'}>${blocker}</p>
    <div class="row"><strong>合计 <span data-order-total>${money(subtotal + deliveryOptions[delivery].fee)}</span></strong><button class="primary" data-action="checkout" ${blocker ? 'disabled' : ''}>提交演示订单</button></div>`
    : '<p class="muted">购物袋是空的</p>'}`;
  if (!dialog.open) dialog.showModal();
  syncCarousels();
  if (focusAction) {
    const button = dialog.querySelector(`[data-action="${focusAction}"][data-id="${focusId}"]`);
    (button || dialog.querySelector('[data-action="close"]')).focus();
  }
}

function changeQuantity(id, delta) {
  syncBatch();
  const item = [...direct, ...products].find(product => product.id === id);
  if (!item) return;
  if (delta > 0 && item.tiers && joined(item) >= limit) {
    if (dialog.open) {
      let warning = dialog.querySelector('[data-blocker]');
      if (!warning) {
        warning = document.createElement('p');
        warning.dataset.blocker = '';
        warning.className = 'cutoff';
        warning.setAttribute('role','status');
        dialogContent.querySelector('.dialog-head').after(warning);
      }
      warning.hidden = false;
      warning.textContent = '该商品本批已订满';
    } else notify('该商品本批已订满');
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
  recordOrder({
    id:'YG-' + Date.now().toString(36).toUpperCase(),
    items, total:cartTotal(items) + option.fee, time:timestamp(),
    savings:orderSavings(items),
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

dialog.addEventListener('input', event => {
  if (event.target.id !== 'search-input') return;
  searchQuery = event.target.value;
  paintSearch();
});

dialog.addEventListener('submit', event => {
  const form = event.target;
  if (form.id === 'claim-form') {
    event.preventDefault();
    submitClaim(form);
    return;
  }
  if (form.id !== 'booking-form') return;
  event.preventDefault();
  const item = bookableServices.find(service => service.id === form.dataset.service);
  if (!item) return;
  const { building, room, slot, notes } = Object.fromEntries(new FormData(form));
  if (!buildings.includes(building) || !rooms.includes(room)) return;
  if (!availableWindows(item).includes(slot)) {
    const select = form.elements.slot;
    select.innerHTML = '<option value="">日期已更新，请重新选择</option>' + bookingOptions(availableWindows(item));
    select.reportValidity();
    return;
  }
  recordOrder({
    id:'NB-' + Date.now().toString(36).toUpperCase(),
    kind:'service', status:matchingStatus, time:timestamp(), total:item.price,
    items:[{ id:item.id, name:item.name, price:item.price, quantity:1 }],
    booking:{ address:`${building} ${room} 室`, slot, notes:notes.trim().slice(0, 200), unit:item.unit },
  }, item.category === 'errands');
  const saved = save();
  dialog.close();
  showOrders('预约成功', saved);
});

dialog.addEventListener('close', () => {
  syncCarousels();
  clearClaimPhoto();
});
dialog.addEventListener('change', event => {
  if (event.target.name === 'photo' && event.target.form?.id === 'claim-form') {
    const file = event.target.files[0];
    if (!file) return;
    clearClaimPhoto();
    if (file.type && !file.type.startsWith('image/')) {
      rejectClaimPhoto(event.target.form);
      return;
    }
    try {
      claimPhotoUrl = URL.createObjectURL(file);
      displayClaimPhoto(claimPhotoUrl, '已选择本地照片');
    } catch {
      rejectClaimPhoto(event.target.form);
    }
    return;
  }
  if (event.target.name !== 'delivery') return;
  delivery = event.target.value;
  const fee = deliveryOptions[delivery].fee;
  dialog.querySelector('[data-delivery-fee]').textContent = money(fee);
  const total = cartTotal() + fee;
  dialog.querySelector('[data-order-total]').textContent = money(total);
  dialog.querySelector('[data-points-estimate]').textContent = pointsEstimateText(total);
});

document.addEventListener('error', event => {
  if (event.target.matches?.('[data-fresh-image]')) event.target.hidden = true;
  if (event.target.matches?.('#claim-form .claim-photo[src]') && dialog.open) rejectClaimPhoto(event.target.closest('form'));
}, true);

document.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    const result = event.target.closest('[data-search-item]');
    if (result) showSearchDetail(result.dataset.searchItem);
    return;
  }
  const { action, id } = button.dataset;
  switch (action) {
    case 'fresh-category':
      if (!Object.hasOwn(freshCategories, id) || id === freshCategory) break;
      freshCategory = id;
      main.querySelector('.fresh-filters [aria-pressed="true"]').setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-pressed', 'true');
      for (const card of main.querySelectorAll('[data-product]')) {
        const item = direct.find(product => product.id === card.dataset.product);
        card.hidden = id !== 'all' && item.category !== id;
      }
      break;
    case 'fresh-detail': {
      const item = direct.find(product => product.id === id);
      if (item) showFreshDetail(item);
      break;
    }
    case 'gift-hall': showGiftHall(true); break;
    case 'gift-back': showGiftHall(); break;
    case 'gift-category':
      if (Object.hasOwn(giftCategories, id) && id !== giftCategory) {
        giftCategory = id;
        dialog.querySelector('.gift-grid').innerHTML = giftCards();
        dialog.querySelector('[data-action="gift-category"][aria-pressed="true"]').setAttribute('aria-pressed','false');
        button.setAttribute('aria-pressed','true');
        drawIcons();
      }
      break;
    case 'points-history': showPointsHistory(); break;
    case 'gift-history': showGiftHistory(); break;
    case 'gift-confirm': confirmGift(id); break;
    case 'gift-redeem': redeemGift(id); break;
    case 'global-search': showSearch(); break;
    case 'hot-search':
      searchQuery = id;
      dialog.querySelector('#search-input').value = id;
      paintSearch();
      break;
    case 'search-detail': showSearchDetail(id); break;
    case 'search-back': showSearch(true); break;
    case 'search-add': changeQuantity(id, 1); break;
    case 'service-category':
      if (serviceCategory !== id && Object.hasOwn(serviceCategories, id)) {
        serviceCategory = id;
        render();
        main.querySelector('.service-filter[aria-pressed="true"]').focus({ preventScroll:true });
      }
      break;
    case 'book-service': showBooking(id); break;
    case 'demo-photo':
      clearClaimPhoto();
      dialog.querySelector('[name="photo"]').value = '';
      displayClaimPhoto(demoDamage, '已填入演示破损图');
      break;
    case 'vote': {
      const wish = state.wishes.find(item => item.id === id);
      if (!wish) break;
      wish.voted = !wish.voted;
      save();
      button.setAttribute('aria-pressed', String(wish.voted));
      button.textContent = `♥ ${Number(wish.voted)}`;
      break;
    }
    case 'claim-selected': showClaim(main.querySelector('#claim-order').value); break;
    case 'case-detail': showCase(id, button.dataset.customer); break;
    case 'customer-detail': showCustomer(id); break;
    case 'dashboard-back': showDashboard(); break;
    case 'owner-avatar': {
      const now = performance.now();
      avatarTaps = now - lastAvatarTap <= 800 ? avatarTaps + 1 : 1;
      lastAvatarTap = now;
      if (avatarTaps === 3) {
        avatarTaps = 0;
        showDashboard();
      }
      break;
    }
    case 'pickup-code':
      openInfo('我的提货码', `<div class="pickup-code"><img src="./assets/pickup-qr.png" width="220" height="220" alt="提货码二维码 ${pickupCode}"><strong>${pickupCode}</strong><p>北门管家自提点 · 演示提货码</p></div>`);
      break;
    case 'invite':
      openInfo('邀请邻居', `<p>分享专属邀请码，邀请 3 栋邻居加入。</p>
        <label class="field">专属邀请码<input class="invite-code" readonly value="${inviteCode}"></label>
        <button class="primary" data-action="copy-invite">复制邀请码</button><p data-copy-status role="status"></p>`);
      break;
    case 'copy-invite':
      (async () => {
        const input = dialog.querySelector('.invite-code');
        const status = dialog.querySelector('[data-copy-status]');
        try {
          await navigator.clipboard.writeText(inviteCode);
          status.textContent = '邀请码已复制';
        } catch {
          input.select();
          status.textContent = '邀请码已选中，可手动复制';
        }
      })();
      break;
    case 'leader':
      openInfo('申请成为本栋楼长', '<p>为 3 栋邀请邻居、收集鲜食预订需求，并协助同步自提安排。</p><button class="primary leader-submit" data-action="submit-leader">提交演示申请</button>');
      break;
    case 'submit-leader':
      state.leaderApplied = true;
      dialog.close();
      render();
      notify('楼长申请已登记', save());
      break;
    case 'reorder': reorder(id); break;
    case 'bag': showBag(); break;
    case 'quality': case 'fresh-guarantee':
      openInfo('鲜食服务保障卡', `<ul class="agreement guarantee-list">
        <li><strong>开箱验货</strong><p>到站逐盒复检，软磕、坏果直接筛除，确认状态后再分装。</p></li>
        <li><strong>净重承诺</strong><p>电子秤去除包装重量后复秤，按商品标注的净重交付。</p></li>
        <li><strong>坏果秒赔</strong><p>发现坏果或缺重，可在管家售后提交照片，按 1 分钟内赔付标准处理。线上赔付为演示流程。</p></li>
      </ul>`);
      break;
    case 'close': dialog.close(); break;
    case 'add': case 'plus': changeQuantity(id, 1); break;
    case 'minus': changeQuantity(id, -1); break;
    case 'checkout': checkout(); break;

  }
});

main.addEventListener('submit', event => {
  if (event.target.id !== 'wish-form') return;
  event.preventDefault();
  const form = event.target;
  const { audience, wish } = form.elements;
  const text = wish.value.trim();
  if (!text) {
    wish.setCustomValidity('请输入留言内容');
    wish.reportValidity();
    return;
  }
  if (audience.value === 'private') state.messages.unshift(text);
  else state.wishes.unshift({ id:Date.now().toString(36), text, voted:false });
  const saved = save();
  render();
  main.querySelector('.owner-tools').open = true;
  main.querySelector('#owner-messages').open = true;
  main.querySelector('#wish-form textarea').focus({ preventScroll:true });
  notify(audience.value === 'private' ? '专属管家留言已保存' : '许愿已发布', saved);
});
main.addEventListener('input', event => {
  if (event.target.name === 'wish') event.target.setCustomValidity('');
});
dialog.addEventListener('input', event => {
  if (event.target.id !== 'customer-search') return;
  customerQuery = event.target.value;
  dialog.querySelector('#customer-list').innerHTML = customerList();
});
dialog.addEventListener('change', event => {
  if (event.target.id === 'customer-sort') customerSort = event.target.value;
  else if (event.target.id === 'customer-claims-only') customerClaimsOnly = event.target.checked;
  else return;
  dialog.querySelector('#customer-list').innerHTML = customerList();
});
window.addEventListener('hashchange', () => {
  render();
  window.scrollTo(0, 0);
});
render();
completeReviews();
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
