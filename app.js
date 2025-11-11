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
const fmtDisplayDateSlash = (iso)=> { if(!iso) return ''; const [y,m,d]=iso.split('-'); return `${d}/${m}/${y}`; };
const cmpTime = (a,b)=> (a===b?0:(a<b?-1:1)); // HH:MM strings (zero-padded)

function makeCalendar(date, selectedISO, boundISO, mode){
  // returns HTML string for a calendar month grid
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay()+6)%7; // Monday-first; 0=Mon ... 6=Sun
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const today = new Date();
  const todayISO = fmtISO(today);
  let minBound = null;
  let maxBound = null;
  if(mode === 'maxPast'){
    // Pentru data nașterii: interval permis între 22 și 65 de ani
    const maxAgeYears = 65;
    const minDate = new Date(today.getFullYear() - maxAgeYears, today.getMonth(), today.getDate());
    minBound = fmtISO(minDate);           // prea vechi => prea bătrân (>65)
    maxBound = boundISO || todayISO;      // prea nou => prea tânăr (<22)
  }else{
    minBound = boundISO || todayISO; // block past days by default
  }
  const monthLabel = (mode === 'maxPast') ? RO_MONTHS[month] : RO_MONTHS[month]+' '+year;
  
  
  let html = '';
  if(mode === 'maxPast'){
    const currentYear = today.getFullYear();
    const minYear = currentYear - 65;
    const maxYear = currentYear - 22;
    html += '<header><div class="month">';
    html += '<button type="button" class="cal-dd cal-dd-month" data-dd="month"><span class="cal-dd-label">'+RO_MONTHS[month]+'</span><span class="cal-dd-arrow">▾</span></button>';
    html += '<div class="cal-dd-menu cal-dd-menu-month">';
    for(let m=0; m<12; m++){
      html += '<button type="button" class="cal-dd-item" data-month="'+m+'">'+RO_MONTHS[m]+'</button>';
    }
    html += '</div></div><div class="nav">';
    html += '<button type="button" class="cal-dd cal-dd-year" data-dd="year"><span class="cal-dd-label">'+year+'</span><span class="cal-dd-arrow">▾</span></button>';
    html += '<div class="cal-dd-menu cal-dd-menu-year">';
    for(let y = maxYear; y >= minYear; y--){
      html += '<button type="button" class="cal-dd-item" data-year="'+y+'">'+y+'</button>';
    }
    html += '</div></div></header>';
  }else{
    const monthLabel = RO_MONTHS[month]+' '+year;
    html += '<header><div class="month">'+monthLabel+'</div><div class="nav">';
    html += '<button class="icon-btn" data-cal="prev" aria-label="Luna anterioară">‹</button>';
    html += '<button class="icon-btn" data-cal="today" aria-label="Astăzi">•</button>';
    html += '<button class="icon-btn" data-cal="next" aria-label="Luna următoare">›</button>';
    html += '</div></header>';
  }

html += '<div class=\"cal-grid\">';
  // DOW
  for(const d of RO_DOW){ html += '<div class=\"cal-dow\">'+d+'</div>'; }
  // Leading blanks (previous month)
  for(let i=0;i<startOffset;i++){ html += '<div class=\"cal-day muted\"></div>'; }
  // Month days
  for(let day=1; day<=daysInMonth; day++){
    const iso = `${year}-${pad(month+1)}-${pad(day)}`;
    let cls = 'cal-day';
    if(minBound && iso < minBound) cls += ' disabled';
    if(maxBound && iso > maxBound) cls += ' disabled';
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
      const sd = document.querySelector('input[name="start_date"]')?.value || '';
      if(sd){
        const base = new Date(sd + 'T00:00:00');
        base.setDate(base.getDate() + 1);
        const minFromStart = fmtISO(base);
        return (minFromStart > today ? minFromStart : today);
      }
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



function initDobPicker(picker){
  const hidden = picker.querySelector('input[type="hidden"]');
  const display = picker.querySelector('.dp-input');
  const pop = picker.querySelector('.calendar-pop');
  const cal = pop.querySelector('.calendar');

  const today = new Date();
  const minAgeYears = 22;
  const maxDate = new Date(today.getFullYear() - minAgeYears, today.getMonth(), today.getDate());
  const maxISO = fmtISO(maxDate);
  let viewDate = hidden.value ? new Date(hidden.value) : maxDate;

  function open(){
    closeAllPopovers();
    pop.classList.add('open');
    activateField(picker);
  }
  function close(){
    pop.classList.remove('open');
    deactivateField(picker);
  }

  function render(){
    cal.innerHTML = makeCalendar(viewDate, hidden.value, maxISO, 'maxPast');

    const monthBtn = cal.querySelector('.cal-dd-month');
    const yearBtn = cal.querySelector('.cal-dd-year');
    const monthMenu = cal.querySelector('.cal-dd-menu-month');
    const yearMenu = cal.querySelector('.cal-dd-menu-year');

    const closeMenus = ()=>{
      if(monthMenu) monthMenu.classList.remove('open');
      if(yearMenu) yearMenu.classList.remove('open');
      if(monthBtn) monthBtn.classList.remove('open');
      if(yearBtn) yearBtn.classList.remove('open');
    };

    if(monthBtn && monthMenu){
      monthBtn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const willOpen = !monthMenu.classList.contains('open');
        closeMenus();
        if(willOpen){
          monthMenu.classList.add('open');
          monthBtn.classList.add('open');
        }
      });

      monthMenu.addEventListener('click', (e)=>{
        const item = e.target.closest('.cal-dd-item[data-month]');
        if(!item) return;
        const m = parseInt(item.getAttribute('data-month'), 10);
        if(isNaN(m)) return;
        viewDate = new Date(viewDate.getFullYear(), m, 1);
        closeMenus();
        render();
      });
    }

    if(yearBtn && yearMenu){
      yearBtn.addEventListener('click', (e)=>{
        e.stopPropagation();
        const willOpen = !yearMenu.classList.contains('open');
        closeMenus();
        if(willOpen){
          yearMenu.classList.add('open');
          yearBtn.classList.add('open');
        }
      });

      yearMenu.addEventListener('click', (e)=>{
        const item = e.target.closest('.cal-dd-item[data-year]');
        if(!item) return;
        const y = parseInt(item.getAttribute('data-year'), 10);
        if(isNaN(y)) return;
        viewDate = new Date(y, viewDate.getMonth(), 1);
        closeMenus();
        render();
      });
    }
  }

  display.addEventListener('click', (e)=>{
    e.stopPropagation();
    if(pop.classList.contains('open')){
      close();
    }else{
      open();
      render();
    }
  });

  cal.addEventListener('click', (e)=>{
    const day = e.target.closest('.cal-day');
    if(day && day.dataset.date){
      if(day.classList.contains('disabled')) return;
      hidden.value = day.dataset.date;
      if(typeof fmtDisplayDateSlash === 'function'){
        display.value = fmtDisplayDateSlash(hidden.value);
      }else{
        display.value = hidden.value;
      }
      picker.closest('.field')?.classList.add('filled');
      close();
    }
  });

  // First render so controls are ready when popover is opened
  render();
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

    if(isEnd && form){
      const sd = form.start_date?.value || '';
      const ed = form.end_date?.value || '';
      const st = form.start_time?.value || '';

      if(sd && ed && st){
        const startDateTime = new Date(`${sd}T${st}:00`);
        const minReturn = new Date(startDateTime.getTime() + 24*60*60*1000);
        const minReturnDateISO = fmtISO(minReturn);

        if(ed === minReturnDateISO){
          const mh = pad(minReturn.getHours());
          const mm = minReturn.getMinutes() >= 30 ? '30' : '00';
          minTime = `${mh}:${mm}`;
        }
      }
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
  document.querySelectorAll('.picker[data-type="airport"]').forEach(initAirportPicker);
  document.querySelectorAll('.picker[data-type="date"]').forEach(initDatePicker);
  document.querySelectorAll('.picker[data-type="dob"]').forEach(initDobPicker);
  document.querySelectorAll('.picker[data-type="time"]').forEach(initTimePicker);
  initFAQ();

  // Footer account button: reflectează starea contului
  const footerAccountBtn = document.getElementById('footerAccountBtn');
  if(footerAccountBtn){
    const isAccountPage = window.location.pathname && window.location.pathname.indexOf('contul-meu') !== -1;
    if(isAccountPage){
      footerAccountBtn.classList.add('footer-account-btn--active');
      footerAccountBtn.textContent = 'Contul meu (conectat)';
      footerAccountBtn.setAttribute('href','/contul-meu.html');
    }else{
      footerAccountBtn.classList.remove('footer-account-btn--active');
      footerAccountBtn.textContent = 'Contul meu';
      footerAccountBtn.setAttribute('href','/login.html');
    }
  }

  // Account page: comportamente pentru istoricul rezervărilor, rezervarea activă și detaliile personale
  if(window.location.pathname && window.location.pathname.indexOf('contul-meu') !== -1){
    // Istoric rezervări: expand/collapse detalii
    const detailButtons = document.querySelectorAll('.account-details-toggle');
    detailButtons.forEach((btn)=>{
      btn.addEventListener('click', ()=>{
        const table = btn.closest('.account-table');
        if(!table) return;
        const panel = table.querySelector('.account-details-panel');
        if(!panel) return;
        const isOpen = panel.classList.toggle('account-details-panel--open');
        btn.textContent = isOpen ? 'Ascunde detalii' : 'Vezi detalii';
      });
    });

    // Rezervarea activă: acțiuni principale (modificare, prelungire, anulare)
    const modifyBtn = document.getElementById('accountModifyReservationBtn');
    const extendBtn = document.getElementById('accountExtendReservationBtn');
    const cancelBtn = document.getElementById('accountCancelReservationBtn');

    const goToIndexForChange = (action)=>{
      try{
        if(window.sessionStorage){
          sessionStorage.setItem('gvTriggerSearchFocus','1');
          if(action){
            sessionStorage.setItem('gvReservationAction', action);
          }
        }
      }catch(_e){}
      window.location.href = '/index.html';
    };

    const canCancelReservation = ()=>{
      // TODO: în versiunea completă, aici se va verifica data/ora reală de preluare
      // și se va permite anularea doar dacă mai sunt >24h până la preluare.
      // Momentan, în prototip, permitem doar un mesaj informativ.
      return false;
    };

    if(modifyBtn){
      modifyBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        goToIndexForChange('modify');
      });
    }

    if(extendBtn){
      extendBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        goToIndexForChange('extend');
      });
    }

    if(cancelBtn){
      cancelBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        if(!canCancelReservation()){
          window.alert('Anularea rezervării este permisă doar dacă se face cu cel puțin 24 de ore înainte de ora de preluare a mașinii. În această versiune demo nu avem încă o rezervare activă reală pentru a verifica această regulă.');
          return;
        }
        // În versiunea completă, aici se va trimite cererea de anulare către sistem / partener.
        window.alert('Cererea ta de anulare a rezervării a fost înregistrată. În varianta finală a aplicației, aici vor apărea detaliile privind rambursarea și confirmarea anulării.');
      });
    }


