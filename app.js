/* ============================================================
   Ev Ləzzəti Şirniyyat CRM — tam funksional SPA
   Verilənlər: localStorage (DB_KEY altında)
   ============================================================ */

/* ---------------- FIREBASE (Lisenziya / Aktivasiya sistemi) ---------------- */
const firebaseConfig = {
  apiKey: "AIzaSyCBhyGNzZRGgQShP_C9kwAzTm_g_0zJlzg",
  authDomain: "an-psixoloji-33442.firebaseapp.com",
  databaseURL: "https://an-psixoloji-33442-default-rtdb.firebaseio.com",
  projectId: "an-psixoloji-33442",
  storageBucket: "an-psixoloji-33442.firebasestorage.app",
  messagingSenderId: "528809299356",
  appId: "1:528809299356:web:59cae89a64e446dc520c59"
};
firebase.initializeApp(firebaseConfig);
const fbdb = firebase.database();
const LICENSE_PATH = 'sirniyyat/licenses';

function getDeviceId() {
  let id = localStorage.getItem('sirniyyat_device_id');
  if (!id) { id = uid('dev'); localStorage.setItem('sirniyyat_device_id', id); }
  return id;
}
function getSavedLicenseCode() { return localStorage.getItem('sirniyyat_license_code'); }
function saveLicenseCode(code) { localStorage.setItem('sirniyyat_license_code', code); }

const MAX_DEVICES = 2; // köhnə kodlar üçün ehtiyat dəyər (yeni kodlarda hər kodun öz maxDevices sahəsi var)

async function checkLicense() {
  const savedCode = getSavedLicenseCode();
  const deviceId = getDeviceId();
  if (savedCode) {
    try {
      const snap = await fbdb.ref(`${LICENSE_PATH}/${savedCode}`).once('value');
      const data = snap.val();
      const devices = (data && data.deviceIds) || [];
      if (data && devices.includes(deviceId)) {
        fbdb.ref(`${LICENSE_PATH}/${savedCode}`).update({ lastSeen: Date.now(), sessions: (data.sessions || 0) + 1 });
        return true;
      }
      if (!data) return true; // Firebase-də tapılmadı amma lokal aktivdir - bağlantı problemi ola bilər, buraxaq
    } catch (e) { return true; }
  }
  return false;
}

function renderActivationScreen(errorMsg) {
  LICENSED = false;
  document.getElementById('modal-root').innerHTML = '';
  document.getElementById('app').innerHTML = `
    <div class="min-h-[70vh] flex items-center justify-center px-2 fade-in">
      <div class="bg-surface-container-lowest rounded-2xl shadow-xl p-8 max-w-sm w-full text-center border border-primary-container">
        <div class="text-4xl mb-3">🔐</div>
        <h2 class="text-xl font-bold text-on-background mb-2">Aktivasiya Kodu</h2>
        <p class="text-sm text-on-surface-variant mb-6">Davam etmək üçün sizə verilmiş 6 rəqəmli kodu daxil edin</p>
        <form id="activation-form">
          <input id="activation-input" maxlength="6" inputmode="numeric" placeholder="――――――" class="w-full text-center text-2xl tracking-[0.5em] px-4 py-3 rounded-xl border-2 border-outline-variant focus:border-primary outline-none mb-3"/>
          ${errorMsg ? `<p class="text-error text-sm mb-3">${errorMsg}</p>` : ''}
          <button type="submit" class="w-full py-3 rounded-full bg-primary text-on-primary font-semibold hover:opacity-90 transition-opacity">Aktiv Et</button>
        </form>
        <p class="text-[11px] text-on-surface-variant mt-6">🍰 loqoya 5 dəfə toxunaraq admin panelinə keçə bilərsiniz</p>
      </div>
    </div>`;
  document.getElementById('activation-input').focus();
  document.getElementById('activation-form').onsubmit = async (e) => {
    e.preventDefault();
    const code = document.getElementById('activation-input').value.trim();
    if (!/^\d{6}$/.test(code)) { renderActivationScreen('Kod 6 rəqəmdən ibarət olmalıdır'); return; }
    const deviceId = getDeviceId();
    try {
      const ref = fbdb.ref(`${LICENSE_PATH}/${code}`);
      const snap = await ref.once('value');
      const data = snap.val();
      if (!data) { renderActivationScreen('Bu kod tapılmadı'); return; }
      const devices = data.deviceIds || [];
      const limit = data.maxDevices || MAX_DEVICES;
      if (devices.includes(deviceId)) {
        await ref.update({ lastSeen: Date.now(), sessions: (data.sessions || 0) + 1 });
      } else if (devices.length >= limit) {
        renderActivationScreen(`Bu kod artıq ${limit} cihazda istifadə olunub`); return;
      } else {
        const updated = [...devices, deviceId];
        await ref.update({ deviceIds: updated, activatedAt: data.activatedAt || Date.now(), lastSeen: Date.now(), sessions: (data.sessions || 0) + 1 });
      }
      saveLicenseCode(code);
      LICENSED = true;
      navigate('dashboard');
    } catch (err) {
      renderActivationScreen('Bağlantı xətası, yenidən cəhd edin');
    }
  };
}

/* ---------------- GİZLİ ADMIN PANEL (loqoya 5 toxunma) ---------------- */
let LICENSED = false;
let logoTapCount = 0, logoTapTimer = null;
const ADMIN_PIN = 'AL2026EA';
function handleLogoTap() {
  logoTapCount++;
  clearTimeout(logoTapTimer);
  logoTapTimer = setTimeout(() => { logoTapCount = 0; }, 2000);
  if (logoTapCount >= 5) { logoTapCount = 0; openAdminPinGate(); return; }
  if (!LICENSED) return;
  navigate('dashboard');
}
function openAdminPinGate() {
  openModal(`
    <div class="p-6 text-center">
      <div class="text-4xl mb-3">🔒</div>
      <h3 class="text-headline-sm font-headline-sm text-on-background mb-1">Admin Panel</h3>
      <p class="text-label-sm text-on-surface-variant mb-4">Davam etmək üçün PIN daxil edin</p>
      <form id="admin-pin-form">
        <input id="admin-pin-input" type="password" class="w-full text-center text-lg tracking-widest px-4 py-3 rounded-xl border-2 border-outline-variant focus:border-primary outline-none mb-3" placeholder="PIN"/>
        <div class="flex gap-3">
          <button type="button" onclick="closeModal()" class="flex-1 py-3 rounded-full border border-outline-variant text-on-background font-label-md text-label-md">Ləğv et</button>
          <button type="submit" class="flex-1 py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md">Daxil ol</button>
        </div>
      </form>
    </div>`);
  document.getElementById('admin-pin-input').focus();
  document.getElementById('admin-pin-form').onsubmit = (e) => {
    e.preventDefault();
    const val = document.getElementById('admin-pin-input').value;
    if (val === ADMIN_PIN) { openAdminPanel(); }
    else { toast('Yanlış PIN', 'error'); }
  };
}
async function openAdminPanel() {
  openModal(`<div class="p-6"><p class="text-center text-on-surface-variant">Yüklənir...</p></div>`);
  let licenses = {};
  try {
    const snap = await fbdb.ref(LICENSE_PATH).once('value');
    licenses = snap.val() || {};
  } catch (e) {
    toast('Firebase xətası: ' + e.message, 'error');
  }
  renderAdminPanel(licenses);
}
function renderAdminPanel(licenses) {
  const codes = Object.keys(licenses).sort((a, b) => (licenses[b].activatedAt || 0) - (licenses[a].activatedAt || 0));
  openModal(`
    <div class="p-6">
      <h3 class="text-headline-sm font-headline-sm text-on-background mb-1">🔐 Admin Panel</h3>
      <p class="text-label-sm text-on-surface-variant mb-4">Lisenziya kodları — hər kod üçün cihaz limitini özün seçirsən</p>
      <div class="flex gap-2 mb-4">
        <select id="new-code-device-limit" class="flex-grow px-3 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none">
          ${[1,2,3,4,5,6].map(n => `<option value="${n}" ${n === 2 ? 'selected' : ''}>${n} cihaz</option>`).join('')}
        </select>
        <button id="gen-code-btn" onclick="generateLicenseCode()" class="px-4 py-3 rounded-full bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-opacity flex items-center justify-center gap-1 whitespace-nowrap">
          <span class="material-symbols-outlined text-base">add</span> Yeni Kod
        </button>
      </div>
      <div class="space-y-2 max-h-80 overflow-y-auto">
        ${codes.length ? codes.map(code => {
          const l = licenses[code];
          const devices = l.deviceIds || [];
          const limit = l.maxDevices || MAX_DEVICES;
          const active = devices.length > 0;
          return `
          <div class="bg-surface-container-lowest rounded-xl border border-primary-container p-3">
            <div class="flex justify-between items-center mb-1">
              <span class="font-mono text-lg font-bold tracking-widest">${code}</span>
              <span class="text-[10px] font-bold uppercase px-2 py-1 rounded-full ${active ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-surface-container text-on-surface-variant'}">${devices.length}/${limit} cihaz</span>
            </div>
            ${active ? `<p class="text-label-sm text-on-surface-variant">İlk aktivləşmə: ${new Date(l.activatedAt).toLocaleString('az-AZ')}</p>
            <p class="text-label-sm text-on-surface-variant">Son giriş: ${new Date(l.lastSeen).toLocaleString('az-AZ')} (${l.sessions || 1} sessiya)</p>
            <button onclick="resetLicenseCode('${code}')" class="mt-2 text-label-sm text-error font-label-md">Bütün cihazları sıfırla</button>` :
            `<p class="text-label-sm text-on-surface-variant">Hələ heç bir cihazda aktivləşdirilməyib</p>`}
          </div>`;
        }).join('') : `<p class="text-body-sm text-on-surface-variant text-center py-4">Hələ kod yaradılmayıb</p>`}
      </div>
      <button onclick="closeModal()" class="w-full mt-4 py-3 rounded-full border border-outline-variant text-on-background font-label-md text-label-md hover:bg-surface-container transition-colors">Bağla</button>
    </div>`);
}
async function generateLicenseCode() {
  const btn = document.getElementById('gen-code-btn');
  const limit = parseInt(document.getElementById('new-code-device-limit').value) || MAX_DEVICES;
  if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  try {
    await fbdb.ref(`${LICENSE_PATH}/${code}`).set({ createdAt: Date.now(), deviceIds: [], maxDevices: limit });
    toast(`Yeni kod yaradıldı: ${code} (${limit} cihaz)`);
    openAdminPanel();
  } catch (e) {
    toast('Xəta: ' + e.message, 'error');
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
  }
}
async function resetLicenseCode(code) {
  confirmModal('Bütün cihazları sıfırla?', `${code} kodu bağlı olduğu bütün cihazlardan ayrılacaq, yenidən öz limitinə qədər aktivləşdirilə bilər. Mövcud istifadəçilər kod istəyəcək.`, async () => {
    try {
      await fbdb.ref(`${LICENSE_PATH}/${code}`).update({ deviceIds: [] });
      toast('Kod sıfırlandı');
      openAdminPanel();
    } catch (e) {
      toast('Xəta: ' + e.message, 'error');
    }
  });
}

