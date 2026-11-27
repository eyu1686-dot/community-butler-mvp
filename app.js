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
const demoOrder = {
  id:'YG-DEMO-BERRY', demo:true, total:5900, time:'历史订单 · 演示',
  items:[{ id:'dandong', name:'丹东红颜草莓', price:5900, quantity:1 }],
  deliveryLabel:'北门管家自提点',
};
const defaults = { cart:{}, orders:[], requests:[], wishes:[], messages:[] };
let state;
try {
  state = { ...defaults, ...JSON.parse(localStorage.getItem(storageKey)) };
} catch {
  state = defaults;
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
// Additional bookable services are discoverable through global search.
const extraServices = [
  { id:'ac-clean', category:'repairs', name:'空调挂机清洗', price:6800, unit:'/ 台', scope:'含挂机滤网、蒸发器及接水盘清洗，完工试机。', worker:'王师傅', households:46 },
  { id:'ac-repair', category:'repairs', name:'空调维修 · 加氟', price:12000, unit:'起', scope:'先测压力、检查泄漏，再按机型及制冷剂用量确认报价；维修配件另行确认。', worker:'王师傅', households:46 },
  { id:'urgent-errand', category:'errands', name:'急事跑腿代办', price:500, unit:'/ 单', scope:'含小区内单次紧急代办或物品递送。', worker:'赵阿姨', households:32 },
  { id:'switch', category:'repairs', name:'水电维修 · 更换开关', price:3000, unit:'工时费', scope:'含断电检查、单个开关更换和通电测试；开关由住户提供。', worker:'陈师傅', households:26 },
  { id:'lock', category:'repairs', name:'公安备案开锁换锁', price:8000, unit:'起', scope:'上门核验住户身份及房屋使用权；换锁材料和特殊锁型先报价。', worker:'许师傅', households:21 },
  { id:'appliance', category:'repairs', name:'洗衣机/冰箱上门检测', price:3000, unit:'/ 次', scope:'含一次上门故障检测；维修工时和配件另行确认。', worker:'刘师傅', households:37 },
];
const bookableServices = [...neighborhoodServices, ...extraServices];
const hotSearches = ['修空调 / 加氟','找跑腿 / 代取快递','通下水 / 修水管','日常保洁 / 擦玻璃','丹东草莓'];
const searchAliases = {
  'ac-clean':'修空调 空调不制冷 洗空调 清洗空调 空调清洗与维修',
  'ac-repair':'修空调 空调不制冷 洗空调 加氟 空调清洗与维修',
  parcel:'找跑腿 跑跑 跑腿 拿快递 取快递 代取快递 驿站',
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
  return item.tiers ? `${servicePrice(displayPrice(item))} / 份 · ${tier(item) < 0 ? '首档参考价' : '当前团价'}` : `${servicePrice(item.price)} ${item.unit}`;
}

function searchEndorsement(item) {
  if (item.worker) return `${item.worker} · 本小区已服务 ${item.households} 户`;
  return searchEndorsements[item.id] || '管家市场直采 · 到货抽检';
}

function searchAction(item) {
  if (!item.tiers) return `<button class="primary" data-action="book-service" data-id="${item.id}" aria-label="立即预约 · ${item.name}">立即预约</button>`;
  const unavailable = !batchTime().remaining ? '已截单' : joined(item) >= limit ? '已拼满' : '';
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
  const details = item.tiers
    ? `<p>${item.detail} · 已拼 ${joined(item)}/${limit} 份</p><p>${thresholds.map((count, index) => `满 ${count} 份 ${servicePrice(item.tiers[index])}`).join(' · ')}</p><p>北京时间 22:00 截单，按提交时解锁的价格结算。</p>`
    : `<p>${item.scope}</p>`;
  const review = item.tiers ? '“自提时能看到到货状态，份量写得清楚。”' : '“预约前就能看到收费明细，上门后按约定做完。”';
  openInfo(item.name, `<div class="search-detail">
    <button class="secondary" data-action="search-back">返回搜索结果</button>
    <p class="search-price">${searchPrice(item)}</p>
    <p class="search-endorsement">管家实测背书（演示） · ${searchEndorsement(item)}</p>
    <section><h3>服务明细</h3>${details}</section>
    <section><h3>零加价承诺</h3><p>${item.tiers ? '份量、阶梯价及配送费用均在下单前明示。' : '按已确认的服务与价格结算。额外材料或工时先说明并经住户同意。'}</p></section>
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

function bookingOptions(values, selected) {
  return values.map(value => `<option ${value === selected ? 'selected' : ''}>${value}</option>`).join('');
}

function showBooking(id, previous) {
  const item = bookableServices.find(service => service.id === id);
  if (!item) return;
  const [building, room] = previous?.address.match(/^(.*栋) (\d+) 室$/)?.slice(1) || [];
  openInfo('预约下单', `<p class="booking-item"><strong>${item.name}</strong> <span>${servicePrice(item.price)} ${item.unit}</span></p>
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

function servicePage() {
  const orders = state.orders.map(order => {
    const names = order.items.map(item => escapeHtml(item.name)).join('、');
    const result = order.claim && !order.claim.reviewUntil ? claimResult(order.claim) : '';
    return `<article class="claim-order">
      <div><strong>${names}</strong><p class="muted">${escapeHtml(order.id)}${order.demo ? ' · 演示历史订单' : ''} · ${money(order.total)}</p></div>
      ${order.claim ? `<span class="status">${claimStatus(order)}</span>` : `<button class="primary" data-action="claim" data-id="${escapeHtml(order.id)}" aria-label="申请售后赔付 · ${names}">申请售后赔付</button>`}
      ${result ? `<p class="claim-result">${result}</p>` : ''}
    </article>`;
  }).join('');
  const oldRequests = state.requests.map(request => `<li>${escapeHtml(request.type)} · ${escapeHtml(request.detail)}</li>`).join('');
  return `<header class="page-head after-head">
    <h1>管家售后</h1><p>阳光花园一期 · 本月服务承诺</p>
    <div class="service-metrics">
      <div><strong>100%</strong><span>售后秒赔率</span></div>
      <div><strong>3 分钟</strong><span>平均响应时间</span></div>
      <div><strong>1 家</strong><span>合作服务商淘汰公示</span></div>
    </div>
    <small>演示指标</small>
  </header>
  <section class="panel"><div class="claim-heading"><h2>一键拍照秒赔</h2><span class="status">免退回</span></div>
    <p class="muted">选择订单、补充照片，查看模拟审核和赔付结果。</p>
    ${orders}
    ${oldRequests ? `<details class="panel"><summary>历史售后登记</summary><ul>${oldRequests}</ul></details>` : ''}
  </section>
  <section class="panel"><h2>一对一专属管家留言 / 需求许愿池</h2>
    <form id="wish-form">
      <label class="field">留言去向<select name="audience"><option value="wish">发布到小区许愿池</option><option value="private">仅留言给专属管家</option></select></label>
      <label class="field">想告诉管家什么？<textarea name="wish" required maxlength="160" rows="2" placeholder="明天想团购什么水果/海鲜？"></textarea></label>
      <button class="primary" type="submit">提交留言</button>
    </form>
    <h3 class="wish-heading">邻里许愿列表</h3><p class="muted">留言与投票仅保存在当前浏览器。</p>
    <div id="wish-list">${state.wishes.map(wish => `<article class="wish-row">
      <p>${escapeHtml(wish.text)}</p>
      <button class="wish-vote" data-action="vote" data-id="${escapeHtml(wish.id)}" aria-pressed="${Boolean(wish.voted)}" aria-label="点赞：${escapeHtml(wish.text)}">♥ ${Number(wish.voted || 0)}</button>
    </article>`).join('') || '<p class="muted">还没有公开许愿。</p>'}</div>
    ${state.messages.length ? `<details class="private-messages"><summary>我的管家留言</summary>${state.messages.map(message => `<p>${escapeHtml(message)}</p>`).join('')}</details>` : ''}
  </section>`;
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
    <small class="muted">赔付为演示，照片仅在本机预览。</small>
  </form>`);
}

function displayClaimPhoto(source, label) {
  const form = dialog.querySelector('#claim-form');
  const photo = form.querySelector('.claim-photo');
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

function submitClaim(form) {
  const { order:id, issue, method } = Object.fromEntries(new FormData(form));
  const order = state.orders.find(item => item.id === id);
  if (!order || order.claim || !issueTypes.includes(issue) || !['refund','replacement'].includes(method)) return;
  if (form.querySelector('.claim-photo').hidden) {
    form.querySelector('[data-photo-status]').textContent = '请选择本地照片或填入演示破损图。';
    return;
  }
  const refund = order.demo ? 1280 : Math.round(order.total * 0.2);
  order.claim = { issue, method, amount:method === 'refund' ? refund : 0, reviewUntil:Date.now() + 1500 };
  save();
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
let dashboardOpen = false;

const dashboardMetrics = [
  ['覆盖户数','1,500 户','阳光花园一期'],
  ['种子渗透率','21.3%','320 户 / 1,500 户'],
  ['生鲜周复购率','64%','按周统计下单住户'],
  ['单户获客成本','¥3.2','种子住户获客口径'],
  ['生鲜平均毛利率','28.5%','生鲜销售额口径'],
  ['综合月流水预估','¥42,800','生鲜及社区服务'],
];
const buildingReach = [
  ['1 栋',18,100], ['2 栋',22,100], ['3 栋',28,100], ['5 栋',16,100], ['6 栋',25,100],
];

function communityDashboard() {
  return `<section class="panel dashboard" aria-labelledby="dashboard-title">
    <h2 id="dashboard-title">单小区经营看板</h2>
    <p class="muted">路演情景数据 · 月流水为预估</p>
    <dl class="dashboard-metrics">${dashboardMetrics.map(([label,value,detail]) => `<div>
      <dt>${label}</dt><dd>${value}</dd><small>${detail}</small>
    </div>`).join('')}</dl>
  </section>
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

function communityPage() {
  const header = `<header class="page-head community-head">
    <div><h1>我的小区</h1><p>阳光花园一期</p></div>
    <button class="secondary dashboard-toggle" data-action="dashboard" aria-pressed="${dashboardOpen}">经营看板</button>
  </header>`;
  if (dashboardOpen) return header + communityDashboard();
  const savings = state.orders.reduce((sum, order) => sum + (order.savings ?? orderSavings(order.items)), 0);
  const protectedOrders = state.orders.filter(order => order.claim && !order.claim.reviewUntil).length;
  const orders = state.orders.map(orderDetails).join('');
  return header + `
    <section class="panel resident-card">
      <div class="resident-head"><div><h2>3栋2单元</h2><p class="muted">北门管家自提点 · 17:00–20:00</p></div>
        <button class="secondary" data-action="pickup-code">我的提货码</button></div>
      <dl class="resident-stats"><div><dt>累计节省</dt><dd>${money(savings)}</dd></div>
        <div><dt>已获售后保障</dt><dd>${protectedOrders} 次</dd></div></dl>
    </section>
    <section class="panel invite-card"><h2>申请成为本栋楼长 / 邀请邻居</h2>
      <label class="progress-label"><span>3栋已有 28 户加入</span><progress value="28" max="30"></progress></label>
      <p class="muted">再邀 2 户解锁本栋专属免配送费特权。</p>
      <div class="invite-actions"><button class="secondary" data-action="invite">邀请邻居 · ${inviteCode}</button>
        <button class="primary" data-action="leader" ${state.leaderApplied ? 'disabled' : ''}>${state.leaderApplied ? '楼长申请已登记' : '申请成为楼长'}</button></div>
    </section>
    <section class="panel"><h2 id="orders-title" tabindex="-1">我的订单</h2>${orders || '<p class="muted">暂无订单</p>'}</section>
    <section class="panel"><h2>添加到 iPhone 主屏幕</h2><p>在 Safari 点按「分享」，选择「添加到主屏幕」。如出现「作为网页 App 打开」选项，请保持开启。</p></section>`;
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
    if (!item || (item.tiers && !batchTime().remaining)) continue;
    const capacity = item.tiers ? limit - joined(item) : 99 - (state.cart[item.id] || 0);
    const quantity = Math.max(0, Math.min(capacity, line.quantity));
    if (!quantity) continue;
    state.cart[item.id] = (state.cart[item.id] || 0) + quantity;
    added += quantity;
  }
  if (!added) {
    notify('原单商品已截单或暂无可购份数');
    return;
  }
  const saved = save();
  refreshBag();
  showBag();
  if (added < requested || !saved) {
    const note = document.createElement('p');
    note.className = 'cutoff';
    note.textContent = added < requested ? `原单部分商品已截单或满额，已加入 ${added} 份。` : '购物袋仅保留在当前页面。';
    dialogContent.querySelector('.dialog-head').after(note);
  }
}

function render() {
  syncBatch();
  const route = location.hash.slice(1);
  const active = tabs.includes(route) ? route : 'fresh';
  document.querySelector('#global-search').hidden = !['fresh','select'].includes(active);
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
      let warning = dialog.querySelector('[data-blocker]');
      if (!warning) {
        warning = document.createElement('p');
        warning.dataset.blocker = '';
        warning.className = 'cutoff';
        warning.setAttribute('role','status');
        dialogContent.querySelector('.dialog-head').after(warning);
      }
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
  dashboardOpen = false;
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

dialog.addEventListener('close', () => {
  stopPreview();
  clearClaimPhoto();
});
dialog.addEventListener('change', event => {
  if (event.target.name === 'photo' && event.target.form?.id === 'claim-form') {
    const file = event.target.files[0];
    if (!file) return;
    clearClaimPhoto();
    if (file.type && !file.type.startsWith('image/')) {
      event.target.form.querySelector('.claim-photo').hidden = true;
      event.target.form.querySelector('[data-photo-status]').textContent = '请选择图片文件。';
      return;
    }
    claimPhotoUrl = URL.createObjectURL(file);
    displayClaimPhoto(claimPhotoUrl, '已选择本地照片');
    return;
  }
  if (event.target.name !== 'delivery') return;
  delivery = event.target.value;
  const fee = deliveryOptions[delivery].fee;
  dialog.querySelector('[data-delivery-fee]').textContent = money(fee);
  dialog.querySelector('[data-order-total]').textContent = money(cartTotal() + fee);
});

document.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    const result = event.target.closest('[data-search-item]');
    if (result) showSearchDetail(result.dataset.searchItem);
    return;
  }
  const { action, id } = button.dataset;
  switch (action) {
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
    case 'claim': showClaim(id); break;
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
    case 'dashboard':
      dashboardOpen = !dashboardOpen;
      render();
      main.querySelector('.dashboard-toggle').focus({ preventScroll:true });
      break;
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
      openInfo('申请成为本栋楼长', '<p>为 3 栋邀请邻居、收集团购需求，并协助同步自提安排。</p><button class="primary leader-submit" data-action="submit-leader">提交演示申请</button>');
      break;
    case 'submit-leader':
      state.leaderApplied = true;
      dialog.close();
      render();
      notify('楼长申请已登记', save());
      break;
    case 'reorder': reorder(id); break;
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
  main.querySelector('#wish-form textarea').focus({ preventScroll:true });
  notify(audience.value === 'private' ? '专属管家留言已保存' : '许愿已发布', saved);
});
main.addEventListener('input', event => {
  if (event.target.name === 'wish') event.target.setCustomValidity('');
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