// Detalii personale: Editează datele -> mod edit in-card, cu salvare locală
    const detailsSection = document.getElementById('accountDetailsSection');
    if(detailsSection){
      const contactCard = detailsSection.querySelector('.account-card');
      if(contactCard){
        const editBtn = contactCard.querySelector('.btn-ghost');
        const detailsList = contactCard.querySelector('.account-details');
        if(editBtn && detailsList){
          const rows = Array.from(detailsList.querySelectorAll('.account-details-row'));
          const fields = rows.map((row)=>{
            const labelEl = row.querySelector('dt');
            const valueEl = row.querySelector('dd');
            return {
              row,
              label: labelEl ? labelEl.textContent.trim() : '',
              valueEl,
              value: valueEl ? valueEl.textContent.trim() : ''
            };
          });

          // Aplică valori din localStorage, dacă există
          try{
            if(window.localStorage){
              const saved = localStorage.getItem('gvAccountContact');
              if(saved){
                const parsed = JSON.parse(saved);
                fields.forEach((f)=>{
                  if(!f.valueEl || !f.label) return;
                  const key = f.label;
                  if(Object.prototype.hasOwnProperty.call(parsed, key)){
                    const val = parsed[key] || '—';
                    f.value = val;
                    f.valueEl.textContent = val;
                  }
                });
              }
            }
          }catch(_e){}

          const buildInputForLabel = (label, value)=>{
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'account-input';
            input.value = value && value !== '—' ? value : '';
            input.placeholder = label;
            if(label === 'Adresă email') input.type = 'email';
            if(label === 'Telefon') input.type = 'tel';
            return input;
          };

          let isEditing = false;

          const enterEditMode = ()=>{
            if(isEditing) return;
            isEditing = true;
            contactCard.classList.add('account-card--editing');
            editBtn.textContent = 'Salvează datele';

            let cancelBtn = contactCard.querySelector('.account-cancel-edit');
            if(!cancelBtn){
              cancelBtn = document.createElement('button');
              cancelBtn.type = 'button';
              cancelBtn.className = 'btn-text account-cancel-edit';
              cancelBtn.textContent = 'Renunță';
              const header = contactCard.querySelector('.account-card-header');
              if(header){
                header.appendChild(cancelBtn);
              }
              cancelBtn.addEventListener('click', (e)=>{
                e.preventDefault();
                // Revine la valorile dinainte de editare
                fields.forEach((f)=>{
                  if(!f.valueEl) return;
                  f.valueEl.textContent = f.value || '—';
                  if(f.input){
                    f.input = null;
                  }
                });
                contactCard.classList.remove('account-card--editing');
                editBtn.textContent = 'Editează datele';
                cancelBtn.remove();
                isEditing = false;
              });
            }

            // Transformăm dd-urile în inputuri
            fields.forEach((f)=>{
              if(!f.valueEl) return;
              const currentVal = f.valueEl.textContent.trim();
              const input = buildInputForLabel(f.label, currentVal);
              f.valueEl.textContent = '';
              f.valueEl.appendChild(input);
              f.input = input;
            });
          };

          const exitEditModeAndSave = ()=>{
            if(!isEditing) return;
            isEditing = false;
            contactCard.classList.remove('account-card--editing');
            const payload = {};
            fields.forEach((f)=>{
              if(!f.valueEl) return;
              const newVal = (f.input && f.input.value ? f.input.value.trim() : '') || '—';
              f.value = newVal;
              f.valueEl.textContent = newVal;
              payload[f.label] = newVal;
              f.input = null;
            });
            // Persistă în localStorage pentru sesiuni viitoare
            try{
              if(window.localStorage){
                localStorage.setItem('gvAccountContact', JSON.stringify(payload));
              }
            }catch(_e){}
            editBtn.textContent = 'Editează datele';
            const cancelBtn = contactCard.querySelector('.account-cancel-edit');
            if(cancelBtn) cancelBtn.remove();
          };

          editBtn.addEventListener('click', (e)=>{
            e.preventDefault();
            if(!isEditing){
              enterEditMode();
            }else{
              exitEditModeAndSave();
            }
          });
        }
      }
    }
  }



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
      const endHidden = document.querySelector('input[name="end_date"]');
      const endDisplay = document.querySelector('.picker[data-target="end_date"] .dp-input');
      const endField = document.querySelector('.picker[data-target="end_date"]').closest('.field');
      if(endHidden && endHidden.value && endHidden.value < sd){
        endHidden.value='';
        if(endDisplay) endDisplay.value='';
        if(endField) endField.classList.remove('filled');
      }
      const endPicker = document.querySelector('.picker[data-target="end_date"]');
      if(endPicker && endPicker._renderCal) endPicker._renderCal();
    }

    // Enforce minim 24h între preluare și returnare (fără mesaje, ajustăm automat selecția)
    if(e.detail?.name==='start_date' || e.detail?.name==='start_time' || e.detail?.name==='end_date' || e.detail?.name==='end_time'){
      const form = document.getElementById('searchForm');
      if(!form) return;
      const sd = form.start_date?.value || '';
      const ed = form.end_date?.value || '';
      const st = form.start_time?.value || '';
      const et = form.end_time?.value || '';

      if(sd && ed && st && et){
        const startDateTime = new Date(`${sd}T${st}:00`);
        const minReturn = new Date(startDateTime.getTime() + 24*60*60*1000);
        const endDateTime   = new Date(`${ed}T${et}:00`);

        if(endDateTime < minReturn){
          const minDateISO = fmtISO(minReturn);
          const mh = pad(minReturn.getHours());
          const mm = minReturn.getMinutes() >= 30 ? '30' : '00';
          const minTime = `${mh}:${mm}`;

          // Actualizează data de returnare
          const endPickerEl = document.querySelector('.picker[data-target="end_date"]');
          const endHidden = form.end_date;
          const endDisplay = endPickerEl ? endPickerEl.querySelector('.dp-input') : null;
          const endField = endPickerEl ? endPickerEl.closest('.field') : null;
          if(endHidden){
            endHidden.value = minDateISO;
            if(endDisplay) endDisplay.value = fmtDisplayDateSlash(minDateISO);
            if(endField) endField.classList.add('filled');
          }

          // Actualizează ora de returnare
          const endTimePickerEl = document.querySelector('.picker[data-target="end_time"]');
          const eHiddenTime = form.end_time;
          const eDisplayTime = endTimePickerEl ? endTimePickerEl.querySelector('.tp-input') : null;
          const eFieldTime = endTimePickerEl ? endTimePickerEl.closest('.field') : null;
          if(eHiddenTime){
            eHiddenTime.value = minTime;
            if(eDisplayTime) eDisplayTime.value = minTime;
            if(eFieldTime) eFieldTime.classList.add('filled');
          }
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
  if(formEl) formEl.addEventListener('submit', (e)=>{
    const sd = formEl.start_date?.value || '';
    const st = formEl.start_time?.value || '';
    const ed = formEl.end_date?.value || '';
    const et = formEl.end_time?.value || '';

    // Asigură-te că a fost aleasă o perioadă completă (data și ora pentru preluare și returnare)
    if(!sd || !st || !ed || !et){
      e.preventDefault();
      alert('Te rugăm să selectezi data și ora de preluare și de returnare.');
      return;
    }

    // Final guard: pentru aceeași zi, ora de returnare trebuie să fie după ora de preluare
    if(sd === ed && cmpTime(et, st) < 0){
      e.preventDefault();
      alert('Ora de returnare trebuie să fie după ora de preluare pentru aceeași zi.');
      return;
    }

    const start = `${sd}T${st}`;
    const end   = `${ed}T${et}`;
    const sHidden = formEl.querySelector('#startValue');
    const eHidden = formEl.querySelector('#endValue');
    if(sHidden) sHidden.value = start;
    if(eHidden) eHidden.value = end;

    // Build URL for results page including selected values
    const params = new URLSearchParams();
    const arrHidden = formEl.querySelector('input[name="arr_airport"]');
    const depHidden = formEl.querySelector('input[name="dep_airport"]');
    const arrDisplay = document.querySelector('.picker[data-target="arr_airport"] .ap-input');
    const depDisplay = document.querySelector('.picker[data-target="dep_airport"] .ap-input');

    if(arrHidden && arrHidden.value) params.set('arr', arrHidden.value);
    if(depHidden && depHidden.value) params.set('dep', depHidden.value);
    if(arrDisplay && arrDisplay.value) params.set('arrLabel', arrDisplay.value);
    if(depDisplay && depDisplay.value) params.set('depLabel', depDisplay.value);
    if(sd) params.set('sd', sd);
    if(st) params.set('st', st);
    if(ed) params.set('ed', ed);
    if(et) params.set('et', et);
    if(start) params.set('start', start);
    if(end) params.set('end', end);

    const qs = params.toString();
    const url = './rezultate.html' + (qs ? `?${qs}` : '');
    e.preventDefault();
    window.location.href = url;
  });

  
  // Buton principal "Caută mașini disponibile" – activ doar când formularul este complet
  const searchSubmitBtn = document.getElementById('searchSubmitBtn');
  if(searchSubmitBtn && formEl){
    const updateSearchSubmitState = ()=>{
      const arr = formEl.arr_airport?.value || '';
      const dep = formEl.dep_airport?.value || '';
      const sd  = formEl.start_date?.value || '';
      const st  = formEl.start_time?.value || '';
      const ed  = formEl.end_date?.value || '';
      const et  = formEl.end_time?.value || '';
      const isComplete = !!(arr && dep && sd && st && ed && et);

      if(isComplete){
        searchSubmitBtn.disabled = false;
        searchSubmitBtn.classList.remove('btn-primary--disabled');
        searchSubmitBtn.setAttribute('aria-disabled','false');
      }else{
        searchSubmitBtn.disabled = true;
        searchSubmitBtn.classList.add('btn-primary--disabled');
        searchSubmitBtn.setAttribute('aria-disabled','true');
      }
    };

    updateSearchSubmitState();

    // Recalculează starea butonului când se schimbă datele sau input-ul formularului
    formEl.addEventListener('input', updateSearchSubmitState);
    document.addEventListener('picker:changed', updateSearchSubmitState);
  }




  // Header "Caută mașini disponibile" de pe alte pagini + CTA "Caută o mașină" din cont -> pregătesc focus pe formularul din index (toate device-urile)
  (()=>{
    const path = window.location.pathname || '';
    const isIndex = path.endsWith('/index.html') || path === '/' || path === '';
    if(isIndex) return;

    const headerLinks = Array.from(document.querySelectorAll('a[aria-label="Caută mașini disponibile"][href="/index.html"]'));
    const accountSearchBtn = document.getElementById('accountSearchBtn');

    const triggers = headerLinks.slice();
    if(accountSearchBtn) triggers.push(accountSearchBtn);

    if(!triggers.length) return;

    triggers.forEach((link)=>{
      link.addEventListener('click', (e)=>{
        try{
          if(window.sessionStorage){
            sessionStorage.setItem('gvTriggerSearchFocus','1');
          }
        }catch(_e){}
        e.preventDefault();
        window.location.href = '/index.html';
      });
    });
  })();
// Hero CTA + header CTA -> evidențiază formularul; scroll lin doar pe desktop/web (până sus de tot)
  const startBtn = document.getElementById('startBookingBtn');
  const headerSearchBtn = document.getElementById('headerSearchBtn');
  const formCard = document.querySelector('.hero-form-card');

  const runSearchHighlight = (opts = {})=>{
    if(!formCard) return false;

    const isDesktop = window.innerWidth > 768;
    let targetTop = 0;

    if(isDesktop){
      targetTop = 0;
    }else{
      const rect = formCard.getBoundingClientRect();
      const offset = 96; // compensăm topbar-ul pe mobil
      targetTop = rect.top + window.scrollY - offset;
      if(targetTop < 0) targetTop = 0;
    }

    const behavior = opts.instant ? 'auto' : 'smooth';

    window.scrollTo({ top: targetTop, behavior });
    formCard.classList.add('hero-form-highlight');
    setTimeout(()=>{
      formCard.classList.remove('hero-form-highlight');
    }, 1700);
    return true;
  };

  const triggerSearchFocus = (e)=>{
    const ran = runSearchHighlight();
    if(ran && e && typeof e.preventDefault === 'function'){
      e.preventDefault();
    }
  };

  if(formCard){
    if(startBtn){
      startBtn.addEventListener('click', triggerSearchFocus);
    }
    if(headerSearchBtn){
      headerSearchBtn.addEventListener('click', triggerSearchFocus);
    }

    // Dacă am venit din alte pagini și avem un flag în sessionStorage, rulăm același efect o singură dată
    try{
      if(window.sessionStorage && sessionStorage.getItem('gvTriggerSearchFocus') === '1'){
        sessionStorage.removeItem('gvTriggerSearchFocus');
        runSearchHighlight({ instant: true });
      }
    }catch(_e){}
  }


  // Results page: hydrate summary/topbar from query params
  if(window.location.pathname && window.location.pathname.indexOf('rezultate') !== -1){
    const params = new URLSearchParams(window.location.search || '');
    const arrLabel = params.get('arrLabel') || params.get('arr') || '';
    const depLabel = params.get('depLabel') || params.get('dep') || '';
    const sd = params.get('sd') || '';
    const st = params.get('st') || '';
    const ed = params.get('ed') || '';
    const et = params.get('et') || '';

    let rentalDays = 1;
    let rentalHours = 24;

    if(sd && st && ed && et){
      const startDateTime = new Date(`${sd}T${st}:00`);
      const endDateTime   = new Date(`${ed}T${et}:00`);
      const diffMs = endDateTime - startDateTime;
      const rawHours = diffMs / 36e5;

      if(!isNaN(rawHours) && rawHours > 0){
        const minHours = 24;
        const effectiveHours = rawHours < minHours ? minHours : rawHours;
        rentalHours = effectiveHours;

        const fullDays = Math.floor(effectiveHours / 24);
        if(fullDays <= 0){
          rentalDays = 1;
        }else{
          const remainder = effectiveHours - fullDays * 24;
          rentalDays = fullDays + (remainder > 2 ? 1 : 0);
        }
      }
    }


    const fmtDate = (iso)=>{
      if(!iso) return '';
      const parts = iso.split('-');
      if(parts.length!==3) return iso;
      const [y,m,d] = parts;
      return `${d}.${m}.${y}`;
    };

    const routeText = (arrLabel || '—') + (depLabel ? ` → ${depLabel}` : '');
    const pickupText = (sd ? fmtDate(sd) : '—') + (st ? ` • ${st}` : '');
    const returnText = (ed ? fmtDate(ed) : '—') + (et ? ` • ${et}` : '');

    const barRoute = document.getElementById('barRoute');
    const barPickup = document.getElementById('barPickup');
    const barReturn = document.getElementById('barReturn');

    if(barRoute && routeText.trim()) barRoute.textContent = routeText;
    if(barPickup && pickupText.trim()) barPickup.textContent = pickupText;
    if(barReturn && returnText.trim()) barReturn.textContent = returnText;

    const resRoute = document.getElementById('resRoute');
    const resPickup = document.getElementById('resPickup');
    const resReturn = document.getElementById('resReturn');
    const resArr = document.getElementById('resArr');
    const resDep = document.getElementById('resDep');
    const resPickupDetail = document.getElementById('resPickupDetail');
    const resReturnDetail = document.getElementById('resReturnDetail');

    if(resRoute && routeText.trim()) resRoute.textContent = routeText;
    if(resPickup && pickupText.trim()) resPickup.textContent = pickupText;
    if(resReturn && returnText.trim()) resReturn.textContent = returnText;

    if(resArr && (arrLabel || params.get('arr'))){
      resArr.textContent = arrLabel || params.get('arr');
    }
    if(resDep && (depLabel || params.get('dep'))){
      resDep.textContent = depLabel || params.get('dep');
    }
    if(resPickupDetail && pickupText.trim()) resPickupDetail.textContent = pickupText;
    if(resReturnDetail && returnText.trim()) resReturnDetail.textContent = returnText;

    // Wire "Alege mașina" buttons to booking page with car & search details
    document.querySelectorAll('.car-card').forEach((card)=>{
      const btn = card.querySelector('.car-cta-main');
      const dayPriceRaw = card.getAttribute('data-price') || '';
      const dayPrice = parseFloat(String(dayPriceRaw).replace(',', '.')) || 0;

      const mainPriceEl = card.querySelector('.car-price-main');
      const noteEl = card.querySelector('.car-price-note');

      let total = null;
      if(dayPrice && rentalDays){
        total = Math.round(dayPrice * rentalDays);
      }

      // Preț final (pentru perioada selectată) – afișat mare pe card
      if(mainPriceEl && total !== null){
        mainPriceEl.textContent = `€${total}`;
        const tag = document.createElement('span');
        tag.textContent = 'Preț final';
        mainPriceEl.appendChild(tag);
      }

      // Preț pe zi afișat discret sub formă de notă
      if(noteEl && dayPrice){
        noteEl.textContent = `€${dayPrice.toFixed(0)}/zi`;
        if(total !== null){
          noteEl.setAttribute('data-total', String(total));
        }
      }

      if(!btn) return;
      btn.addEventListener('click', ()=>{
        const nameEl = card.querySelector('.car-name');
        const altEl = card.querySelector('.car-name-alt');
        const segment = card.getAttribute('data-segment') || '';
        const gear = card.getAttribute('data-transmission') || '';
        const carName = nameEl ? nameEl.textContent.trim() : '';
        const carAlt = altEl ? altEl.textContent.trim() : '';

        const totalEl = card.querySelector('.car-price-note');
        let priceToSend = dayPriceRaw;
        if(totalEl){
          const fromData = totalEl.getAttribute('data-total');
          if(fromData){ priceToSend = fromData; }
        }

        const nextParams = new URLSearchParams(params.toString());
        if(carName) nextParams.set('carName', carName);
        if(carAlt) nextParams.set('carAlt', carAlt);
        if(priceToSend) nextParams.set('carPrice', priceToSend);
        if(segment) nextParams.set('segment', segment);
        if(gear) nextParams.set('gear', gear);

        window.location.href = 'alegere-masina.html?' + nextParams.toString();
      });
    });

    // Topbar sort selector interactions (UI only, sorting logic to be wired server-side)
    const sortRoot = document.querySelector('.results-topbar-sort');
    const sortTrigger = sortRoot ? sortRoot.querySelector('.results-topbar-sort-trigger') : null;
    const sortValueEl = sortRoot ? sortRoot.querySelector('.results-topbar-sort-value') : null;
    const sortMenu = sortRoot ? sortRoot.querySelector('.results-topbar-sort-menu') : null;
    const sortOptions = sortRoot ? sortRoot.querySelectorAll('.results-topbar-sort-option') : null;

    if(sortRoot && sortTrigger && sortMenu && sortOptions && sortOptions.length){
      sortTrigger.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        const isOpen = sortRoot.classList.toggle('is-open');
        sortTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        sortMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      });

      sortOptions.forEach((opt)=>{
        opt.addEventListener('click', (ev)=>{
          ev.stopPropagation();
          sortOptions.forEach(o=>o.classList.remove('is-active'));
          opt.classList.add('is-active');
          if(sortValueEl) sortValueEl.textContent = opt.textContent.trim();
          sortRoot.classList.remove('is-open');
          sortTrigger.setAttribute('aria-expanded', 'false');
          sortMenu.setAttribute('aria-hidden', 'true');
        });
      });

      document.addEventListener('click', ()=>{
        if(sortRoot.classList.contains('is-open')){
          sortRoot.classList.remove('is-open');
          sortTrigger.setAttribute('aria-expanded', 'false');
          sortMenu.setAttribute('aria-hidden', 'true');
        }
      });

    // Client-side filters & sorting for results list
    const resultsList = document.querySelector('.results-list');
    const allCards = resultsList ? Array.from(resultsList.querySelectorAll('.car-card')) : [];
    const originalOrder = allCards.slice();

    function getActiveFilterValue(group){
      const active = document.querySelector('.pill[data-filter-group="'+group+'"].pill-active');
      return active ? active.getAttribute('data-filter-value') : null;
    }

    function applyFiltersAndSort(){
      if(!resultsList || !allCards.length) return;

      const segmentFilter = getActiveFilterValue('segment');
      const transmissionFilter = getActiveFilterValue('transmission');

      const activeSort = document.querySelector('.results-topbar-sort-option.is-active');
      const sortKey = activeSort ? activeSort.getAttribute('data-sort') : 'recommended';

      let working = originalOrder.slice();

      // Apply filters
      working = working.filter(card=>{
        const seg = card.dataset.segment || '';
        const tr = card.dataset.transmission || '';
        const segMatch = !segmentFilter || segmentFilter === 'all' || seg === segmentFilter;
        const trMatch = !transmissionFilter || transmissionFilter === 'all' || tr === transmissionFilter;
        return segMatch && trMatch;
      });

      // Apply sorting
      if(sortKey === 'price-asc' || sortKey === 'price-desc'){
        working.sort((a,b)=>{
          const pa = parseFloat(a.dataset.price || '0');
          const pb = parseFloat(b.dataset.price || '0');
          if(isNaN(pa) || isNaN(pb)) return 0;
          return sortKey === 'price-asc' ? pa - pb : pb - pa;
        });
      }else if(sortKey === 'fleet-newest'){
        working.sort((a,b)=>{
          const na = parseInt(a.dataset.fleetAge || '0', 10);
          const nb = parseInt(b.dataset.fleetAge || '0', 10);
          return nb - na; // newest first
        });
      }else{
        // 'recommended' or unknown => original order
        working = working;
      }

      // Re-render
      resultsList.innerHTML = '';
      working.forEach(card=> resultsList.appendChild(card));
    }

    // Wire filter pills (radio-like per group, but allow deselect)
    document.querySelectorAll('.filter-pills .pill[data-filter-group]').forEach(pill=>{
      pill.addEventListener('click', ()=>{
        const group = pill.getAttribute('data-filter-group');
        const isActive = pill.classList.contains('pill-active');
        const groupPills = document.querySelectorAll('.pill[data-filter-group="'+group+'"]');
        groupPills.forEach(p=> p.classList.remove('pill-active'));
        if(!isActive){
          pill.classList.add('pill-active');
        }
        applyFiltersAndSort();
      });
    });

    // Re-run list when sort changes
    document.querySelectorAll('.results-topbar-sort-option').forEach(opt=>{
      opt.addEventListener('click', ()=>{
        applyFiltersAndSort();
      });
    });
    }

  }

const y = document.getElementById('y');
  if(y) y.textContent = new Date().getFullYear();

  // Booking page: hydrate summary from query params
if(window.location.pathname && window.location.pathname.indexOf('alegere-masina') !== -1){
  const params = new URLSearchParams(window.location.search || '');
  const carName = params.get('carName') || '[Nume mașină]';
  const carAlt = params.get('carAlt') || '[Variantă / motorizare]';
  const carPrice = params.get('carPrice') || '[preț]';
  const segment = params.get('segment') || '';
  const gear = params.get('gear') || '';

  const arrCode = params.get('arr') || '';
  const depCode = params.get('dep') || '';
  const arrLabel = params.get('arrLabel') || arrCode || '';
  const depLabel = params.get('depLabel') || depCode || '';

  const sd = params.get('sd') || '';
  const st = params.get('st') || '';
  const ed = params.get('ed') || '';
  const et = params.get('et') || '';

  const startIso = params.get('start') || (sd && st ? `${sd}T${st}` : '');
  const endIso   = params.get('end') || (ed && et ? `${ed}T${et}` : '');

  const fmtDate = (iso)=>{
    if(!iso) return '';
    const parts = iso.split('-');
    if(parts.length!==3) return iso;
    const [y,m,d] = parts;
    return `${d}.${m}.${y}`;
  };

  const routeText = (arrLabel || '—') + (depLabel ? ` → ${depLabel}` : '');
  const pickupText = (sd ? fmtDate(sd) : '—') + (st ? ` • ${st}` : '');
  const returnText = (ed ? fmtDate(ed) : '—') + (et ? ` • ${et}` : '');

  const setText = (id, value)=>{
    const el = document.getElementById(id);
    if(el && value) el.textContent = value;
  };

  setText('bkCarName', carName);
  setText('bkCarNameAlt', carAlt);
  setText('bkCarPrice', carPrice ? `€${carPrice}` : '');
  setText('bkSegment', segment || 'Clasă flotă');
  setText('bkGear', gear ? (gear === 'automata' ? 'Automată' : 'Manuală') : '');

  setText('bkRoute', routeText);
  setText('bkPickup', pickupText);
  setText('bkReturn', returnText);

  // Populează hidden-urile din formular cu metadatele rezervării (folosite în admin)
  const setValue = (id, value)=>{
    const el = document.getElementById(id);
    if(el != null && value != null){
      el.value = value;
    }
  };

  setValue('pickupAirportCode', arrCode);
  setValue('pickupAirportName', arrLabel);
  setValue('dropoffAirportCode', depCode);
  setValue('dropoffAirportName', depLabel);

  setValue('pickupDate', sd);
  setValue('pickupTime', st);
  setValue('returnDate', ed);
  setValue('returnTime', et);

  setValue('rentalStartIso', startIso);
  setValue('rentalEndIso', endIso);

  setValue('metaCarName', carName);
  setValue('metaCarVariant', carAlt);
  setValue('metaCarSegment', segment);
  setValue('metaCarGearbox', gear);
  setValue('metaTotalPrice', carPrice);
  // metaCurrency și metaStatus au deja valori default din HTML (EUR / PENDING)

  // Build URLs based on query params
  const baseParams = new URLSearchParams(window.location.search || '');
  const backParams = new URLSearchParams(baseParams.toString());
  ['carName','carAlt','carPrice','segment','gear'].forEach((k)=> backParams.delete(k));
  const backQs = backParams.toString();
  const backUrl = './rezultate.html' + (backQs ? `?${backQs}` : '');

  // Hook back-to-results button & step 1 nav
  const backBtn = document.getElementById('backToResultsBtn');
  if(backBtn){ backBtn.href = backUrl; }

  const step1Desktop = document.querySelector('.main-nav .nav-step[data-step="1"]');
  if(step1Desktop && step1Desktop.tagName === 'A'){ step1Desktop.href = backUrl; }

  const step1Mobile = document.querySelector('#mobileNav .mnav-step[data-step="1"]');
  if(step1Mobile && step1Mobile.tagName === 'A'){ step1Mobile.href = backUrl; }

  // Final submit: trimite datele și le salvează local pentru pagina de admin
  const bookingForm = document.getElementById('bookingForm');
  if(bookingForm){

    // Marcare vizuală pentru fișiere încărcate (CI, permis, bilet avion)
    const uploadInputs = bookingForm.querySelectorAll('.upload-drop input[type="file"]');
    uploadInputs.forEach((input)=>{
      const drop = input.closest('.upload-drop');
      if(!drop) return;
      const main = drop.querySelector('.upload-main');
      const hint = drop.querySelector('.upload-hint');
      const defaultMain = main ? main.textContent : '';
      const defaultHint = hint ? hint.textContent : '';

      const syncUploadState = ()=>{
        const hasFile = input.files && input.files.length > 0;
        if(hasFile){
          drop.classList.add('upload-drop--filled');
          const fileName = input.files[0].name;
          if(main) main.textContent = 'Fișier încărcat';
          if(hint) hint.textContent = fileName;
        }else{
          drop.classList.remove('upload-drop--filled');
          if(main) main.textContent = defaultMain || 'Alege fișier sau trage aici';
          if(hint) hint.textContent = defaultHint || 'JPG, PNG sau PDF';
        }
      };

      // Inițializare (în cazul în care browserul reține fișierele)
      syncUploadState();

      input.addEventListener('change', syncUploadState);
    });

    bookingForm.addEventListener('submit', (e)=>{

      e.preventDefault();

      // Validează toate câmpurile obligatorii, inclusiv fișierele și checkbox-ul de consimțământ
      if(!bookingForm.checkValidity()){
        bookingForm.reportValidity();
        return;
      }

      const termsCheckbox = bookingForm.querySelector('input[name="agreeTerms"]');
      if(!termsCheckbox || !termsCheckbox.checked){
        alert('Te rugăm să confirmi că ești de acord cu Termenii & Condițiile pentru a continua.');
        return;
      }

      const submitParams = new URLSearchParams(baseParams.toString());

      const getVal = (selector)=>{
        const el = bookingForm.querySelector(selector);
        return el && el.value ? el.value.trim() : '';
      };

      const fullName = getVal('input[name="fullName"]');
      const email = getVal('input[name="email"]');
      const travelCountry = getVal('#travelCountry');
      const flightNumber = getVal('input[name="flightNumber"]');

      const phoneCountryEl = document.getElementById('phoneCountry');
      const phoneNumberEl = document.getElementById('phoneNumber');
      const phoneCountryVal = phoneCountryEl && phoneCountryEl.value ? phoneCountryEl.value : '';
      let phoneNumberVal = phoneNumberEl && phoneNumberEl.value ? phoneNumberEl.value.trim() : '';

      // Normalizăm numărul de telefon astfel încât în query param să ajungă doar numărul național (fără prefix)
      if(phoneNumberVal){
        let digits = phoneNumberVal.replace(/\D/g,'');
        const cc = phoneCountryVal || '+40';
        const ccDigits = cc.replace('+','');

        // Accept forme de tip 00 + prefix + număr
        while(digits.startsWith('00')){
          digits = digits.slice(2);
        }

        // Dacă utilizatorul a introdus deja prefixul țării, îl eliminăm din zona de număr
        if(ccDigits && digits.startsWith(ccDigits)){
          digits = digits.slice(ccDigits.length);
        }

        // Eliminăm un 0 inițial de tip prefix național (ex: 07xx -> 7xx)
        if(digits.startsWith('0')){
          digits = digits.slice(1);
        }

        phoneNumberVal = digits;
      }

      if(fullName) submitParams.set('fullName', fullName);
      if(email) submitParams.set('email', email);
      if(travelCountry) submitParams.set('travelCountry', travelCountry);
      if(flightNumber) submitParams.set('flightNumber', flightNumber);
      if(phoneCountryVal) submitParams.set('phoneCountry', phoneCountryVal);
      if(phoneNumberVal) submitParams.set('phoneNumber', phoneNumberVal);

      // Construim obiectul de rezervare care va fi vizibil în pagina de admin
      const reservation = {
        id: 'RES-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7).toUpperCase(),
        createdAt: new Date().toISOString(),

        // Trip & mașină
        pickupAirportCode: document.getElementById('pickupAirportCode')?.value || arrCode,
        pickupAirportName: document.getElementById('pickupAirportName')?.value || arrLabel,
        dropoffAirportCode: document.getElementById('dropoffAirportCode')?.value || depCode,
        dropoffAirportName: document.getElementById('dropoffAirportName')?.value || depLabel,
        pickupDate: document.getElementById('pickupDate')?.value || sd,
        pickupTime: document.getElementById('pickupTime')?.value || st,
        returnDate: document.getElementById('returnDate')?.value || ed,
        returnTime: document.getElementById('returnTime')?.value || et,
        rentalStartIso: document.getElementById('rentalStartIso')?.value || startIso,
        rentalEndIso: document.getElementById('rentalEndIso')?.value || endIso,

        carName: document.getElementById('metaCarName')?.value || carName,
        carVariant: document.getElementById('metaCarVariant')?.value || carAlt,
        carSegment: document.getElementById('metaCarSegment')?.value || segment,
        carGearbox: document.getElementById('metaCarGearbox')?.value || gear,
        totalPrice: document.getElementById('metaTotalPrice')?.value || carPrice,
        currency: document.getElementById('metaCurrency')?.value || 'EUR',
        status: document.getElementById('metaStatus')?.value || 'PENDING',

        // Date client
        fullName,
        email,
        phoneCountry: phoneCountryVal,
        phoneNumber: phoneNumberVal,
        travelCountry,
        flightNumber,
        birthday: getVal('input[name="birthday"]'),
        birthCountry: getVal('select[name="birthCountry"]'),
        documentNumber: getVal('input[name="documentNumber"]'),
        documentIssuer: getVal('input[name="documentIssuer"]'),
        documentExpiry: getVal('input[name="documentExpiry"]'),
        extraNotes: getVal('textarea[name="extraNotes"]'),

        agreeTerms: !!termsCheckbox && termsCheckbox.checked,
        agreeMarketing: !!bookingForm.querySelector('input[name="agreeMarketing"]:checked'),

        // Doar numele fișierelor, nu conținutul
        files: {
          idFront: bookingForm.querySelector('#idFront')?.files?.[0]?.name || '',
          idBack: bookingForm.querySelector('#idBack')?.files?.[0]?.name || '',
          licenseFront: bookingForm.querySelector('#licenseFront')?.files?.[0]?.name || '',
          licenseBack: bookingForm.querySelector('#licenseBack')?.files?.[0]?.name || '',
          flightTicket: bookingForm.querySelector('#flightTicket')?.files?.[0]?.name || ''
        }
      };

      // Salvăm rezervarea local; admin.html va citi din `gvReservations`
      try{
        if(window.localStorage){
          const raw = localStorage.getItem('gvReservations');
          const list = raw ? JSON.parse(raw) : [];
          list.push(reservation);
          localStorage.setItem('gvReservations', JSON.stringify(list));
        }
      }catch(_e){
        // nu blocăm fluxul dacă localStorage nu e disponibil
      }

      const qs = submitParams.toString();
      window.location.href = './multumire.html' + (qs ? `?${qs}` : '');
    });
  }
}

const phoneCountry = document.getElementById('phoneCountry');
    const phoneInput = document.getElementById('phoneNumber');

    if(phoneCountry && phoneInput){
      // Basic per-country rules: number of digits expected for the national number (without prefix)
      const PHONE_RULES = {
        '+40': { min:9, max:9 },   // România: 9 cifre fără prefix (ex: 7XX XXX XXX)
        '+33': { min:9, max:9 },   // Franța
        '+34': { min:9, max:9 },   // Spania
        '+39': { min:8, max:11 },  // Italia (variază)
        '+49': { min:7, max:13 },  // Germania
        '+44': { min:9, max:10 },  // Marea Britanie
        '+43': { min:10, max:13 }, // Austria
        '+31': { min:9, max:9 },   // Olanda
        '+32': { min:8, max:9 },   // Belgia
        '+41': { min:9, max:9 },   // Elveția
        '+30': { min:10, max:10 }, // Grecia
        '+420': { min:9, max:9 },  // Cehia
        '+421': { min:9, max:9 },  // Slovacia
        '+36': { min:8, max:9 },   // Ungaria
        '+48': { min:9, max:9 },   // Polonia
        '+386': { min:8, max:8 },  // Slovenia
        '+385': { min:8, max:9 },  // Croația

        /* Extinse pentru mai multe țări din dropdown: valori aproximative
           (suficient de strict încât să prindă o cifră în plus sau în minus) */
        '+355': { min:8, max:9 },   // Albania
        '+213': { min:8, max:9 },   // Algeria
        '+54':  { min:8, max:10 },  // Argentina
        '+61':  { min:8, max:9 },   // Australia
        '+994': { min:8, max:9 },   // Azerbaidjan
        '+973': { min:7, max:8 },   // Bahrain
        '+880': { min:8, max:10 },  // Bangladesh
        '+591': { min:8, max:9 },   // Bolivia
        '+387': { min:8, max:9 },   // Bosnia și Herțegovina
        '+55':  { min:8, max:11 },  // Brazilia
        '+359': { min:8, max:9 },   // Bulgaria
        '+855': { min:8, max:9 },   // Cambodgia
        '+237': { min:8, max:9 },   // Camerun
        '+1':   { min:10, max:10 }, // SUA / Canada
        '+56':  { min:8, max:9 },   // Chile
        '+86':  { min:8, max:11 },  // China
        '+57':  { min:8, max:10 },  // Columbia
        '+506': { min:8, max:8 },   // Costa Rica
        '+357': { min:8, max:8 },   // Cipru
        '+45':  { min:8, max:8 },   // Danemarca
        '+20':  { min:8, max:9 },   // Egipt
        '+372': { min:7, max:8 },   // Estonia
        '+251': { min:8, max:9 },   // Etiopia
        '+358': { min:8, max:10 },  // Finlanda
        '+995': { min:8, max:9 },   // Georgia
        '+502': { min:8, max:8 },   // Guatemala
        '+504': { min:8, max:8 },   // Honduras
        '+852': { min:8, max:8 },   // Hong Kong
        '+354': { min:7, max:7 },   // Islanda
        '+91':  { min:10, max:10 }, // India
        '+62':  { min:9, max:11 },  // Indonezia
        '+353': { min:8, max:9 },   // Irlanda
        '+972': { min:8, max:9 },   // Israel
        '+81':  { min:9, max:10 },  // Japonia
        '+962': { min:8, max:9 },   // Iordania
        '+7':   { min:10, max:10 }, // Rusia / Kazahstan (simplificat)
        '+254': { min:9, max:9 },   // Kenya
        '+82':  { min:9, max:9 },   // Coreea de Sud
        '+965': { min:8, max:8 },   // Kuweit
        '+996': { min:8, max:9 },   // Kârgâzstan
        '+371': { min:8, max:8 },   // Letonia
        '+961': { min:8, max:8 },   // Liban
        '+370': { min:8, max:8 },   // Lituania
        '+352': { min:8, max:9 },   // Luxemburg
        '+353': { min:8, max:9 },   // Irlanda (deja definită mai sus)
        '+389': { min:8, max:9 },   // Macedonia de Nord
        '+60':  { min:8, max:10 },  // Malaysia
        '+356': { min:8, max:8 },   // Malta
        '+52':  { min:10, max:10 }, // Mexic
        '+373': { min:8, max:8 },   // Moldova
        '+377': { min:8, max:9 },   // Monaco
        '+212': { min:8, max:9 },   // Maroc
        '+64':  { min:8, max:9 },   // Noua Zeelandă
        '+234': { min:8, max:10 },  // Nigeria
        '+47':  { min:8, max:8 },   // Norvegia
        '+92':  { min:9, max:10 },  // Pakistan
        '+507': { min:7, max:8 },   // Panama
        '+595': { min:8, max:9 },   // Paraguay
        '+51':  { min:8, max:9 },   // Peru
        '+63':  { min:9, max:10 },  // Filipine
        '+351': { min:9, max:9 },   // Portugalia
        '+974': { min:7, max:8 },   // Qatar
        '+381': { min:8, max:9 },   // Serbia
        '+65':  { min:8, max:8 },   // Singapore
        '+27':  { min:9, max:9 },   // Africa de Sud
        '+94':  { min:9, max:9 },   // Sri Lanka
        '+46':  { min:7, max:9 },   // Suedia
        '+886': { min:8, max:9 },   // Taiwan
        '+66':  { min:8, max:9 },   // Thailanda
        '+90':  { min:10, max:10 }, // Turcia
        '+380': { min:9, max:9 },   // Ucraina
        '+971': { min:8, max:9 },   // Emiratele Arabe Unite
        '+598': { min:7, max:8 },   // Uruguay
        '+58':  { min:7, max:9 },   // Venezuela
        '+84':  { min:8, max:10 },  // Vietnam

        // Fallback: valori rezonabile pentru restul țărilor
        'default': { min:6, max:14 }
      };

      const phoneRow = phoneInput.closest('.phone-row');
      const phoneFlagEl = document.getElementById('phoneCountryFlag');

      const updateFlag = ()=>{
        if(!phoneFlagEl || !phoneCountry) return;
        const selected = phoneCountry.options[phoneCountry.selectedIndex];
        if(!selected) return;
        const text = (selected.textContent || '').trim();
        const flagChar = text.split(' ')[0] || '';
        phoneFlagEl.textContent = flagChar;
      };


      let phoneErrorEl = document.getElementById('phoneNumberError');
      if(!phoneErrorEl){
        phoneErrorEl = document.createElement('p');
        phoneErrorEl.id = 'phoneNumberError';
        phoneErrorEl.className = 'field-error';
        phoneErrorEl.style.display = 'none';
        if(phoneRow && phoneRow.parentNode){
          phoneRow.insertAdjacentElement('afterend', phoneErrorEl);
        }
      }

      const setPhoneError = (msg)=>{
        if(!phoneErrorEl) return;
        if(msg){
          phoneErrorEl.textContent = msg;
          phoneErrorEl.style.display = 'block';
          phoneInput.classList.add('field-input-error');
          phoneInput.setAttribute('aria-invalid','true');
          phoneInput.setCustomValidity(msg);
        }else{
          phoneErrorEl.textContent = '';
          phoneErrorEl.style.display = 'none';
          phoneInput.classList.remove('field-input-error');
          phoneInput.removeAttribute('aria-invalid');
          phoneInput.setCustomValidity('');
        }
      };

      const normalizePhone = ()=>{
        const cc = phoneCountry.value || '';
        const ccDigits = cc.replace('+','');
        let raw = phoneInput.value || '';
        let digits = raw.replace(/\D/g,'');

        if(!digits){
          setPhoneError('');
          return;
        }

        // Accept forme de tip 00 + prefix + număr
        while(digits.startsWith('00')){
          digits = digits.slice(2);
        }

        // Dacă utilizatorul a introdus deja prefixul țării, îl eliminăm din zona de număr
        if(ccDigits && digits.startsWith(ccDigits)){
          digits = digits.slice(ccDigits.length);
        }

        // Eliminăm un 0 inițial de tip prefix național (ex: 07xx -> 7xx)
        if(digits.startsWith('0')){
          digits = digits.slice(1);
        }

        // Validare pe baza regulilor
        const rule = PHONE_RULES[cc] || PHONE_RULES['default'];
        const len = digits.length;

        if(len < rule.min || len > rule.max){
          const msg = (rule.min === rule.max)
            ? `Numărul de telefon trebuie să conțină exact ${rule.min} cifre pentru această țară.`
            : `Numărul de telefon trebuie să conțină între ${rule.min} și ${rule.max} cifre pentru această țară.`;
          setPhoneError(msg);
        }else{
          setPhoneError('');
        }

        // Rescriem vizibil numărul în format normalizat: prefix + număr fără spații
        phoneInput.value = cc + ' ' + digits;
      };

      // Actualizăm și steagul, și normalizăm numărul la schimbarea țării
      phoneCountry.addEventListener('change', ()=>{
        updateFlag();
        normalizePhone();
      });
      phoneInput.addEventListener('blur', normalizePhone);

      // Setăm steagul inițial la încărcarea paginii
      updateFlag();
    }

  // Restricție dinamică pentru data nașterii (minim 22 de ani)
  const birthHidden = document.getElementById('birthDate');
  const birthDisplay = document.getElementById('birthDateDisplay');
  if(birthHidden && birthDisplay){
    const today = new Date();
    const minAgeYears = 22;
    const maxAgeYears = 65;
    const maxDate = new Date(today.getFullYear() - minAgeYears, today.getMonth(), today.getDate()); // cel mai tânăr (22)
    const minDate = new Date(today.getFullYear() - maxAgeYears, today.getMonth(), today.getDate()); // cel mai în vârstă (65)
    const maxISO = fmtISO(maxDate);
    const minISO = fmtISO(minDate);

    const validateBirthDate = ()=>{
      const isoVal = birthHidden.value;
      if(!isoVal){
        birthDisplay.setCustomValidity('Completează data nașterii.');
        return;
      }
      if(isoVal > maxISO || isoVal < minISO){
        birthDisplay.setCustomValidity('Trebuie să ai între 22 și 65 de ani pentru a închiria o mașină.');
      }else{
        birthDisplay.setCustomValidity('');
      }
    };

    birthDisplay.addEventListener('blur', validateBirthDate);
  // Thank you page: hydrate recap from query params
  if(window.location.pathname && window.location.pathname.indexOf('multumire') !== -1){
    const params = new URLSearchParams(window.location.search || '');

    const arrLabel = params.get('arrLabel') || params.get('arr') || '';
    const depLabel = params.get('depLabel') || params.get('dep') || '';
    const sd = params.get('sd') || '';
    const st = params.get('st') || '';
    const ed = params.get('ed') || '';
    const et = params.get('et') || '';

    const carName = params.get('carName') || '';
    const carAlt = params.get('carAlt') || '';
    const carPrice = params.get('carPrice') || '';
    const segment = params.get('segment') || '';
    const gear = params.get('gear') || '';

    const travelCountry = params.get('travelCountry') || '';
    const flightNumber = params.get('flightNumber') || '';
    const fullName = params.get('fullName') || '';
    const email = params.get('email') || '';
    const phoneCountry = params.get('phoneCountry') || '';
    const phoneNumber = params.get('phoneNumber') || '';

    const fmtDate = (iso)=>{
      if(!iso) return '';
      const parts = iso.split('-');
      if(parts.length!==3) return iso;
      const [y,m,d] = parts;
      return `${d}.${m}.${y}`;
    };

    const routeText = (arrLabel || '—') + (depLabel ? ` → ${depLabel}` : '');
    const pickupText = (sd ? fmtDate(sd) : '—') + (st ? ` • ${st}` : '');
    const returnText = (ed ? fmtDate(ed) : '—') + (et ? ` • ${et}` : '');
    const periodText = (pickupText && returnText) ? `${pickupText}  →  ${returnText}` : (pickupText || returnText || '—');

    const phoneDisplay = (phoneCountry || '') + (phoneNumber ? ((phoneCountry ? ' ' : '') + phoneNumber) : '');

    const setText = (id, value)=>{
      const el = document.getElementById(id);
      if(el && value) el.textContent = value;
    };

    if(carName) setText('tyCarName', carName);
    if(carAlt) setText('tyCarAlt', carAlt);
    if(segment) setText('tyCarSegment', segment);
    if(gear){
      const gearLabel = (gear === 'automata' ? 'Automată' : 'Manuală');
      setText('tyCarGear', gearLabel);
    }
    if(carPrice) setText('tyCarPrice', `€${carPrice}`);

    setText('tyRoute', routeText);
    setText('tyPeriod', periodText);
    if(travelCountry) setText('tyTravelCountry', travelCountry);
    if(flightNumber) setText('tyFlightNumber', flightNumber);
    if(fullName) setText('tyName', fullName);
    if(email) setText('tyEmail', email);
    if(phoneDisplay) setText('tyPhone', phoneDisplay);
  }


  }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  if(window.location.pathname && window.location.pathname.indexOf('multumire') !== -1){
    const params = new URLSearchParams(window.location.search || '');

    const arrLabel = params.get('arrLabel') || params.get('arr') || '';
    const depLabel = params.get('depLabel') || params.get('dep') || '';
    const sd = params.get('sd') || '';
    const st = params.get('st') || '';
    const ed = params.get('ed') || '';
    const et = params.get('et') || '';

    const carName = params.get('carName') || '';
    const carAlt = params.get('carAlt') || '';
    const carPrice = params.get('carPrice') || '';
    const segment = params.get('segment') || '';
    const gear = params.get('gear') || '';

    const travelCountry = params.get('travelCountry') || '';
    const flightNumber = params.get('flightNumber') || '';
    const fullName = params.get('fullName') || '';
    const email = params.get('email') || '';
    const phoneCountry = params.get('phoneCountry') || '';
    const phoneNumber = params.get('phoneNumber') || '';

    const fmtDate = (iso)=>{
      if(!iso) return '';
      const parts = iso.split('-');
      if(parts.length!==3) return iso;
      const [y,m,d] = parts;
      return `${d}.${m}.${y}`;
    };

    const routeText = (arrLabel || '—') + (depLabel ? ` → ${depLabel}` : '');
    const pickupText = (sd ? fmtDate(sd) : '—') + (st ? ` • ${st}` : '');
    const returnText = (ed ? fmtDate(ed) : '—') + (et ? ` • ${et}` : '');
    const periodText = (pickupText && returnText) ? `${pickupText}  →  ${returnText}` : (pickupText || returnText || '—');

    // Reconstruim numărul pentru afișare din prefix și numărul național
    let phoneDisplay = '';
    if(phoneCountry || phoneNumber){
      let normalizedNumber = (phoneNumber || '').toString().trim();
      if(normalizedNumber){
        if(normalizedNumber.startsWith('+')){
          phoneDisplay = normalizedNumber;
        }else{
          phoneDisplay = (phoneCountry || '') + (phoneCountry && normalizedNumber ? ' ' : '') + normalizedNumber;
        }
      }else{
        phoneDisplay = phoneCountry || '';
      }
    }

    const setText = (id, value)=>{
      const el = document.getElementById(id);
      if(el && value) el.textContent = value;
    };

    if(carName) setText('tyCarName', carName);
    if(carAlt) setText('tyCarAlt', carAlt);
    if(segment) setText('tyCarSegment', segment);
    if(gear){
      const gearLabel = (gear === 'automata' ? 'Automată' : 'Manuală');
      setText('tyCarGear', gearLabel);
    }
    if(carPrice) setText('tyCarPrice', `€${carPrice}`);

    setText('tyRoute', routeText);
    setText('tyPeriod', periodText);
    if(travelCountry) setText('tyTravelCountry', travelCountry);
    if(flightNumber) setText('tyFlightNumber', flightNumber);
    if(fullName) setText('tyName', fullName);
    if(email) setText('tyEmail', email);
    if(phoneDisplay) setText('tyPhone', phoneDisplay);
  }


  // Contul meu – navigare între secțiuni (tab-like) prin scroll lin
  (()=>{
    const path = window.location.pathname || window.location.href || '';
    const isAccount = path.includes('contul-meu.html');
    if(!isAccount) return;

    const menuItems = document.querySelectorAll('.account-menu-item');
    if(!menuItems.length) return;

    const reservationsSection = document.getElementById('accountReservationsSection');
    const detailsSection = document.getElementById('accountDetailsSection');
    const documentsSection = document.getElementById('accountDocumentsSection');

    const scrollToSection = (el)=>{
      if(!el) return;
      const rect = el.getBoundingClientRect();
      const offset = 96; // aproximativ înălțimea topbar-ului
      const targetY = rect.top + window.scrollY - offset;
      window.scrollTo({ top: targetY < 0 ? 0 : targetY, behavior: 'smooth' });
    };

    menuItems.forEach((btn)=>{
      btn.addEventListener('click', ()=>{
        menuItems.forEach(b=> b.classList.remove('account-menu-item--active'));
        btn.classList.add('account-menu-item--active');

        const label = btn.textContent.trim();
        if(label === 'Rezervările mele'){
          scrollToSection(reservationsSection);
        }else if(label === 'Detalii personale'){
          scrollToSection(detailsSection);
        }else if(label === 'Documente încărcate'){
          scrollToSection(documentsSection || detailsSection);
        }else if(label.indexOf('Preferințe') !== -1){
          scrollToSection(documentsSection || detailsSection);
        }
      });
    });
  })();


  // Smooth scroll pentru ancore interne pe mobil (href="#...") pentru experiență fluidă
  (()=>{
    const isMobile = window.innerWidth <= 768;
    if(!isMobile) return;

    const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"]):not([href="#!"])');
    if(!anchorLinks.length) return;

    const getOffsetTop = (el)=>{
      const rect = el.getBoundingClientRect();
      const offset = 96; // compensăm topbar-ul
      return rect.top + window.scrollY - offset;
    };

    anchorLinks.forEach((link)=>{
      link.addEventListener('click', (e)=>{
        const href = link.getAttribute('href');
        if(!href || !href.startsWith('#')) return;

        const targetId = href.slice(1);
        const targetEl = document.getElementById(targetId);
        if(!targetEl) return;

        e.preventDefault();
        const targetY = getOffsetTop(targetEl);
        window.scrollTo({ top: targetY < 0 ? 0 : targetY, behavior: 'smooth' });
      });
    });
  })();
});