const DB_KEY = 'sirniyyat_db_v6';
// Yalnız adı TƏSDİQLƏNMİŞ (alt-mətni yoxlanılmış) real şəkillər saxlanıldı.
const IMG = {
  ballıTort: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALQiHAkXe43qate2K8RJwzphK_eVKzDJC-5R-2Amfqu21030Netch_9Nws49Xy2CU-IbFUmCHkTnfFJDlDmwkFoxJwDDK8bL2efKS0erQif48u1taf9A2Fhf-RHVriJGkm_xXBS7dRlzQffdB1t6_-0LTmyxIK3hExpd2XkFc10c38rMu7upJ1jAtl9wk9MfasKJ09x0lcMa2r2ZE6d_87lzC_tn4engb962omil1e2eW2iDmqTEJ7',
  napoleon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADtGLAEb9zCT10NvFdflbFVT96hSuetHXsqJrHfdgamC-Rprynex1hbnAnCvYLX7YOay0WOLwHLwiNK5-XilrI1lAG93Bxb54HcKZ_Q9LquVgx-lD93eXH8jz4hpU1otJxYIJQxJ88yweGVoDjqb4pLxVzX2LJCbSpnGpA-efJWH1zRMIDu4-93lB0xj_Oj4gb5eTEQICbtzMXoi2azQkUn5QaX2--kIt2Gd0bwi2_6yy8Mm_mVV0V',
  kurasan: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtOhhyG4QEn51Ju004JPrnQUm9VPml6XfpN-8og5YD45TSQ62zMZYn9iZZR-JoW2vJEyCHpIHM0vDtnpFHFiKvUfAT5JIQ4lY3K1SpR8nTshcPNOTzFYgSI1jGFTWS37O1Hs1vea_gW_QxtDa6nSu1JCeTnlDeLQd0pYktYovyfVp8xs9TRoCfzzaKRUy8ldGAr0qSwT6IPVwLBP2_q_0J6CBkxsJqLUEQhQUON_HKQF2ijBnK2cT0',
  paxlava: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBm1GvPvWyRkFsbYXmNpB0Wn8U9Msbsbj0kNxlXaxtoYDHXhPdT9WWIEcTc6f0w6FGrwTdFNTySqbqY1A7qD3uilJqo_xG3nDv17vWqUZYYuShH16P0xt_MKPcY78zUaLrcMU_K3TCNb2R2vajStjEuFCQNwIcYNCzo2lkeDIsLiPnUHl5K8tVihSXkFVq4lQbWrw7ZhaOLrmif-M8uTGoFUtiQakO0LHVoqZPu4CUhQoaBsNqUarp3',
  miniPaxlava: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4UrvKf3qpHKHVHXSU7yAAimQstSv_mtU-bJiihETZhSfLeUxdOs9xG275ZdEX73VX98ymy-hXMGQOeDBnSc50gRWQfn3vOreeOPlUyNV5WT7zjUGGajQM9860slfdXs6d1tUrhC8mVK5OvMiGriiZCLGSXJiRhemdHUAu_0DGep5Tv4TDJ0zYTKFc2Z7ZtKwhSgCifkAvYBL2sQY776r-nF8dyZExRmkR5M6NpTJ_e5BrBRTVVWhl',
  chocCake: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpiYTJi916BMOWTjZq7U4O9N2CxT4NCWxbAr53nesh6YAT--9I0enkdGt9p5bKq7E1N0DazK2qAGSPSU71AEfMNp-4PxqcpfH39CgCGMYj72sXhRi08tei5EZ-TjvxY6723Yi72OQ0bM1NhsqTHvRFFA-rGSW5jBfLDhRjojAxvpJ2LzOK1ZBYGJpvJ2DxZcPNzGZEGi_Uh3bD9BTJfT2u6-gqOKrdS6hxHRAs62_8sWrqkiAml7CC',
  sekerburaReal: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sekerbura_DSC3151.jpg',
  qogalReal: 'https://commons.wikimedia.org/wiki/Special:FilePath/%C5%9Eirin_qo%C4%9Fal.jpg',
  eclairReal: 'https://commons.wikimedia.org/wiki/Special:FilePath/Liebesknochen3.JPG',
  cayDestiReal: 'https://commons.wikimedia.org/wiki/Special:FilePath/Tea_in_Azerbaijani_national_Armudu_glass.jpg'
};
// Bu məhsullar üçün etibarlı yoxlanmış real şəkil tapılmadı — səliqəli emoji-tile istifadə olunur.
// Samir Firebase Storage vasitəsilə real şəkil yükləyəndə buraya img sahəsi əlavə oluna bilər.
// Uyğun real şəkli olmayan (nadir) hallar üçün ehtiyat emoji-tile
const EMOJI_TILE = {
  tortAssorti: { emoji: '🎂', bg: 'from-[#fce4ec] to-[#e4beb2]' },
  cocaCola1L: { emoji: '🥤', bg: 'from-[#f5c6c6] to-[#e89a9a]' },
  cocaCola05L: { emoji: '🥤', bg: 'from-[#f5c6c6] to-[#e89a9a]' },
  fanta1L: { emoji: '🍊', bg: 'from-[#fbdca0] to-[#f5b56f]' },
  fanta05L: { emoji: '🍊', bg: 'from-[#fbdca0] to-[#f5b56f]' },
  kofe: { emoji: '☕', bg: 'from-[#e4beb2] to-[#c99870]' },
  kofe3x1: { emoji: '🥤', bg: 'from-[#e4beb2] to-[#c99870]' },
  cheesecake: { emoji: '🍰', bg: 'from-[#fce4ec] to-[#fed7ca]' },
  makaron: { emoji: '🍬', bg: 'from-[#f2ecb8] to-[#fce4ec]' },
  pecenye: { emoji: '🍪', bg: 'from-[#f2ecb8] to-[#e4beb2]' }
};
function productVisual(p, sizeClasses) {
  if (p.img) return `<img src="${p.img}" onerror="this.onerror=null;this.src='${IMG.ballıTort}'" class="${sizeClasses} object-cover" alt="${escapeHtml(p.name)}"/>`;
  const t = EMOJI_TILE[p.emojiKey] || { emoji: '🍰', bg: 'from-primary-container to-secondary-container' };
  return `<div class="${sizeClasses} flex items-center justify-center text-3xl bg-gradient-to-br ${t.bg}">${t.emoji}</div>`;
}

function uid(prefix) { return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function fmtMoney(n) { return (Math.round(n * 100) / 100).toFixed(2) + ' AZN'; }
function initials(name) { return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(); }
function escapeHtml(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function seedDB() {
  const categories = [
    { id: uid('cat'), name: 'Tortlar', icon: 'cake' },
    { id: uid('cat'), name: 'Şirniyyat', icon: 'cookie' },
    { id: uid('cat'), name: 'Kuraşenlər', icon: 'bakery_dining' },
    { id: uid('cat'), name: 'İçkilər', icon: 'local_cafe' }
  ];
  const products = [
    { id: uid('p'), name: "Tort 'Napoleon'", desc: 'Klassik resept', price: 45, stock: 12, unit: 'ədəd', catId: categories[0].id, img: IMG.napoleon },
    { id: uid('p'), name: 'Kurasan', desc: 'Kərə yağı ilə', price: 3.5, stock: 45, unit: 'ədəd', catId: categories[2].id, img: IMG.kurasan },
    { id: uid('p'), name: 'Paxlava', desc: 'Qozlu, ballı', price: 2, stock: 30, unit: 'pors', catId: categories[1].id, img: IMG.paxlava },
    { id: uid('p'), name: 'Mini Paxlava', desc: 'Qarışıq qoz-fındıq', price: 1.5, stock: 60, unit: 'ədəd', catId: categories[1].id, img: IMG.miniPaxlava },
    { id: uid('p'), name: 'Şəkərbura', desc: 'Ənənəvi Novruz şirniyyatı', price: 2.2, stock: 40, unit: 'ədəd', catId: categories[1].id, img: IMG.sekerburaReal },
    { id: uid('p'), name: 'Qoğal', desc: 'Zəncəfilli, xəşilli', price: 2.5, stock: 25, unit: 'ədəd', catId: categories[1].id, img: IMG.qogalReal },
    { id: uid('p'), name: 'Ballı Tort', desc: 'Ənənəvi bal tortu, qat-qat', price: 42, stock: 8, unit: 'ədəd', catId: categories[0].id, img: IMG.ballıTort },
    { id: uid('p'), name: 'Tort Assorti', desc: 'Şokoladlı, qarışıq çeşid', price: 38, stock: 6, unit: 'ədəd', catId: categories[0].id, img: IMG.chocCake },
    { id: uid('p'), name: 'Eklerlər', desc: 'Şokoladlı krem dolması', price: 3, stock: 20, unit: 'ədəd', catId: categories[2].id, img: IMG.eclairReal },
    { id: uid('p'), name: 'Çay dəsti', desc: 'Qara çay, 6 ədəd bişkot ilə', price: 6, stock: 15, unit: 'dəst', catId: categories[3].id, img: IMG.cayDestiReal },
    { id: uid('p'), name: 'Coca-Cola 1L', desc: 'Soyuq sərinləşdirici içki', price: 3, stock: 30, unit: 'ədəd', catId: categories[3].id, emojiKey: 'cocaCola1L' },
    { id: uid('p'), name: 'Coca-Cola 0.5L', desc: 'Soyuq sərinləşdirici içki', price: 2, stock: 40, unit: 'ədəd', catId: categories[3].id, emojiKey: 'cocaCola05L' },
    { id: uid('p'), name: 'Fanta 1L', desc: 'Portağal dadlı sərinləşdirici içki', price: 3, stock: 25, unit: 'ədəd', catId: categories[3].id, emojiKey: 'fanta1L' },
    { id: uid('p'), name: 'Fanta 0.5L', desc: 'Portağal dadlı sərinləşdirici içki', price: 2, stock: 35, unit: 'ədəd', catId: categories[3].id, emojiKey: 'fanta05L' },
    { id: uid('p'), name: 'Kofe', desc: 'Təzə dəmlənmiş kofe', price: 2.5, stock: 50, unit: 'fincan', catId: categories[3].id, emojiKey: 'kofe' },
    { id: uid('p'), name: 'Kofe 3x1', desc: 'Hazır qarışıq, paket kofe', price: 0.8, stock: 80, unit: 'paket', catId: categories[3].id, emojiKey: 'kofe3x1' },
    { id: uid('p'), name: 'Qara Çay', desc: 'Ənənəvi Azərbaycan qara çayı', price: 1, stock: 60, unit: 'stəkan', catId: categories[3].id, img: IMG.cayDestiReal },
    { id: uid('p'), name: 'Cheesecake', desc: 'Krem pendirli tort', price: 8, stock: 10, unit: 'dilim', catId: categories[0].id, emojiKey: 'cheesecake' },
    { id: uid('p'), name: 'Makaron', desc: 'Fransız şirniyyatı, badam unlu', price: 2.8, stock: 30, unit: 'ədəd', catId: categories[1].id, emojiKey: 'makaron' },
    { id: uid('p'), name: 'Peçenye', desc: 'Fiqurlu, ev şirniyyatı', price: 1.2, stock: 50, unit: 'ədəd', catId: categories[1].id, emojiKey: 'pecenye' }
  ];
  const customers = [
    { id: uid('c'), name: 'Aysel Məmmədova', phone: '+994 50 123 45 67', birthday: '1994-03-12', address: 'Nərimanov r., Bakı', notes: 'VIP müştəri, hər ay tort sifariş edir' },
    { id: uid('c'), name: 'Emin Həsənov', phone: '+994 55 234 56 78', birthday: '1988-11-02', address: 'Yasamal r., Bakı', notes: '' },
    { id: uid('c'), name: 'Lalə Quliyeva', phone: '+994 70 345 67 89', birthday: '1996-07-21', address: 'Xətai r., Bakı', notes: 'Novruz şirniyyatlarını sevir' },
    { id: uid('c'), name: 'Rəşad Əliyev', phone: '+994 51 456 78 90', birthday: '1991-05-30', address: 'Sabunçu r., Bakı', notes: '' }
  ];
  const now = Date.now();
  const orders = [
    { id: uid('o'), customerId: customers[0].id, date: todayISO(), time: '10:45', items: [{ productId: products[0].id, qty: 1, price: 45 }, { productId: products[1].id, qty: 2, price: 3.5 }], status: 'hazir', discount: 0, createdAt: now - 3600000 },
    { id: uid('o'), customerId: customers[1].id, date: todayISO(), time: '09:30', items: [{ productId: products[2].id, qty: 10, price: 2 }, { productId: products[9].id, qty: 1, price: 6 }], status: 'hazirlanir', discount: 0, createdAt: now - 7200000 },
    { id: uid('o'), customerId: customers[2].id, date: todayISO(), time: '08:15', items: [{ productId: products[4].id, qty: 5, price: 2.2 }, { productId: products[5].id, qty: 5, price: 2.5 }], status: 'tehvil', discount: 0, createdAt: now - 10800000 },
    { id: uid('o'), customerId: customers[3].id, date: todayISO(), time: '07:50', items: [{ productId: products[6].id, qty: 1, price: 42 }], status: 'catdirilma', discount: 5, createdAt: now - 14400000 }
  ];
  return { categories, products, customers, orders, receivings: [] };
}

function loadDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.receivings) parsed.receivings = [];
      return parsed;
    } catch (e) {}
  }
  const seeded = seedDB();
  localStorage.setItem(DB_KEY, JSON.stringify(seeded));
  return seeded;
}
function saveDB() { localStorage.setItem(DB_KEY, JSON.stringify(DB)); }

