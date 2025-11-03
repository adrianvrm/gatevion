// Close all popovers util
function closeAllPopovers(){
  document.querySelectorAll('.popover.open').forEach(p=> p.classList.remove('open'));
  document.querySelectorAll('.field.active').forEach(f=> f.classList.remove('active'));
}

// Config data
const AIRPORTS = [
  { value:'OTP', label:'OTP – Henri Coandă', hint:'București, Otopeni' },
  { value:'BBU', label:'BBU – Aurel Vlaicu', hint:'București, Băneasa' },
];

// Utilities
const RO_MONTHS = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];
const RO_DOW = ['Lu','Ma','Mi','Jo','Vi','Sa','Du']; // Monday-first
const pad = (n)=> String(n).padStart(2,'0');
const fmtISO = (d)=> `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fmtDisplayDate = (iso)=> { if(!iso) return ''; const [y,m,d]=iso.split('-'); return `${d}.${m}.${y}`; };
const cmpTime = (a,b)=> (a===b?0:(a<b?-1:1)); // HH:MM strings (zero-padded)

function makeCalendar(date, selectedISO, minISO){
  // returns HTML string for a calendar month grid
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay()+6)%7; // Monday-first; 0=Mon ... 6=Sun
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const todayISO = fmtISO(new Date());
  const minBound = minISO || todayISO; // block past days by default

  let html = '<header><button class=\"icon-btn\" data-cal=\"prev\" aria-label=\"Luna anterioară\">‹</button><div class=\"month\">'+RO_MONTHS[month]+' '+year+'</div><div class=\"nav\"><button class=\"icon-btn\" data-cal=\"today\" aria-label=\"Astăzi\">•</button><button class=\"icon-btn\" data-cal=\"next\" aria-label=\"Luna următoare\">›</button></div></header>';
  html += '<div class=\"cal-grid\">';
  // DOW
  for(const d of RO_DOW){ html += '<div class=\"cal-dow\">'+d+'</div>'; }
  // Leading blanks (previous month)
  for(let i=0;i<startOffset;i++){ html += '<div class=\"cal-day muted\"></div>'; }
  // Month days
  for(let day=1; day<=daysInMonth; day++){
    const iso = `${year}-${pad(month+1)}-${pad(day)}`;
    let cls = 'cal-day';
    if(iso < minBound) cls += ' disabled';
    if(iso===fmtISO(new Date())) cls += ' today';
    if(selectedISO && iso===selectedISO) cls += ' selected';
    html += `<div class=\"${cls}\" data-date=\"${iso}\">${day}</div>`;
  }
  // Trailing blanks to complete grid
  const totalCells = RO_DOW.length + startOffset + daysInMonth; // incl. header row
  const rem = (7 - (totalCells % 7)) % 7;
  for(let i=0;i<rem;i++){ html += '<div class=\"cal-day muted\"></div>'; }
  html += '</div>';
  return html;
}

function activateField(picker){ const f = picker.closest('.field'); if(f){ f.classList.add('active'); } }
function deactivateField(picker){ const f = picker.closest('.field'); if(f){ f.classList.remove('active'); } }

function initAirportPicker(picker){
  const hidden = picker.querySelector('input[type=\"hidden\"]');
  const display = picker.querySelector('.ap-input');
  const pop = picker.querySelector('.menu-pop');
  const menu = pop.querySelector('.menu');

  function build(){
    let html = '';
    for(const ap of AIRPORTS){
      const active = hidden.value===ap.value ? ' active' : '';
      html += `<div class=\"menu-item${active}\" data-val=\"${ap.value}\" data-label=\"${ap.label}\">
        <span class=\"code\">${ap.value}</span>
        <span class=\"name\">${ap.label}</span>
        <span class=\"hint\">${ap.hint||''}</span>
      </div>`;
    }
    menu.innerHTML = html;
  }
  function open(){ closeAllPopovers(); pop.classList.add('open'); build(); activateField(picker); document.addEventListener('click', onDoc, true); }
  function close(){ pop.classList.remove('open'); deactivateField(picker); document.removeEventListener('click', onDoc, true); }
  function onDoc(e){ if(!picker.contains(e.target)) close(); }

  display.addEventListener('click', (e)=>{ e.stopPropagation(); pop.classList.contains('open')? close(): open(); });
  menu.addEventListener('click', (e)=>{
    const item = e.target.closest('.menu-item'); if(!item) return;
    hidden.value = item.dataset.val;
    display.value = item.dataset.label;
    picker.closest('.field')?.classList.add('filled');
    close();
    document.dispatchEvent(new CustomEvent('picker:changed', {detail:{name:hidden.name, value:hidden.value, label:item.dataset.label}}));
  });
}