let DB = loadDB();
let ROUTE = 'dashboard';

function navigate(route) {
  ROUTE = route;
  document.querySelectorAll('.nav-link').forEach(el => el.classList.toggle('text-primary', el.dataset.nav === route));
  document.querySelectorAll('.nav-link').forEach(el => el.classList.toggle('border-b-2', el.dataset.nav === route));
  document.querySelectorAll('.nav-link').forEach(el => el.classList.toggle('border-primary', el.dataset.nav === route));
  document.querySelectorAll('.bottom-nav-link').forEach(el => {
    const active = el.dataset.nav === route;
    el.classList.toggle('nav-active', active);
    el.classList.toggle('text-on-surface-variant', !active);
  });
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  const el = document.createElement('div');
  const bg = type === 'success' ? 'bg-[#2E7D32]' : type === 'error' ? 'bg-error' : 'bg-primary';
  el.className = `toast-anim ${bg} text-white px-4 py-2 rounded-full shadow-lg text-body-sm font-body-sm flex items-center gap-2`;
  el.innerHTML = `<span class="material-symbols-outlined text-base">${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}</span> ${escapeHtml(msg)}`;
  c.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

function closeModal() { document.getElementById('modal-root').innerHTML = ''; }

function openModal(html) {
  document.getElementById('modal-root').innerHTML = `
    <div class="fixed inset-0 z-[90] flex items-end md:items-center justify-center modal-backdrop fade-in" onclick="if(event.target===this) closeModal()">
      <div class="bg-surface w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto slide-up">
        ${html}
      </div>
    </div>`;
}

function confirmModal(title, desc, onConfirm) {
  openModal(`
    <div class="p-6 text-center">
      <div class="w-14 h-14 mx-auto rounded-full bg-error-container flex items-center justify-center mb-4">
        <span class="material-symbols-outlined text-error text-3xl">delete</span>
      </div>
      <h3 class="text-headline-sm font-headline-sm text-on-background mb-2">${escapeHtml(title)}</h3>
      <p class="text-body-sm font-body-sm text-on-surface-variant mb-6">${escapeHtml(desc)}</p>
      <div class="flex gap-3">
        <button onclick="closeModal()" class="flex-1 py-3 rounded-full border border-outline-variant text-on-background font-label-md text-label-md hover:bg-surface-container transition-colors">Ləğv et</button>
        <button id="confirm-del-btn" class="flex-1 py-3 rounded-full bg-error text-on-error font-label-md text-label-md hover:opacity-90 transition-opacity">Sil</button>
      </div>
    </div>`);
  document.getElementById('confirm-del-btn').onclick = () => { onConfirm(); closeModal(); };
}

/* ---------------- STAT HELPERS ---------------- */
function orderTotal(order) {
  const sum = order.items.reduce((s, it) => s + it.qty * it.price, 0);
  return sum - (sum * (order.discount || 0) / 100);
}
function activeOrders() { return DB.orders.filter(o => o.status !== 'legv'); }
function todaysOrders() { return activeOrders().filter(o => o.date === todayISO()); }
function statusLabel(s) {
  return { hazirlanir: 'Hazırlanır', hazir: 'Hazırdır', tehvil: 'Təhvil verildi', catdirilma: 'Çatdırılmada', legv: 'Ləğv edildi' }[s] || s;
}
function statusClass(s) {
  return {
    hazirlanir: 'bg-primary-container text-on-primary-container',
    hazir: 'bg-[#E8F5E9] text-[#2E7D32]',
    tehvil: 'bg-[#E8F5E9] text-[#2E7D32]',
    catdirilma: 'bg-secondary-container text-on-secondary-container',
    legv: 'bg-error-container text-error'
  }[s] || 'bg-surface-container text-on-surface-variant';
}

/* ---------------- RENDER ROOT ---------------- */
function render() {
  const app = document.getElementById('app');
  if (!LICENSED) return renderActivationScreen();
  if (ROUTE === 'dashboard') return renderDashboard(app);
  if (ROUTE === 'pos') return renderPOS(app);
  if (ROUTE === 'products') return renderProducts(app);
  if (ROUTE === 'orders') return renderOrders(app);
  if (ROUTE === 'receiving') return renderReceiving(app);
  if (ROUTE === 'customers') return renderCustomers(app);
  if (ROUTE === 'reports') return renderReports(app);
  if (ROUTE === 'settings') return renderSettings(app);
}

/* ================= SATIŞ (POS) ================= */
let posCart = []; // { productId, qty, price }
function posCatFilter() { return document.getElementById('app').dataset.posCat || 'all'; }

function renderPOS(app) {
  const today = todaysOrders().reduce((s, o) => s + orderTotal(o), 0);
  const thisMonth = todayISO().slice(0, 7);
  const monthTotal = activeOrders().filter(o => o.date.startsWith(thisMonth)).reduce((s, o) => s + orderTotal(o), 0);

  app.innerHTML = `
    <div class="fade-in pb-24">
      <div class="flex justify-between items-center mb-sm">
        <h2 class="text-headline-md font-headline-md text-on-background">Satış</h2>
        <div class="flex gap-2 text-right">
          <div class="bg-surface-container-lowest rounded-xl border border-primary-container px-3 py-2 soft-shadow">
            <p class="text-[10px] font-label-sm text-on-surface-variant uppercase">Bugün</p>
            <p class="text-label-md font-label-md text-on-background font-bold">${today.toFixed(0)} ₼</p>
          </div>
          <div class="bg-surface-container-lowest rounded-xl border border-primary-container px-3 py-2 soft-shadow">
            <p class="text-[10px] font-label-sm text-on-surface-variant uppercase">Bu ay</p>
            <p class="text-label-md font-label-md text-on-background font-bold">${monthTotal.toFixed(0)} ₼</p>
          </div>
        </div>
      </div>

      <div class="flex gap-2 overflow-x-auto pb-2 mb-md no-scrollbar" id="pos-cat-filters">
        <button onclick="filterPOS('all')" class="pos-cat-chip px-4 py-1.5 rounded-full text-label-md font-label-md whitespace-nowrap transition-colors bg-primary text-on-primary">Hamısı</button>
        ${DB.categories.map(c => `<button onclick="filterPOS('${c.id}')" class="pos-cat-chip px-4 py-1.5 rounded-full text-label-md font-label-md whitespace-nowrap transition-colors bg-surface-container text-on-surface-variant">${escapeHtml(c.name)}</button>`).join('')}
      </div>

      <div id="pos-grid" class="grid grid-cols-2 md:grid-cols-4 gap-sm mb-4"></div>
    </div>

    <!-- Sabit səbət paneli -->
    <div id="pos-cart-bar" class="fixed bottom-16 md:bottom-4 left-0 w-full px-4 z-40 flex justify-center pointer-events-none">
      <div id="pos-cart-inner" class="pointer-events-auto max-w-md w-full bg-primary text-on-primary rounded-full shadow-lg px-5 py-3 flex items-center justify-between cursor-pointer hover:opacity-95 transition-opacity" style="display:none;" onclick="openCartDrawer()">
        <span class="flex items-center gap-2 font-label-md text-label-md">
          <span class="material-symbols-outlined">shopping_cart</span>
          <span id="pos-cart-count">0</span> məhsul
        </span>
        <span id="pos-cart-total" class="font-headline-sm font-headline-sm">0.00 AZN</span>
      </div>
    </div>`;
  renderPOSGrid('all');
  updateCartBar();
}

function filterPOS(catId) {
  document.getElementById('app').dataset.posCat = catId;
  document.querySelectorAll('#pos-cat-filters .pos-cat-chip').forEach((btn, i) => {
    const isAll = i === 0;
    const match = isAll ? catId === 'all' : DB.categories[i - 1] && DB.categories[i - 1].id === catId;
    btn.className = `pos-cat-chip px-4 py-1.5 rounded-full text-label-md font-label-md whitespace-nowrap transition-colors ${match ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`;
  });
  renderPOSGrid(catId);
}

function renderPOSGrid(catId) {
  const list = catId === 'all' ? DB.products : DB.products.filter(p => p.catId === catId);
  const grid = document.getElementById('pos-grid');
  grid.innerHTML = list.length ? list.map(p => {
    const inCart = posCart.find(it => it.productId === p.id);
    const qty = inCart ? inCart.qty : 0;
    return `
    <div onclick="addToCart('${p.id}')" class="relative bg-surface-container-lowest rounded-xl border ${qty > 0 ? 'border-primary ring-2 ring-primary/30' : 'border-primary-container'} soft-shadow overflow-hidden cursor-pointer active:scale-95 transition-transform select-none">
      <div class="relative aspect-square overflow-hidden bg-surface-container">
        ${productVisual(p, 'w-full h-full')}
        ${qty > 0 ? `<span class="absolute top-2 right-2 bg-primary text-on-primary text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow">${qty}</span>` : ''}
      </div>
      <div class="p-sm">
        <h4 class="text-body-sm font-body-sm text-on-background font-semibold truncate">${escapeHtml(p.name)}</h4>
        <span class="text-label-md font-label-md text-primary font-bold">${fmtMoney(p.price)}</span>
      </div>
    </div>`;
  }).join('') : `<div class="col-span-2 md:col-span-4 text-center py-12 text-on-surface-variant text-body-md">Bu kateqoriyada məhsul yoxdur</div>`;
}

function addToCart(pid) {
  const p = DB.products.find(x => x.id === pid);
  if (!p) return;
  const existing = posCart.find(it => it.productId === pid);
  if (existing) existing.qty += 1; else posCart.push({ productId: pid, qty: 1, price: p.price });
  renderPOSGrid(posCatFilter());
  updateCartBar();
  if (document.getElementById('cart-drawer-list')) renderCartDrawerList();
}
function changeCartQty(pid, delta) {
  const it = posCart.find(x => x.productId === pid);
  if (!it) return;
  it.qty += delta;
  if (it.qty <= 0) posCart = posCart.filter(x => x.productId !== pid);
  renderPOSGrid(posCatFilter());
  updateCartBar();
  renderCartDrawerList();
}
function updateCartBar() {
  const bar = document.getElementById('pos-cart-inner');
  if (!bar) return;
  const count = posCart.reduce((s, it) => s + it.qty, 0);
  const total = posCart.reduce((s, it) => s + it.qty * it.price, 0);
  bar.style.display = count > 0 ? 'flex' : 'none';
  document.getElementById('pos-cart-count').textContent = count;
  document.getElementById('pos-cart-total').textContent = fmtMoney(total);
}

function openCartDrawer() {
  if (!posCart.length) return;
  openModal(`
    <div class="p-6">
      <h3 class="text-headline-sm font-headline-sm text-on-background mb-4">Səbət</h3>
      <div id="cart-drawer-list" class="space-y-2 mb-4 max-h-64 overflow-y-auto"></div>
      <div>
        <label class="text-label-sm font-label-sm text-on-surface-variant">Müştəri (istəyə bağlı)</label>
        <select id="pos-customer-select" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none">
          <option value="">Sürətli satış (müştərisiz)</option>
          ${DB.customers.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
        </select>
      </div>
      <div class="mt-3">
        <label class="text-label-sm font-label-sm text-on-surface-variant">Endirim (%)</label>
        <input id="pos-discount-input" type="number" min="0" max="100" value="0" oninput="renderCartDrawerList()" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none"/>
      </div>
      <div class="flex justify-between items-center px-1 pt-4">
        <span class="text-body-md font-body-md text-on-surface-variant">Cəmi:</span>
        <span id="pos-drawer-total" class="text-headline-sm font-headline-sm text-on-background">0.00 AZN</span>
      </div>
      <div class="flex gap-3 pt-4">
        <button onclick="closeModal()" class="flex-1 py-3 rounded-full border border-outline-variant text-on-background font-label-md text-label-md hover:bg-surface-container transition-colors">Davam et</button>
        <button onclick="completeSale()" class="flex-1 py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center justify-center gap-1">
          <span class="material-symbols-outlined text-base">check_circle</span> Satışı Tamamla
        </button>
      </div>
    </div>`);
  renderCartDrawerList();
}
function renderCartDrawerList() {
  const el = document.getElementById('cart-drawer-list');
  if (!el) return;
  el.innerHTML = posCart.length ? posCart.map(it => {
    const p = DB.products.find(x => x.id === it.productId);
    return `
    <div class="flex items-center justify-between gap-2 bg-surface-container-lowest border border-surface-variant/30 rounded-lg px-3 py-2">
      <div class="flex items-center gap-2 min-w-0">
        <div class="w-9 h-9 rounded-lg overflow-hidden shrink-0">${productVisual(p, 'w-full h-full')}</div>
        <span class="text-body-sm font-body-sm truncate">${escapeHtml(p ? p.name : '?')}</span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button onclick="changeCartQty('${it.productId}', -1)" class="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center"><span class="material-symbols-outlined text-sm">remove</span></button>
        <span class="text-label-md font-label-md w-4 text-center">${it.qty}</span>
        <button onclick="changeCartQty('${it.productId}', 1)" class="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center"><span class="material-symbols-outlined text-sm">add</span></button>
        <b class="text-label-sm w-16 text-right">${fmtMoney(it.qty * it.price)}</b>
      </div>
    </div>`;
  }).join('') : `<p class="text-label-sm text-on-surface-variant text-center py-4">Səbət boşdur</p>`;
  const sum = posCart.reduce((s, it) => s + it.qty * it.price, 0);
  const disc = parseFloat(document.getElementById('pos-discount-input')?.value) || 0;
  const totalEl = document.getElementById('pos-drawer-total');
  if (totalEl) totalEl.textContent = fmtMoney(sum - sum * disc / 100);
  if (!posCart.length) closeModal();
}
function completeSale() {
  if (!posCart.length) { toast('Səbət boşdur', 'error'); return; }
  const customerId = document.getElementById('pos-customer-select').value;
  const discount = parseFloat(document.getElementById('pos-discount-input').value) || 0;
  const now = new Date();
  const order = {
    id: uid('o'), customerId: customerId || null, date: todayISO(), time: now.toTimeString().slice(0, 5),
    createdAt: Date.now(), items: posCart.map(it => ({ ...it })), discount, status: 'tehvil'
  };
  DB.orders.push(order);
  posCart.forEach(it => {
    const p = DB.products.find(x => x.id === it.productId);
    if (p) p.stock = Math.max(0, p.stock - it.qty);
  });
  saveDB();
  posCart = [];
  toast('Satış tamamlandı! ✅');
  showReceipt(order);
  renderPOSGrid(posCatFilter());
  updateCartBar();
}

function showReceipt(order) {
  const sum = order.items.reduce((s, it) => s + it.qty * it.price, 0);
  const final = sum - sum * (order.discount || 0) / 100;
  const itemsHtml = order.items.map((it, i) => {
    const p = DB.products.find(x => x.id === it.productId);
    const name = p ? p.name : '?';
    const lineTotal = fmtMoney(it.qty * it.price);
    return `<div class="rline"><span>${i + 1}. ${escapeHtml(name)} x${it.qty}</span><span>${lineTotal}</span></div>`;
  }).join('');
  openModal(`
    <div class="p-6">
      <div id="receipt-print-area" class="receipt-paper bg-white p-4 rounded-lg border border-dashed border-outline-variant">
        <h3 class="text-center font-bold text-base mb-2">Ev Ləzzəti Şirniyyat</h3>
        <div class="border-t border-dashed border-gray-400 my-2"></div>
        ${itemsHtml}
        <div class="border-t border-dashed border-gray-400 my-2"></div>
        ${order.discount ? `<div class="rline"><span>Endirim</span><span>${order.discount}%</span></div>` : ''}
        <div class="rline items-center mt-1">
          <span>${order.discount ? `<span class="line-through text-gray-400">${fmtMoney(sum)}</span>` : ''}</span>
          <span class="font-bold text-base">${fmtMoney(final)}</span>
        </div>
        <div class="border-t border-dashed border-gray-400 my-3"></div>
        <p class="text-center text-sm">Nuş olsun!<br/>Bizi seçdiyiniz üçün təşəkkür edirik!</p>
      </div>
      <div class="flex gap-3 pt-4">
        <button onclick="closeModal(); navigate('pos');" class="flex-1 py-3 rounded-full border border-outline-variant text-on-background font-label-md text-label-md hover:bg-surface-container transition-colors">Bağla</button>
        <button onclick="window.print()" class="flex-1 py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center justify-center gap-1">
          <span class="material-symbols-outlined text-base">print</span> Çap et
        </button>
      </div>
    </div>`);
}

/* ================= DASHBOARD ================= */
function renderDashboard(app) {
  const today = todaysOrders();
  const dailySales = today.reduce((s, o) => s + orderTotal(o), 0);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const ySales = activeOrders().filter(o => o.date === yesterday).reduce((s, o) => s + orderTotal(o), 0);
  const growth = ySales > 0 ? Math.round(((dailySales - ySales) / ySales) * 100) : (dailySales > 0 ? 100 : 0);
  const newOrders = today.length;
  const delivering = activeOrders().filter(o => o.status === 'catdirilma').length;

  const salesByProduct = {};
  activeOrders().forEach(o => o.items.forEach(it => { salesByProduct[it.productId] = (salesByProduct[it.productId] || 0) + it.qty; }));
  const topProducts = Object.entries(salesByProduct).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([pid, qty]) => ({ product: DB.products.find(p => p.id === pid), qty }))
    .filter(x => x.product);

  const recentOrders = [...DB.orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);

  const hour = new Date().getHours();
  const greetings = hour < 6 ? ['Gecəniz xeyrə qalsın 🌙', 'Sabah yeni fırın növbəsi başlayır'] :
    hour < 12 ? ['Sabahınız xeyir ☀️', 'Bu gün yeni sifarişlərlə dolu ola bilər'] :
    hour < 17 ? ['Xoş gördük! 🍰', 'Günün ən şirin saatları burdadır'] :
    hour < 21 ? ['Axşamınız xeyir 🌇', 'Günü yekunlaşdıraq, rəqəmlərə baxaq'] :
    ['Gecəniz xoş keçsin 🌃', 'Sabaha hazırlıq üçün son baxış'];
  app.innerHTML = `
    <div class="fade-in">
      <h2 class="text-headline-md font-headline-md text-on-background">${greetings[0]}</h2>
      <p class="text-body-md font-body-md text-on-surface-variant mb-md">${greetings[1]}</p>

      <div class="glass-card rounded-2xl p-md mb-sm">
        <div class="flex items-center gap-2 text-on-surface-variant text-body-sm font-body-sm mb-2">
          <span class="material-symbols-outlined text-lg">payments</span> Günlük Satış
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-headline-lg font-headline-lg text-on-background">${dailySales.toFixed(0)}</span>
          <span class="text-body-lg font-body-lg text-on-surface-variant">AZN</span>
        </div>
        <span class="inline-block mt-2 px-3 py-1 rounded-full text-label-sm font-label-sm ${growth >= 0 ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-error-container text-error'}">
          ${growth >= 0 ? '↗' : '↘'} ${growth >= 0 ? '+' : ''}${growth}% dünənə görə
        </span>
      </div>

      <div class="grid grid-cols-2 gap-sm mb-md">
        <div onclick="navigate('orders')" class="bg-surface-container-lowest rounded-xl border border-primary-container soft-shadow p-md text-center cursor-pointer hover:-translate-y-0.5 transition-transform">
          <div class="text-3xl mb-1">🎂</div>
          <div class="text-headline-sm font-headline-sm text-on-background">${newOrders}</div>
          <div class="text-body-sm font-body-sm text-on-surface-variant">Bugünkü Sifariş</div>
        </div>
        <div onclick="navigate('orders')" class="bg-surface-container-lowest rounded-xl border border-primary-container soft-shadow p-md text-center cursor-pointer hover:-translate-y-0.5 transition-transform">
          <div class="text-3xl mb-1">🚚</div>
          <div class="text-headline-sm font-headline-sm text-on-background">${delivering}</div>
          <div class="text-body-sm font-body-sm text-on-surface-variant">Çatdırılmada</div>
        </div>
      </div>

      <div class="flex justify-between items-center mb-sm">
        <h3 class="text-headline-sm font-headline-sm text-on-background">Top Məhsullar</h3>
        <button onclick="navigate('products')" class="text-label-md font-label-md text-primary hover:text-secondary transition-colors">Hamısı</button>
      </div>
      <div class="bg-surface-container-lowest rounded-xl border border-primary-container soft-shadow p-sm mb-md space-y-2">
        ${topProducts.length ? topProducts.map(({ product, qty }) => `
          <div class="rounded-lg p-sm flex items-center gap-sm border border-surface-variant/20 hover:bg-surface-container-low transition-colors">
            <div class="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-container">
              ${productVisual(product, 'w-full h-full')}
            </div>
            <div class="flex-grow min-w-0">
              <h4 class="text-body-lg font-body-lg text-on-background font-semibold truncate">${escapeHtml(product.name)}</h4>
              <p class="text-body-sm font-body-sm text-on-surface-variant truncate">${escapeHtml(product.desc)}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-label-md font-label-md text-on-background">${qty} ${product.unit}</p>
              <p class="text-label-sm font-label-sm text-secondary">Satılıb</p>
            </div>
          </div>`).join('') : `<p class="text-body-sm text-on-surface-variant text-center py-4">Hələ satış qeydə alınmayıb</p>`}
      </div>

      <div class="flex justify-between items-center mb-sm">
        <h3 class="text-headline-sm font-headline-sm text-on-background">Son Sifarişlər</h3>
        <button onclick="navigate('orders')" class="text-label-md font-label-md text-primary hover:text-secondary transition-colors">Tarixçə</button>
      </div>
      <div class="bg-surface-container-lowest rounded-xl border border-primary-container soft-shadow p-sm mb-8">
        ${recentOrders.length ? recentOrders.map(o => {
          const c = DB.customers.find(cu => cu.id === o.customerId) || { name: 'Naməlum' };
          const itemsText = o.items.map(it => { const p = DB.products.find(pp => pp.id === it.productId); return `${it.qty}x ${p ? p.name : '?'}`; }).join(', ');
          return `
          <div class="flex items-start gap-md py-sm border-b border-surface-variant/30 last:border-0 hover:bg-primary-container/10 transition-colors rounded-lg px-2 -mx-2 cursor-pointer" onclick="navigate('orders')">
            <div class="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0 mt-1">
              <span class="text-label-md font-label-md">${initials(c.name)}</span>
            </div>
            <div class="flex-grow min-w-0">
              <div class="flex justify-between items-start gap-2">
                <h4 class="text-body-md font-body-md text-on-background font-semibold truncate">${escapeHtml(c.name)}</h4>
                <span class="text-label-sm font-label-sm text-on-surface-variant shrink-0">${o.time}</span>
              </div>
              <p class="text-body-sm font-body-sm text-on-surface-variant mt-1 truncate">${escapeHtml(itemsText)}</p>
              <div class="mt-2 flex items-center gap-2">
                <span class="px-2 py-1 rounded-full ${statusClass(o.status)} text-[10px] font-bold uppercase tracking-wide">${statusLabel(o.status)}</span>
                <span class="text-label-sm font-label-sm text-on-background font-semibold">${fmtMoney(orderTotal(o))}</span>
              </div>
            </div>
          </div>`;
        }).join('') : `<p class="text-body-sm text-on-surface-variant text-center py-4">Hələ sifariş yoxdur</p>`}
      </div>
    </div>`;
}