function initDatePicker(picker){
  const hidden = picker.querySelector('input[type=\"hidden\"]');
  const display = picker.querySelector('.dp-input');
  const pop = picker.querySelector('.calendar-pop');
  const cal = pop.querySelector('.calendar');
  let viewDate = hidden.value ? new Date(hidden.value) : new Date();

  function getMinISO(){
    const today = fmtISO(new Date());
    if(hidden.name === 'end_date'){
      const sd = document.querySelector('input[name=\"start_date\"]')?.value || '';
      if(sd && sd > today) return sd; // end_date min is start_date (or today)
    }
    return today;
  }

  function open(){ closeAllPopovers(); pop.classList.add('open'); render(); activateField(picker); document.addEventListener('click', onDoc, true); }
  function close(){ pop.classList.remove('open'); deactivateField(picker); document.removeEventListener('click', onDoc, true); }
  function onDoc(e){ if(!picker.contains(e.target)) close(); }
  function render(){
    const minISO = getMinISO();
    // keep view within min month for end_date
    if(hidden.name==='end_date' && minISO){
      const minD = new Date(minISO);
      const viewMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
      const minMonth = new Date(minD.getFullYear(), minD.getMonth(), 1);
      if(viewMonth < minMonth){ viewDate = new Date(minD.getFullYear(), minD.getMonth(), 1); }
    }
    cal.innerHTML = makeCalendar(viewDate, hidden.value, minISO);
  }

  display.addEventListener('click', (e)=>{ e.stopPropagation(); pop.classList.contains('open')? close(): open(); });
  cal.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-cal]');
    if(btn){
      const t = btn.getAttribute('data-cal');
      if(t==='prev') viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth()-1, 1);
      if(t==='next') viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth()+1, 1);
      if(t==='today') viewDate = new Date();
      render(); return;
    }
    const day = e.target.closest('.cal-day');
    if(day && day.dataset.date){
      if(day.classList.contains('disabled')) return; // blocked date
      hidden.value = day.dataset.date;
      display.value = fmtDisplayDate(hidden.value);
      picker.closest('.field')?.classList.add('filled');
      close();
      document.dispatchEvent(new CustomEvent('picker:changed', {detail:{name:hidden.name, value:hidden.value}}));
    }
  });

  // expose render for external redraws
  picker._renderCal = render;
}

function initTimePicker(picker){
  const hidden = picker.querySelector('input[type=\"hidden\"]');
  const display = picker.querySelector('.tp-input');
  const pop = picker.querySelector('.time-pop');
  const list = pop.querySelector('.time-list');

  function build(){
    const form = document.getElementById('searchForm');
    const isEnd = hidden.name==='end_time';
    let minTime = null;
    if(isEnd){
      const sd = form.start_date?.value || '';
      const ed = form.end_date?.value || '';
      const st = form.start_time?.value || '';
      if(sd && ed && sd===ed && st){ minTime = st; }
    }
    let html = '';
    for(let i=0;i<48;i++){
      const h = pad(Math.floor(i/2));
      const m = i%2===0 ? '00' : '30';
      const t = `${h}:${m}`;
      const isDisabled = (minTime && cmpTime(t, minTime) < 0);
      const active = hidden.value===t ? ' active' : '';
      const disabledCls = isDisabled ? ' disabled' : '';
      html += `<div class=\"time-opt${active}${disabledCls}\" data-time=\"${t}\" aria-disabled=\"${isDisabled}\">${t}</div>`;
    }
    list.innerHTML = html;
  }
  function open(){ closeAllPopovers(); pop.classList.add('open'); build(); activateField(picker); document.addEventListener('click', onDoc, true); }
  function close(){ pop.classList.remove('open'); deactivateField(picker); document.removeEventListener('click', onDoc, true); }
  function onDoc(e){ if(!picker.contains(e.target)) close(); }

  display.addEventListener('click', (e)=>{ e.stopPropagation(); pop.classList.contains('open')? close(): open(); });
  list.addEventListener('click', (e)=>{
    const opt = e.target.closest('.time-opt');
    if(!opt || opt.classList.contains('disabled')) return;
    hidden.value = opt.dataset.time;
    display.value = opt.dataset.time;
    picker.closest('.field')?.classList.add('filled');
    close();
    document.dispatchEvent(new CustomEvent('picker:changed', {detail:{name:hidden.name, value:hidden.value}}));
  });
}