/* ================= PRODUCTS ================= */
function renderProducts(app) {
  const filterCat = app.dataset.catFilter || 'all';
  app.innerHTML = `
    <div class="fade-in">
      <div class="flex justify-between items-center mb-md">
        <h2 class="text-headline-md font-headline-md text-on-background">Məhsullar</h2>
        <div class="flex gap-2">
          <button onclick="openCategoryManager()" class="px-3 py-2 rounded-full border border-outline-variant text-label-md font-label-md text-on-background hover:bg-surface-container transition-colors flex items-center gap-1">
            <span class="material-symbols-outlined text-base">category</span> Kateqoriyalar
          </button>
          <button onclick="openProductForm()" class="px-4 py-2 rounded-full bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-opacity flex items-center gap-1">
            <span class="material-symbols-outlined text-base">add</span> Yeni
          </button>
        </div>
      </div>
      <div class="flex gap-2 overflow-x-auto pb-2 mb-md" id="cat-filters">
        <button onclick="filterProducts('all')" class="cat-chip px-4 py-1.5 rounded-full text-label-md font-label-md whitespace-nowrap transition-colors ${filterCat === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}">Hamısı</button>
        ${DB.categories.map(c => `<button onclick="filterProducts('${c.id}')" class="cat-chip px-4 py-1.5 rounded-full text-label-md font-label-md whitespace-nowrap transition-colors ${filterCat === c.id ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}">${escapeHtml(c.name)}</button>`).join('')}
      </div>
      <div id="product-grid" class="grid grid-cols-2 md:grid-cols-4 gap-sm"></div>
    </div>`;
  renderProductGrid(filterCat);
}
function filterProducts(catId) {
  document.getElementById('app').dataset.catFilter = catId;
  document.querySelectorAll('#cat-filters .cat-chip').forEach((btn, i) => {
    const isAll = i === 0;
    const match = isAll ? catId === 'all' : DB.categories[i - 1] && DB.categories[i - 1].id === catId;
    btn.className = `cat-chip px-4 py-1.5 rounded-full text-label-md font-label-md whitespace-nowrap transition-colors ${match ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`;
  });
  renderProductGrid(catId);
}
function renderProductGrid(catId) {
  const list = catId === 'all' ? DB.products : DB.products.filter(p => p.catId === catId);
  const grid = document.getElementById('product-grid');
  grid.innerHTML = list.length ? list.map(p => {
    const cat = DB.categories.find(c => c.id === p.catId);
    const low = p.stock <= 5;
    return `
    <div class="bg-surface-container-lowest rounded-xl border border-primary-container soft-shadow overflow-hidden group">
      <div class="relative aspect-square overflow-hidden bg-surface-container">
        <div class="absolute inset-0 group-hover:scale-105 transition-transform duration-300">${productVisual(p, 'w-full h-full')}</div>
        ${low ? `<span class="absolute top-2 left-2 bg-error text-on-error text-[10px] font-bold px-2 py-0.5 rounded-full">AZ QALIB</span>` : ''}
      </div>
      <div class="p-sm">
        <h4 class="text-body-md font-body-md text-on-background font-semibold truncate">${escapeHtml(p.name)}</h4>
        <p class="text-label-sm font-label-sm text-on-surface-variant truncate mb-1">${escapeHtml(cat ? cat.name : '')}</p>
        <div class="flex justify-between items-center">
          <span class="text-label-md font-label-md text-primary font-bold">${fmtMoney(p.price)}</span>
          <span class="text-label-sm font-label-sm text-on-surface-variant">${p.stock} ${escapeHtml(p.unit)}</span>
        </div>
        <div class="flex gap-1 mt-2">
          <button onclick="openProductForm('${p.id}')" class="flex-1 py-1.5 rounded-full bg-surface-container text-on-background text-label-sm font-label-sm hover:bg-primary-container transition-colors">Redaktə</button>
          <button onclick="deleteProduct('${p.id}')" class="p-1.5 rounded-full bg-error-container text-error hover:opacity-80 transition-opacity">
            <span class="material-symbols-outlined text-base block">delete</span>
          </button>
        </div>
      </div>
    </div>`;
  }).join('') : `<div class="col-span-2 md:col-span-4 text-center py-12 text-on-surface-variant text-body-md">Bu kateqoriyada məhsul yoxdur</div>`;
}