function initFAQ(){
  document.querySelectorAll('.faq-item .faq-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const item = btn.closest('.faq-item');
      const expanded = item.getAttribute('aria-expanded')==='true';
      // accordion: close others
      document.querySelectorAll('.faq-item[aria-expanded=\"true\"]').forEach(i=> i.setAttribute('aria-expanded','false'));
      item.setAttribute('aria-expanded', expanded?'false':'true');
    });
  });
}

// Language toggle (RO/EN) + header shadow on scroll + form logic
function setLang(l){ localStorage.setItem('lang', l); if(l==='en'){ location.href='/en'; } else { location.href='/'; } }
function toggleLang(){ const l = localStorage.getItem('lang')==='en'?'ro':'en'; setLang(l); }

document.addEventListener('DOMContentLoaded', () => {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  // Ensure page starts at top on fresh load (esp. mobile reload) when no hash
  if (!location.hash) {
    const resetToTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    resetToTop();
    setTimeout(resetToTop, 140);
  }

  const topbar = document.getElementById('topbar');
  if(topbar){
    const onScroll = ()=>{ if(window.scrollY>4) topbar.classList.add('shadow'); else topbar.classList.remove('shadow'); };
    onScroll(); window.addEventListener('scroll', onScroll, {passive:true});
  }

  const langBtn = document.getElementById('langBtn');
  const langBtn2 = document.getElementById('langBtn2');
  if(langBtn) langBtn.addEventListener('click', toggleLang);
  if(langBtn2) langBtn2.addEventListener('click', toggleLang);

  // Initialize custom pickers
  document.querySelectorAll('.picker[data-type=\"airport\"]').forEach(initAirportPicker);
  document.querySelectorAll('.picker[data-type=\"date\"]').forEach(initDatePicker);
  document.querySelectorAll('.picker[data-type=\"time\"]').forEach(initTimePicker);
  initFAQ();


  // Mobile nav
  const mToggle = document.getElementById('mobileToggle');
  const mNav = document.getElementById('mobileNav');
  if(mToggle && mNav){
    mToggle.addEventListener('click', ()=>{
      const isHidden = mNav.hasAttribute('hidden');
      if(isHidden){ mNav.removeAttribute('hidden'); mNav.classList.add('open'); mToggle.classList.add('open'); }
      else { mNav.classList.remove('open'); mNav.setAttribute('hidden',''); mToggle.classList.remove('open'); }
    });
    // Close on link click
    mNav.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> { mNav.classList.remove('open'); mNav.setAttribute('hidden',''); mToggle.classList.remove('open'); }));
  }


  const form = document.getElementById('searchForm');
  const live = document.getElementById('liveSummary');

  function renderSummary(){
    if(!live || !form) return;
    const arr = form.arr_airport?.value || '';
    const dep = form.dep_airport?.value || '';
    const arrLabel = document.querySelector('.picker[data-target=\"arr_airport\"] .ap-input')?.value || arr || '—';
    const depLabel = document.querySelector('.picker[data-target=\"dep_airport\"] .ap-input')?.value || dep || '—';
    const sd = form.start_date?.value || '';
    const st = form.start_time?.value || '';
    const ed = form.end_date?.value || '';
    const et = form.end_time?.value || '';
    const hasAny = arr || dep || (sd&&st) || (ed&&et);
    live.innerHTML = hasAny ? `
      <span class=\"chip\"><strong>Aeroporturi</strong> ${arrLabel} → ${depLabel}</span>
      <span class=\"chip\"><strong>Preluare</strong> ${sd?fmtDisplayDate(sd):'—'} ${st||''}</span>
      <span class=\"chip\"><strong>Returnare</strong> ${ed?fmtDisplayDate(ed):'—'} ${et||''}</span>
    ` : '';
    live.classList.toggle('hidden', !hasAny);
  }

  // React to picker changes
  document.addEventListener('picker:changed', (e)=>{
    renderSummary();
    // Enforce end_date >= start_date
    if(e.detail?.name==='start_date'){
      const sd = e.detail.value;
      const endHidden = document.querySelector('input[name=\"end_date\"]');
      const endDisplay = document.querySelector('.picker[data-target=\"end_date\"] .dp-input');
      const endField = document.querySelector('.picker[data-target=\"end_date\"]').closest('.field');
      if(endHidden && endHidden.value && endHidden.value < sd){
        endHidden.value=''; if(endDisplay) endDisplay.value=''; if(endField) endField.classList.remove('filled');
      }
      const endPicker = document.querySelector('.picker[data-target=\"end_date\"]');
      if(endPicker && endPicker._renderCal) endPicker._renderCal();
    }
    // Enforce end_time >= start_time when same day
    if(e.detail?.name==='start_time' || e.detail?.name==='end_date'){
      const sd = form.start_date?.value || '';
      const ed = form.end_date?.value || '';
      const st = form.start_time?.value || '';
      const et = form.end_time?.value || '';
      if(sd && ed && sd===ed && st){
        // if currently chosen end_time is earlier than start_time, reset it
        if(et && cmpTime(et, st) < 0){
          const eHidden = form.end_time; const eDisplay = document.querySelector('.picker[data-target=\"end_time\"] .tp-input'); const eField = document.querySelector('.picker[data-target=\"end_time\"]').closest('.field');
          eHidden.value=''; if(eDisplay) eDisplay.value=''; if(eField) eField.classList.remove('filled');
        }
      }
    }
  });

  // Initialize filled state on load for all pickers
  document.querySelectorAll('.picker').forEach(p=>{
    const h = p.querySelector('input[type=\"hidden\"]');
    if(h && h.value){ p.closest('.field')?.classList.add('filled'); }
  });

  renderSummary();

  const formEl = document.getElementById('searchForm');
  formEl.addEventListener('submit', (e)=>{
    const sd = formEl.start_date?.value || '';
    const st = formEl.start_time?.value || '';
    const ed = formEl.end_date?.value || '';
    const et = formEl.end_time?.value || '';
    // Final guard: if same day and end time earlier than start time, prevent submit
    if(sd && ed && sd===ed && st && et && cmpTime(et, st) < 0){
      e.preventDefault();
      alert('Ora de returnare trebuie să fie după ora de preluare pentru aceeași zi.');
      return;
    }
    const start = (sd && st) ? `${sd}T${st}` : '';
    const end   = (ed && et) ? `${ed}T${et}` : '';
    const sHidden = formEl.querySelector('#startValue');
    const eHidden = formEl.querySelector('#endValue');
    if(sHidden) sHidden.value = start;
    if(eHidden) eHidden.value = end;
  });

  
  // Hero CTA -> focus form card with glow & adjusted scroll
  const startBtn = document.getElementById('startBookingBtn');
  const formCard = document.querySelector('.hero-form-card');
  if(startBtn && formCard){
    startBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      const rect = formCard.getBoundingClientRect();
      const offset = 110;
      const targetY = rect.top + window.scrollY - offset;
      window.scrollTo({ top: targetY < 0 ? 0 : targetY, behavior: 'smooth' });

      // trigger highlight glow
      formCard.classList.add('hero-form-highlight');
      setTimeout(()=>{
        formCard.classList.remove('hero-form-highlight');
      }, 900);
    });
  }

const y = document.getElementById('y');
  if(y) y.textContent = new Date().getFullYear();
});