function openProductForm(id) {
  const p = id ? DB.products.find(x => x.id === id) : null;
  openModal(`
    <div class="p-6">
      <h3 class="text-headline-sm font-headline-sm text-on-background mb-4">${p ? 'Məhsulu Redaktə Et' : 'Yeni Məhsul Əlavə Et'}</h3>
      <form id="product-form" class="space-y-3">
        <div>
          <label class="text-label-sm font-label-sm text-on-surface-variant">Məhsul adı</label>
          <input required name="name" value="${p ? escapeHtml(p.name) : ''}" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none" placeholder="Məs: Napoleon Tort"/>
        </div>
        <div>
          <label class="text-label-sm font-label-sm text-on-surface-variant">Təsvir</label>
          <input name="desc" value="${p ? escapeHtml(p.desc) : ''}" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none" placeholder="Məs: Klassik resept"/>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-label-sm font-label-sm text-on-surface-variant">Qiymət (AZN)</label>
            <input required type="number" step="0.01" min="0" name="price" value="${p ? p.price : ''}" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none"/>
          </div>
          <div>
            <label class="text-label-sm font-label-sm text-on-surface-variant">Stok</label>
            <input required type="number" min="0" name="stock" value="${p ? p.stock : ''}" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none"/>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-label-sm font-label-sm text-on-surface-variant">Ölçü vahidi</label>
            <input name="unit" value="${p ? escapeHtml(p.unit) : 'ədəd'}" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none"/>
          </div>
          <div>
            <label class="text-label-sm font-label-sm text-on-surface-variant">Kateqoriya</label>
            <select name="catId" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none">
              ${DB.categories.map(c => `<option value="${c.id}" ${p && p.catId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div>
          <label class="text-label-sm font-label-sm text-on-surface-variant">Şəkil URL (istəyə bağlı)</label>
          <input name="img" value="${p ? escapeHtml(p.img) : ''}" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none" placeholder="https://..."/>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" onclick="closeModal()" class="flex-1 py-3 rounded-full border border-outline-variant text-on-background font-label-md text-label-md hover:bg-surface-container transition-colors">Ləğv et</button>
          <button type="submit" class="flex-1 py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity">${p ? 'Yadda saxla' : 'Əlavə et'}</button>
        </div>
      </form>
    </div>`);
  document.getElementById('product-form').onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const data = {
      name: f.get('name').trim(), desc: f.get('desc').trim(), price: parseFloat(f.get('price')) || 0,
      stock: parseInt(f.get('stock')) || 0, unit: f.get('unit').trim() || 'ədəd', catId: f.get('catId'),
      img: f.get('img').trim()
    };
    if (p) { Object.assign(p, data); toast('Məhsul yeniləndi'); }
    else { DB.products.push({ id: uid('p'), ...data }); toast('Məhsul əlavə edildi'); }
    saveDB(); closeModal(); renderProducts(document.getElementById('app'));
  };
}
function deleteProduct(id) {
  const p = DB.products.find(x => x.id === id);
  confirmModal('Məhsulu sil?', `"${p.name}" məhsulunu silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.`, () => {
    DB.products = DB.products.filter(x => x.id !== id);
    saveDB(); toast('Məhsul silindi'); renderProducts(document.getElementById('app'));
  });
}

function openCategoryManager() {
  openModal(`
    <div class="p-6">
      <h3 class="text-headline-sm font-headline-sm text-on-background mb-4">Kateqoriyaları İdarə Et</h3>
      <div id="cat-list" class="space-y-2 mb-4 max-h-64 overflow-y-auto"></div>
      <form id="cat-form" class="flex gap-2">
        <input required name="name" placeholder="Yeni kateqoriya adı" class="flex-grow px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none"/>
        <button type="submit" class="px-4 py-3 rounded-full bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-opacity">Əlavə et</button>
      </form>
      <button onclick="closeModal()" class="w-full mt-4 py-3 rounded-full border border-outline-variant text-on-background font-label-md text-label-md hover:bg-surface-container transition-colors">Bağla</button>
    </div>`);
  renderCatList();
  document.getElementById('cat-form').onsubmit = (e) => {
    e.preventDefault();
    const name = new FormData(e.target).get('name').trim();
    if (!name) return;
    DB.categories.push({ id: uid('cat'), name, icon: 'category' });
    saveDB(); toast('Kateqoriya əlavə edildi'); e.target.reset(); renderCatList();
  };
}
function renderCatList() {
  const el = document.getElementById('cat-list');
  el.innerHTML = DB.categories.map(c => {
    const count = DB.products.filter(p => p.catId === c.id).length;
    return `
    <div class="flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-variant/30">
      <span class="text-body-md font-body-md text-on-background">${escapeHtml(c.name)} <span class="text-label-sm text-on-surface-variant">(${count})</span></span>
      <button onclick="deleteCategory('${c.id}')" class="text-error hover:opacity-70 transition-opacity"><span class="material-symbols-outlined text-lg block">delete</span></button>
    </div>`;
  }).join('') || `<p class="text-body-sm text-on-surface-variant text-center">Kateqoriya yoxdur</p>`;
}
function deleteCategory(id) {
  const c = DB.categories.find(x => x.id === id);
  const count = DB.products.filter(p => p.catId === id).length;
  confirmModal('Kateqoriyanı sil?', count > 0 ? `"${c.name}" kateqoriyasında ${count} məhsul var. Silsəniz məhsullar "kateqoriyasız" qalacaq.` : `"${c.name}" kateqoriyasını silmək istəyirsiniz?`, () => {
    DB.categories = DB.categories.filter(x => x.id !== id);
    saveDB(); toast('Kateqoriya silindi'); renderCatList();
    if (ROUTE === 'products') renderProducts(document.getElementById('app'));
  });
}

/* ================= ORDERS ================= */
function renderOrders(app) {
  const sorted = [...DB.orders].sort((a, b) => b.createdAt - a.createdAt);
  app.innerHTML = `
    <div class="fade-in">
      <div class="flex justify-between items-center mb-md">
        <h2 class="text-headline-md font-headline-md text-on-background">Sifarişlər</h2>
        <button onclick="openOrderForm()" class="px-4 py-2 rounded-full bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-opacity flex items-center gap-1">
          <span class="material-symbols-outlined text-base">add</span> Yeni Sifariş
        </button>
      </div>
      <div class="space-y-3">
        ${sorted.length ? sorted.map(o => {
          const c = DB.customers.find(cu => cu.id === o.customerId) || { name: 'Naməlum müştəri' };
          const itemsText = o.items.map(it => { const p = DB.products.find(pp => pp.id === it.productId); return `${it.qty}x ${p ? p.name : '?'}`; }).join(', ');
          return `
          <div class="bg-surface-container-lowest rounded-xl border ${o.status === 'legv' ? 'border-error/40 opacity-75' : 'border-primary-container'} soft-shadow p-md">
            <div class="flex justify-between items-start gap-2 mb-2">
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
                  <span class="text-label-sm font-label-sm">${initials(c.name)}</span>
                </div>
                <div class="min-w-0">
                  <h4 class="text-body-md font-body-md text-on-background font-semibold truncate ${o.status === 'legv' ? 'line-through' : ''}">${escapeHtml(c.name)}</h4>
                  <p class="text-label-sm font-label-sm text-on-surface-variant">${o.date} · ${o.time}</p>
                </div>
              </div>
              <span class="px-2 py-1 rounded-full ${statusClass(o.status)} text-[10px] font-bold uppercase tracking-wide shrink-0">${statusLabel(o.status)}</span>
            </div>
            <p class="text-body-sm font-body-sm text-on-surface-variant mb-2">${escapeHtml(itemsText)}</p>
            ${o.status === 'legv' ? `<p class="text-label-sm font-label-sm text-error mb-2">Səbəb: ${escapeHtml(o.cancelReason || '-')}</p>` : ''}
            <div class="flex justify-between items-center">
              <span class="text-label-md font-label-md text-on-background font-bold ${o.status === 'legv' ? 'line-through' : ''}">${fmtMoney(orderTotal(o))}</span>
              <div class="flex items-center gap-2">
                ${o.status !== 'legv' ? `
                <select onchange="updateOrderStatus('${o.id}', this.value)" class="text-label-sm font-label-sm border border-outline-variant rounded-full px-2 py-1 bg-surface-container-lowest outline-none">
                  <option value="hazirlanir" ${o.status === 'hazirlanir' ? 'selected' : ''}>Hazırlanır</option>
                  <option value="hazir" ${o.status === 'hazir' ? 'selected' : ''}>Hazırdır</option>
                  <option value="catdirilma" ${o.status === 'catdirilma' ? 'selected' : ''}>Çatdırılmada</option>
                  <option value="tehvil" ${o.status === 'tehvil' ? 'selected' : ''}>Təhvil verildi</option>
                </select>
                <button onclick="openOrderForm('${o.id}')" class="p-1.5 rounded-full bg-surface-container hover:bg-primary-container transition-colors"><span class="material-symbols-outlined text-base block">edit</span></button>
                ` : ''}
                <button onclick="deleteOrder('${o.id}')" class="p-1.5 rounded-full ${o.status === 'legv' ? 'bg-surface-container text-on-surface-variant' : 'bg-error-container text-error'} hover:opacity-80 transition-opacity" title="${o.status === 'legv' ? 'Bərpa et' : 'Ləğv et'}">
                  <span class="material-symbols-outlined text-base block">${o.status === 'legv' ? 'restore' : 'cancel'}</span>
                </button>
                ${o.status === 'legv' ? `
                <button onclick="permanentlyDeleteOrder('${o.id}')" class="p-1.5 rounded-full bg-error-container text-error hover:opacity-80 transition-opacity" title="Tam sil">
                  <span class="material-symbols-outlined text-base block">delete_forever</span>
                </button>` : ''}
              </div>
            </div>
          </div>`;
        }).join('') : `<div class="text-center py-12 text-on-surface-variant text-body-md">Hələ sifariş yoxdur</div>`}
      </div>
    </div>`;
}
function updateOrderStatus(id, status) {
  const o = DB.orders.find(x => x.id === id);
  o.status = status; saveDB(); toast('Status yeniləndi');
}
function permanentlyDeleteOrder(id) {
  const o = DB.orders.find(x => x.id === id);
  if (!o || o.status !== 'legv') return; // yalnız artıq ləğv edilmiş (audit izli) sifarişlər tam silinə bilər
  confirmModal('Tam sil?', 'Bu ləğv edilmiş sifariş sistemdən həmişəlik silinəcək (test məlumatlarını təmizləmək üçün). Bu əməliyyat geri qaytarıla bilməz.', () => {
    DB.orders = DB.orders.filter(x => x.id !== id);
    saveDB(); toast('Sifariş tam silindi'); renderOrders(document.getElementById('app'));
  });
}
function deleteOrder(id) {
  const o = DB.orders.find(x => x.id === id);
  if (!o) return;
  if (o.status === 'legv') {
    confirmModal('Sifarişi bərpa et?', 'Bu sifariş ləğv edilib. Yenidən aktiv etmək istəyirsiniz?', () => {
      o.status = 'hazirlanir'; delete o.cancelReason; delete o.cancelledAt;
      saveDB(); toast('Sifariş bərpa edildi'); renderOrders(document.getElementById('app'));
    });
    return;
  }
  openModal(`
    <div class="p-6">
      <div class="w-14 h-14 mx-auto rounded-full bg-error-container flex items-center justify-center mb-4">
        <span class="material-symbols-outlined text-error text-3xl">warning</span>
      </div>
      <h3 class="text-headline-sm font-headline-sm text-on-background mb-2 text-center">Sifarişi Ləğv Et</h3>
      <p class="text-body-sm font-body-sm text-on-surface-variant mb-4 text-center">Sifariş silinmir, "Ləğv edildi" statusuna keçir və qeyd tarixçədə saxlanılır. Səbəb yazmaq məcburidir.</p>
      <form id="cancel-order-form">
        <label class="text-label-sm font-label-sm text-on-surface-variant">Ləğv səbəbi</label>
        <textarea required name="reason" rows="3" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none" placeholder="Məs: müştəri imtina etdi, səhv daxil edilib..."></textarea>
        <div class="flex gap-3 pt-4">
          <button type="button" onclick="closeModal()" class="flex-1 py-3 rounded-full border border-outline-variant text-on-background font-label-md text-label-md hover:bg-surface-container transition-colors">Geri</button>
          <button type="submit" class="flex-1 py-3 rounded-full bg-error text-on-error font-label-md text-label-md hover:opacity-90 transition-opacity">Ləğv Et</button>
        </div>
      </form>
    </div>`);
  document.getElementById('cancel-order-form').onsubmit = (e) => {
    e.preventDefault();
    const reason = new FormData(e.target).get('reason').trim();
    if (!reason) return;
    o.status = 'legv';
    o.cancelReason = reason;
    o.cancelledAt = Date.now();
    saveDB();
    closeModal();
    toast('Sifariş ləğv edildi');
    renderOrders(document.getElementById('app'));
  };
}

function openOrderForm(id) {
  const o = id ? DB.orders.find(x => x.id === id) : null;
  let cart = o ? o.items.map(it => ({ ...it })) : [];
  openModal(`
    <div class="p-6">
      <h3 class="text-headline-sm font-headline-sm text-on-background mb-4">${o ? 'Sifarişi Redaktə Et' : 'Yeni Sifariş Əlavə Et'}</h3>
      <form id="order-form" class="space-y-3">
        <div>
          <label class="text-label-sm font-label-sm text-on-surface-variant">Müştəri</label>
          <select required name="customerId" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none">
            <option value="">Seçin...</option>
            ${DB.customers.map(c => `<option value="${c.id}" ${o && o.customerId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-label-sm font-label-sm text-on-surface-variant">Məhsul əlavə et</label>
          <div class="flex gap-2 mt-1">
            <select id="order-product-select" class="flex-grow px-3 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none">
              ${DB.products.map(p => `<option value="${p.id}">${escapeHtml(p.name)} — ${fmtMoney(p.price)}</option>`).join('')}
            </select>
            <input id="order-qty-input" type="number" min="1" value="1" class="w-16 px-2 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none text-center"/>
            <button type="button" onclick="addCartItem()" class="px-3 py-2.5 rounded-xl bg-primary-container text-on-primary-container"><span class="material-symbols-outlined text-base block">add</span></button>
          </div>
        </div>
        <div id="order-cart-list" class="space-y-1 max-h-40 overflow-y-auto"></div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-label-sm font-label-sm text-on-surface-variant">Endirim (%)</label>
            <input type="number" min="0" max="100" name="discount" value="${o ? (o.discount || 0) : 0}" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none"/>
          </div>
          <div>
            <label class="text-label-sm font-label-sm text-on-surface-variant">Status</label>
            <select name="status" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none">
              <option value="hazirlanir" ${o && o.status === 'hazirlanir' ? 'selected' : ''}>Hazırlanır</option>
              <option value="hazir" ${o && o.status === 'hazir' ? 'selected' : ''}>Hazırdır</option>
              <option value="catdirilma" ${o && o.status === 'catdirilma' ? 'selected' : ''}>Çatdırılmada</option>
              <option value="tehvil" ${o && o.status === 'tehvil' ? 'selected' : ''}>Təhvil verildi</option>
            </select>
          </div>
        </div>
        <div class="flex justify-between items-center px-1 pt-1">
          <span class="text-body-md font-body-md text-on-surface-variant">Cəmi:</span>
          <span id="order-total-preview" class="text-headline-sm font-headline-sm text-on-background">0.00 AZN</span>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" onclick="closeModal()" class="flex-1 py-3 rounded-full border border-outline-variant text-on-background font-label-md text-label-md hover:bg-surface-container transition-colors">Ləğv et</button>
          <button type="submit" class="flex-1 py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity">${o ? 'Yadda saxla' : 'Sifarişi əlavə et'}</button>
        </div>
      </form>
    </div>`);

  window.addCartItem = () => {
    const pid = document.getElementById('order-product-select').value;
    const qty = parseInt(document.getElementById('order-qty-input').value) || 1;
    const p = DB.products.find(x => x.id === pid);
    if (!p) return;
    const existing = cart.find(it => it.productId === pid);
    if (existing) existing.qty += qty; else cart.push({ productId: pid, qty, price: p.price });
    renderCartList();
  };
  window.removeCartItem = (pid) => { cart = cart.filter(it => it.productId !== pid); renderCartList(); };
  window.renderCartList = () => {
    const el = document.getElementById('order-cart-list');
    const discountInput = document.querySelector('#order-form [name=discount]');
    el.innerHTML = cart.length ? cart.map(it => {
      const p = DB.products.find(x => x.id === it.productId);
      return `<div class="flex justify-between items-center text-body-sm bg-surface-container-lowest border border-surface-variant/30 rounded-lg px-3 py-2">
        <span>${it.qty}x ${escapeHtml(p ? p.name : '?')}</span>
        <span class="flex items-center gap-2"><b>${fmtMoney(it.qty * it.price)}</b>
        <button type="button" onclick="removeCartItem('${it.productId}')" class="text-error"><span class="material-symbols-outlined text-base block">close</span></button></span>
      </div>`;
    }).join('') : `<p class="text-label-sm text-on-surface-variant text-center py-2">Səbət boşdur</p>`;
    const sum = cart.reduce((s, it) => s + it.qty * it.price, 0);
    const disc = parseFloat(discountInput?.value) || 0;
    document.getElementById('order-total-preview').textContent = fmtMoney(sum - sum * disc / 100);
  };
  document.querySelector('#order-form [name=discount]').addEventListener('input', renderCartList);
  renderCartList();

  document.getElementById('order-form').onsubmit = (e) => {
    e.preventDefault();
    if (!cart.length) { toast('Ən azı bir məhsul əlavə edin', 'error'); return; }
    const f = new FormData(e.target);
    const data = { customerId: f.get('customerId'), items: cart, discount: parseFloat(f.get('discount')) || 0, status: f.get('status') };
    if (o) { Object.assign(o, data); toast('Sifariş yeniləndi'); }
    else {
      const now = new Date();
      DB.orders.push({ id: uid('o'), date: todayISO(), time: now.toTimeString().slice(0, 5), createdAt: Date.now(), ...data });
      toast('Sifariş əlavə edildi');
    }
    saveDB(); closeModal(); renderOrders(document.getElementById('app'));
  };
}

/* ================= MAL QƏBULU ================= */
let receivingCart = [];
function receivingDateFilter() { return document.getElementById('app').dataset.recDate || todayISO(); }

function renderReceiving(app) {
  const date = receivingDateFilter();
  app.innerHTML = `
    <div class="fade-in">
      <div class="flex justify-between items-center mb-md">
        <h2 class="text-headline-md font-headline-md text-on-background">Mal Qəbulu</h2>
        <button onclick="openReceivingForm()" class="px-4 py-2 rounded-full bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-opacity flex items-center gap-1">
          <span class="material-symbols-outlined text-base">add</span> Yeni Qəbul
        </button>
      </div>
      <div class="flex items-center gap-2 mb-md">
        <span class="material-symbols-outlined text-on-surface-variant">calendar_month</span>
        <input id="receiving-date-input" type="date" value="${date}" onchange="filterReceivingByDate(this.value)" class="px-4 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none"/>
        <button onclick="filterReceivingByDate('${todayISO()}')" class="text-label-sm font-label-sm text-primary">Bu gün</button>
      </div>
      <div id="receiving-list" class="space-y-3"></div>
    </div>`;
  renderReceivingList(date);
}
function filterReceivingByDate(date) {
  document.getElementById('app').dataset.recDate = date;
  renderReceivingList(date);
}
function renderReceivingList(date) {
  const list = DB.receivings.filter(r => r.date === date).sort((a, b) => b.createdAt - a.createdAt);
  const totalQty = list.reduce((s, r) => s + r.items.reduce((x, it) => x + it.qty, 0), 0);
  const el = document.getElementById('receiving-list');
  el.innerHTML = `
    <div class="bg-surface-container-lowest rounded-xl border border-primary-container soft-shadow p-md mb-2 flex justify-between items-center">
      <span class="text-body-sm font-body-sm text-on-surface-variant">${date} tarixində qəbul olunan</span>
      <span class="text-label-md font-label-md text-on-background font-bold">${totalQty} ədəd</span>
    </div>
    ${list.length ? list.map(r => {
      const itemsText = r.items.map(it => { const p = DB.products.find(pp => pp.id === it.productId); return `${it.qty}x ${p ? p.name : '?'}`; }).join(', ');
      return `
      <div class="bg-surface-container-lowest rounded-xl border border-primary-container soft-shadow p-md">
        <div class="flex justify-between items-start gap-2 mb-1">
          <div>
            <h4 class="text-body-md font-body-md text-on-background font-semibold">${escapeHtml(r.supplierName)}</h4>
            <p class="text-label-sm font-label-sm text-on-surface-variant">${r.time}${r.invoiceNo ? ' · Faktura №' + escapeHtml(r.invoiceNo) : ''}</p>
          </div>
          <button onclick="deleteReceiving('${r.id}')" class="p-1.5 rounded-full bg-error-container text-error hover:opacity-80 transition-opacity shrink-0"><span class="material-symbols-outlined text-base block">delete</span></button>
        </div>
        <p class="text-body-sm font-body-sm text-on-surface-variant">${escapeHtml(itemsText)}</p>
      </div>`;
    }).join('') : `<div class="text-center py-12 text-on-surface-variant text-body-md">Bu tarixdə mal qəbulu qeydə alınmayıb</div>`}
  `;
}

function openReceivingForm() {
  receivingCart = [];
  openModal(`
    <div class="p-6">
      <h3 class="text-headline-sm font-headline-sm text-on-background mb-4">Yeni Mal Qəbulu</h3>
      <form id="receiving-form" class="space-y-3">
        <div>
          <label class="text-label-sm font-label-sm text-on-surface-variant">Gətirən şəxsin adı</label>
          <input required name="supplierName" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none" placeholder="Ad Soyad"/>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-label-sm font-label-sm text-on-surface-variant">Faktura № (istəyə bağlı)</label>
            <input name="invoiceNo" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none"/>
          </div>
          <div>
            <label class="text-label-sm font-label-sm text-on-surface-variant">Tarix</label>
            <input required type="date" name="date" value="${todayISO()}" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none"/>
          </div>
        </div>
        <div>
          <label class="text-label-sm font-label-sm text-on-surface-variant">Məhsul əlavə et</label>
          <div class="flex gap-2 mt-1">
            <select id="rec-product-select" class="flex-grow px-3 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none">
              ${DB.products.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}
            </select>
            <input id="rec-qty-input" type="number" min="1" value="1" class="w-16 px-2 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none text-center"/>
            <button type="button" onclick="addReceivingItem()" class="px-3 py-2.5 rounded-xl bg-primary-container text-on-primary-container"><span class="material-symbols-outlined text-base block">add</span></button>
          </div>
        </div>
        <div id="rec-cart-list" class="space-y-1 max-h-40 overflow-y-auto"></div>
        <div class="flex gap-3 pt-2">
          <button type="button" onclick="closeModal()" class="flex-1 py-3 rounded-full border border-outline-variant text-on-background font-label-md text-label-md hover:bg-surface-container transition-colors">Ləğv et</button>
          <button type="submit" class="flex-1 py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity">Qəbulu Təsdiqlə</button>
        </div>
      </form>
    </div>`);
  window.addReceivingItem = () => {
    const pid = document.getElementById('rec-product-select').value;
    const qty = parseInt(document.getElementById('rec-qty-input').value) || 1;
    const p = DB.products.find(x => x.id === pid);
    if (!p) return;
    const existing = receivingCart.find(it => it.productId === pid);
    if (existing) existing.qty += qty; else receivingCart.push({ productId: pid, qty });
    renderRecCartList();
  };
  window.removeReceivingItem = (pid) => { receivingCart = receivingCart.filter(it => it.productId !== pid); renderRecCartList(); };
  window.renderRecCartList = () => {
    const el = document.getElementById('rec-cart-list');
    el.innerHTML = receivingCart.length ? receivingCart.map(it => {
      const p = DB.products.find(x => x.id === it.productId);
      return `<div class="flex justify-between items-center text-body-sm bg-surface-container-lowest border border-surface-variant/30 rounded-lg px-3 py-2">
        <span>${it.qty}x ${escapeHtml(p ? p.name : '?')}</span>
        <button type="button" onclick="removeReceivingItem('${it.productId}')" class="text-error"><span class="material-symbols-outlined text-base block">close</span></button>
      </div>`;
    }).join('') : `<p class="text-label-sm text-on-surface-variant text-center py-2">Hələ məhsul əlavə edilməyib</p>`;
  };
  renderRecCartList();

  document.getElementById('receiving-form').onsubmit = (e) => {
    e.preventDefault();
    if (!receivingCart.length) { toast('Ən azı bir məhsul əlavə edin', 'error'); return; }
    const f = new FormData(e.target);
    const now = new Date();
    DB.receivings.push({
      id: uid('r'), supplierName: f.get('supplierName').trim(), invoiceNo: f.get('invoiceNo').trim(),
      date: f.get('date'), time: now.toTimeString().slice(0, 5), createdAt: Date.now(),
      items: receivingCart.map(it => ({ ...it }))
    });
    receivingCart.forEach(it => {
      const p = DB.products.find(x => x.id === it.productId);
      if (p) p.stock += it.qty;
    });
    saveDB();
    closeModal();
    toast('Mal qəbulu qeydə alındı, stok yeniləndi ✅');
    document.getElementById('app').dataset.recDate = f.get('date');
    renderReceiving(document.getElementById('app'));
  };
}
function deleteReceiving(id) {
  const r = DB.receivings.find(x => x.id === id);
  if (!r) return;
  confirmModal('Qəbul qeydini sil?', 'Bu qeydi silsəniz, əlaqədar stok artımı geri alınmayacaq (yalnız qeyd silinəcək). Stoku əl ilə düzəltməli ola bilərsiniz.', () => {
    DB.receivings = DB.receivings.filter(x => x.id !== id);
    saveDB(); toast('Qeyd silindi'); renderReceivingList(receivingDateFilter());
  });
}

/* ================= CUSTOMERS ================= */
function renderCustomers(app) {
  app.innerHTML = `
    <div class="fade-in">
      <div class="flex justify-between items-center mb-md">
        <h2 class="text-headline-md font-headline-md text-on-background">Müştərilər</h2>
        <button onclick="openCustomerForm()" class="px-4 py-2 rounded-full bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-opacity flex items-center gap-1">
          <span class="material-symbols-outlined text-base">person_add</span> Yeni
        </button>
      </div>
      <input id="customer-search" oninput="filterCustomers(this.value)" placeholder="Müştəri axtar..." class="w-full mb-md px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none"/>
      <div id="customer-list" class="space-y-2"></div>
    </div>`;
  renderCustomerList(DB.customers);
}
function filterCustomers(q) {
  q = q.toLowerCase();
  renderCustomerList(DB.customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)));
}
function renderCustomerList(list) {
  const el = document.getElementById('customer-list');
  el.innerHTML = list.length ? list.map(c => {
    const orderCount = DB.orders.filter(o => o.customerId === c.id).length;
    const spent = activeOrders().filter(o => o.customerId === c.id).reduce((s, o) => s + orderTotal(o), 0);
    return `
    <div class="bg-surface-container-lowest rounded-xl border border-primary-container soft-shadow p-md flex items-center gap-sm">
      <div class="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
        <span class="text-label-md font-label-md">${initials(c.name)}</span>
      </div>
      <div class="flex-grow min-w-0">
        <h4 class="text-body-md font-body-md text-on-background font-semibold truncate">${escapeHtml(c.name)}</h4>
        <p class="text-label-sm font-label-sm text-on-surface-variant truncate">${escapeHtml(c.phone)} ${c.birthday ? '· 🎂 ' + c.birthday : ''}</p>
        <p class="text-label-sm font-label-sm text-secondary">${orderCount} sifariş · ${fmtMoney(spent)}</p>
      </div>
      <div class="flex flex-col gap-1 shrink-0">
        <button onclick="openCustomerForm('${c.id}')" class="p-2 rounded-full bg-surface-container hover:bg-primary-container transition-colors"><span class="material-symbols-outlined text-base block">edit</span></button>
        <button onclick="deleteCustomer('${c.id}')" class="p-2 rounded-full bg-error-container text-error hover:opacity-80 transition-opacity"><span class="material-symbols-outlined text-base block">delete</span></button>
      </div>
    </div>`;
  }).join('') : `<div class="text-center py-12 text-on-surface-variant text-body-md">Müştəri tapılmadı</div>`;
}
function openCustomerForm(id) {
  const c = id ? DB.customers.find(x => x.id === id) : null;
  openModal(`
    <div class="p-6">
      <h3 class="text-headline-sm font-headline-sm text-on-background mb-4">${c ? 'Müştərini Redaktə Et' : 'Yeni Müştəri Əlavə Et'}</h3>
      <form id="customer-form" class="space-y-3">
        <div>
          <label class="text-label-sm font-label-sm text-on-surface-variant">Ad Soyad</label>
          <input required name="name" value="${c ? escapeHtml(c.name) : ''}" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none" placeholder="Məs: Aysel Məmmədova"/>
        </div>
        <div>
          <label class="text-label-sm font-label-sm text-on-surface-variant">Telefon</label>
          <input required name="phone" value="${c ? escapeHtml(c.phone) : ''}" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none" placeholder="+994 50 123 45 67"/>
        </div>
        <div>
          <label class="text-label-sm font-label-sm text-on-surface-variant">Doğum tarixi</label>
          <input type="date" name="birthday" value="${c ? (c.birthday || '') : ''}" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none"/>
        </div>
        <div>
          <label class="text-label-sm font-label-sm text-on-surface-variant">Ünvan</label>
          <input name="address" value="${c ? escapeHtml(c.address || '') : ''}" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none" placeholder="Rayon, küçə"/>
        </div>
        <div>
          <label class="text-label-sm font-label-sm text-on-surface-variant">Qeydlər</label>
          <textarea name="notes" rows="2" class="w-full mt-1 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary outline-none">${c ? escapeHtml(c.notes || '') : ''}</textarea>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" onclick="closeModal()" class="flex-1 py-3 rounded-full border border-outline-variant text-on-background font-label-md text-label-md hover:bg-surface-container transition-colors">Ləğv et</button>
          <button type="submit" class="flex-1 py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity">${c ? 'Yadda saxla' : 'Əlavə et'}</button>
        </div>
      </form>
    </div>`);
  document.getElementById('customer-form').onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const data = { name: f.get('name').trim(), phone: f.get('phone').trim(), birthday: f.get('birthday'), address: f.get('address').trim(), notes: f.get('notes').trim() };
    if (c) { Object.assign(c, data); toast('Müştəri yeniləndi'); }
    else { DB.customers.push({ id: uid('c'), ...data }); toast('Müştəri əlavə edildi'); }
    saveDB(); closeModal(); renderCustomers(document.getElementById('app'));
  };
}
function deleteCustomer(id) {
  const c = DB.customers.find(x => x.id === id);
  const orderCount = DB.orders.filter(o => o.customerId === id).length;
  confirmModal('Müştərini sil?', orderCount > 0 ? `"${c.name}" adlı müştərinin ${orderCount} sifarişi var. Silsəniz sifarişlərdə müştəri adı görünməyəcək.` : `"${c.name}" adlı müştərini silmək istədiyinizə əminsiniz?`, () => {
    DB.customers = DB.customers.filter(x => x.id !== id);
    saveDB(); toast('Müştəri silindi'); renderCustomers(document.getElementById('app'));
  });
}

/* ================= REPORTS ================= */
let salesChartInstance = null, catChartInstance = null;
function renderReports(app) {
  const last7 = [...Array(7)].map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return d.toISOString().slice(0, 10);
  });
  const salesByDay = last7.map(d => activeOrders().filter(o => o.date === d).reduce((s, o) => s + orderTotal(o), 0));
  const dayLabels = last7.map(d => new Date(d).toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit' }));

  const catTotals = {};
  activeOrders().forEach(o => o.items.forEach(it => {
    const p = DB.products.find(pp => pp.id === it.productId);
    if (!p) return;
    const cat = DB.categories.find(c => c.id === p.catId);
    const key = cat ? cat.name : 'Digər';
    catTotals[key] = (catTotals[key] || 0) + it.qty * it.price;
  }));

  const totalRevenue = activeOrders().reduce((s, o) => s + orderTotal(o), 0);
  const avgOrder = activeOrders().length ? totalRevenue / activeOrders().length : 0;

  const topCustomers = DB.customers.map(c => ({
    c, spent: activeOrders().filter(o => o.customerId === c.id).reduce((s, o) => s + orderTotal(o), 0)
  })).sort((a, b) => b.spent - a.spent).slice(0, 5);

  app.innerHTML = `
    <div class="fade-in">
      <h2 class="text-headline-md font-headline-md text-on-background mb-md">Hesabatlar</h2>
      <div class="grid grid-cols-2 gap-sm mb-md">
        <div class="bg-surface-container-lowest rounded-xl border border-primary-container soft-shadow p-md">
          <p class="text-label-sm font-label-sm text-on-surface-variant">Ümumi Gəlir</p>
          <p class="text-headline-sm font-headline-sm text-on-background">${fmtMoney(totalRevenue)}</p>
        </div>
        <div class="bg-surface-container-lowest rounded-xl border border-primary-container soft-shadow p-md">
          <p class="text-label-sm font-label-sm text-on-surface-variant">Orta Sifariş</p>
          <p class="text-headline-sm font-headline-sm text-on-background">${fmtMoney(avgOrder)}</p>
        </div>
      </div>
      <div class="bg-surface-container-lowest rounded-xl border border-primary-container soft-shadow p-md mb-md">
        <h3 class="text-body-lg font-body-lg text-on-background font-semibold mb-2">Son 7 gün satış</h3>
        <canvas id="salesChart" height="180"></canvas>
      </div>
      <div class="bg-surface-container-lowest rounded-xl border border-primary-container soft-shadow p-md mb-md">
        <h3 class="text-body-lg font-body-lg text-on-background font-semibold mb-2">Kateqoriya üzrə satış</h3>
        <canvas id="catChart" height="200"></canvas>
      </div>
      <div class="bg-surface-container-lowest rounded-xl border border-primary-container soft-shadow p-md">
        <h3 class="text-body-lg font-body-lg text-on-background font-semibold mb-3">Top Müştərilər</h3>
        <div class="space-y-2">
          ${topCustomers.map(({ c, spent }, i) => `
            <div class="flex items-center justify-between">
              <span class="text-body-sm font-body-sm text-on-background">${i + 1}. ${escapeHtml(c.name)}</span>
              <span class="text-label-md font-label-md text-primary font-bold">${fmtMoney(spent)}</span>
            </div>`).join('') || `<p class="text-body-sm text-on-surface-variant text-center">Məlumat yoxdur</p>`}
        </div>
      </div>
    </div>`;

  if (salesChartInstance) salesChartInstance.destroy();
  if (catChartInstance) catChartInstance.destroy();
  salesChartInstance = new Chart(document.getElementById('salesChart'), {
    type: 'line',
    data: { labels: dayLabels, datasets: [{ label: 'Satış (AZN)', data: salesByDay, borderColor: '#75584d', backgroundColor: 'rgba(117,88,77,0.1)', fill: true, tension: 0.35, pointBackgroundColor: '#75584d' }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => v + ' ₼' } }, x: { grid: { display: false } } } }
  });
  const catLabels = Object.keys(catTotals);
  catChartInstance = new Chart(document.getElementById('catChart'), {
    type: 'doughnut',
    data: { labels: catLabels.length ? catLabels : ['Məlumat yoxdur'], datasets: [{ data: catLabels.length ? Object.values(catTotals) : [1], backgroundColor: ['#d7c1c8', '#eae4b1', '#ffdbd0', '#fed7ca', '#f2ecb8', '#e4beb2'] }] },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
}

/* ================= SETTINGS ================= */
function renderSettings(app) {
  app.innerHTML = `
    <div class="fade-in max-w-md">
      <h2 class="text-headline-md font-headline-md text-on-background mb-md">Parametrlər</h2>
      <div class="bg-surface-container-lowest rounded-xl border border-primary-container soft-shadow p-md space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-body-md font-body-md text-on-background">Mağaza adı</span>
          <span class="text-body-sm font-body-sm text-on-surface-variant">Ev Ləzzəti Şirniyyat</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-body-md font-body-md text-on-background">Cəmi məhsul</span>
          <span class="text-body-sm font-body-sm text-on-surface-variant">${DB.products.length}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-body-md font-body-md text-on-background">Cəmi müştəri</span>
          <span class="text-body-sm font-body-sm text-on-surface-variant">${DB.customers.length}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-body-md font-body-md text-on-background">Cəmi sifariş</span>
          <span class="text-body-sm font-body-sm text-on-surface-variant">${DB.orders.length}</span>
        </div>
      </div>
      <div class="flex flex-col gap-2 mt-md">
        <button onclick="exportData()" class="w-full py-3 rounded-full border border-outline-variant text-on-background font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-base">download</span> Məlumatları ehtiyat kopyala (JSON)
        </button>
        <button onclick="resetData()" class="w-full py-3 rounded-full bg-error-container text-error font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-base">restart_alt</span> Bütün məlumatları sıfırla
        </button>
      </div>
    </div>`;
}
function exportData() {
  const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'sirniyyat-crm-backup-' + todayISO() + '.json'; a.click();
  toast('Ehtiyat nüsxə endirildi');
}
function resetData() {
  confirmModal('Bütün məlumatları sıfırla?', 'Bütün məhsul, müştəri və sifarişlər silinəcək və nümunə məlumatlarla əvəz olunacaq. Bu əməliyyat geri qaytarıla bilməz.', () => {
    localStorage.removeItem(DB_KEY);
    DB = loadDB();
    toast('Məlumatlar sıfırlandı');
    navigate('dashboard');
  });
}

/* ---------------- INIT ---------------- */
checkLicense().then(ok => {
  LICENSED = ok;
  if (ok) { navigate('dashboard'); }
  else { renderActivationScreen(); }
});
