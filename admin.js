(function(){
  const API_BASE = 'http://localhost:4000/api';

  function getToken(){
    return window.localStorage.getItem('gvAdminToken') || '';
  }

  function setToken(token, user){
    if(token){
      window.localStorage.setItem('gvAdminToken', token);
    } else {
      window.localStorage.removeItem('gvAdminToken');
    }
    if(user){
      window.localStorage.setItem('gvAdminUser', JSON.stringify(user));
    }
  }

  function getStoredUser(){
    try{
      const raw = window.localStorage.getItem('gvAdminUser');
      return raw ? JSON.parse(raw) : null;
    }catch(e){
      return null;
    }
  }

  async function apiRequest(path, options){
    const headers = options && options.headers ? { ...options.headers } : {};
    const token = getToken();
    if(token){
      headers['Authorization'] = 'Bearer ' + token;
    }
    if(!(options && options.body instanceof FormData)){
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    const resp = await fetch(API_BASE + path, {
      method: (options && options.method) || 'GET',
      headers,
      body: options && options.body && !(options.body instanceof FormData) ? JSON.stringify(options.body) : (options && options.body || undefined)
    });
    if(!resp.ok){
      let errJson = null;
      try{ errJson = await resp.json(); }catch(e){}
      throw new Error(errJson && errJson.error ? errJson.error : ('Eroare API (' + resp.status + ')'));
    }
    try{
      return await resp.json();
    }catch(e){
      return null;
    }
  }

  function setApiStatus(status, message){
    const badge = document.getElementById('apiStatusBadge');
    if(!badge) return;
    const dot = badge.querySelector('span');
    const text = badge.querySelector('span + span');
    if(message) text.textContent = message;

    if(status === 'ok'){
      badge.className = 'inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300';
      if(dot){ dot.className = 'inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse'; }
    }else if(status === 'error'){
      badge.className = 'inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs text-rose-300';
      if(dot){ dot.className = 'inline-flex h-1.5 w-1.5 rounded-full bg-rose-400'; }
    }else{
      badge.className = 'inline-flex items-center gap-2 rounded-full border border-slate-500/40 bg-slate-500/10 px-3 py-1 text-xs text-slate-300';
      if(dot){ dot.className = 'inline-flex h-1.5 w-1.5 rounded-full bg-slate-300 animate-pulse'; }
    }
  }

  async function checkHealth(){
    try{
      setApiStatus('loading', 'Verificare...');
      const resp = await fetch(API_BASE + '/health');
      if(!resp.ok) throw new Error('Status API ' + resp.status);
      setApiStatus('ok', 'Online');
    }catch(e){
      console.error(e);
      setApiStatus('error', 'Offline');
    }
  }

  function selectNav(section){
    const nav = document.getElementById('adminNav');
    if(nav){
      nav.querySelectorAll('.admin-nav-item').forEach(btn=>{
        if(btn.dataset.section === section){
          btn.classList.add('is-active');
        }else{
          btn.classList.remove('is-active');
        }
      });
    }
    document.querySelectorAll('.admin-section').forEach(sec=>{
      sec.classList.toggle('hidden', sec.id !== 'section-' + section);
    });
  }

  function updateAdminUserLabel(){
    const label = document.getElementById('adminUserLabel');
    const user = getStoredUser();
    if(label){
      if(user){
        label.textContent = (user.fullName || user.email || 'Admin');
      }else{
        label.textContent = 'Neautentificat';
      }
    }
  }

  async function handleLoginSubmit(ev){
    ev.preventDefault();
    const form = ev.target;
    const email = form.email.value.trim();
    const password = form.password.value;
    const errorEl = document.getElementById('adminLoginError');
    if(errorEl) { errorEl.classList.add('hidden'); errorEl.textContent = ''; }

    try{
      const resp = await apiRequest('/auth/login', { method:'POST', body:{ email, password } });
      if(!resp || !resp.user){
        throw new Error('Răspuns login invalid.');
      }
      if(resp.user.role !== 'admin'){
        throw new Error('Acest cont nu are rol de administrator.');
      }
      setToken(resp.token, resp.user);
      updateAdminUserLabel();
      showDashboard();
    }catch(e){
      console.error(e);
      if(errorEl){
        errorEl.textContent = e.message || 'Nu s-a putut realiza autentificarea.';
        errorEl.classList.remove('hidden');
      }else{
        alert(e.message || 'Nu s-a putut realiza autentificarea.');
      }
    }
  }

  function showDashboard(){
    const loginView = document.getElementById('adminLoginView');
    const dashView = document.getElementById('adminDashboardView');
    if(loginView) loginView.classList.add('hidden');
    if(dashView) dashView.classList.remove('hidden');
    selectNav('reservations');
    loadReservations();
    loadCars();
    loadAirports();
    loadPartners();
    initPricingCombos();
  }

  function showLogin(){
    const loginView = document.getElementById('adminLoginView');
    const dashView = document.getElementById('adminDashboardView');
    if(loginView) loginView.classList.remove('hidden');
    if(dashView) dashView.classList.add('hidden');
  }

  async function loadReservations(){
    const tbody = document.getElementById('reservationsTableBody');
    const details = document.getElementById('reservationDetailsPanel');
    if(tbody){ tbody.innerHTML = '<tr><td class="px-4 py-3 text-xs text-slate-500" colspan="8">Se încarcă rezervările...</td></tr>'; }
    if(details){ details.classList.add('hidden'); details.innerHTML = ''; }
    try{
      const data = await apiRequest('/reservations', {});
      if(!tbody) return;
      if(!data || !data.length){
        tbody.innerHTML = '<tr><td class="px-4 py-3 text-xs text-slate-500" colspan="8">Nu există încă rezervări.</td></tr>';
        return;
      }
      tbody.innerHTML = '';
      data.forEach(row=>{
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-900/80 transition';
        const route = (row.pickup_airport_label || row.pickup_airport || '—') + (row.dropoff_airport_label || row.dropoff_airport ? (' → ' + (row.dropoff_airport_label || row.dropoff_airport)) : '');
        const period = (row.pickup_date || '—') + (row.pickup_time ? (' ' + row.pickup_time) : '') + ' → ' + (row.dropoff_date || '—') + (row.dropoff_time ? (' ' + row.dropoff_time) : '');
        const car = (row.car_name || '—') + (row.car_segment ? (' · ' + row.car_segment) : '');
        tr.innerHTML = `
          <td class="px-4 py-2 align-top text-xs text-slate-400">#${row.id}</td>
          <td class="px-4 py-2 align-top text-xs text-slate-400">${row.created_at || ''}</td>
          <td class="px-4 py-2 align-top text-xs">
            <div class="font-medium text-slate-50">${row.full_name || '—'}</div>
            <div class="text-slate-400">${row.email || ''}</div>
            <div class="text-slate-500">${row.phone || ''}</div>
          </td>
          <td class="px-4 py-2 align-top text-xs text-slate-200">${route}</td>
          <td class="px-4 py-2 align-top text-xs text-slate-200">${period}</td>
          <td class="px-4 py-2 align-top text-xs text-slate-200">${car}</td>
          <td class="px-4 py-2 align-top text-xs">
            <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border ${
              row.status === 'confirmed' ? 'border-emerald-400/60 text-emerald-300 bg-emerald-500/10' :
              row.status === 'cancelled' ? 'border-rose-400/60 text-rose-300 bg-rose-500/10' :
              'border-amber-400/60 text-amber-300 bg-amber-500/10'
            }">
              ${row.status || 'pending'}
            </span>
          </td>
          <td class="px-4 py-2 align-top text-xs text-right">
            <button class="text-sky-300 hover:text-sky-200 underline decoration-sky-500/60" data-res-id="${row.id}">Detalii</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('button[data-res-id]').forEach(btn=>{
        btn.addEventListener('click', async ()=>{
          const id = btn.getAttribute('data-res-id');
          try{
            const row = await apiRequest('/reservations/' + id, {});
            if(!details) return;
            details.classList.remove('hidden');
            details.innerHTML = `
              <div class="flex items-center justify-between mb-2">
                <div class="text-xs uppercase tracking-[0.18em] text-slate-400">Detalii rezervare</div>
                <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border ${
                  row.status === 'confirmed' ? 'border-emerald-400/60 text-emerald-300 bg-emerald-500/10' :
                  row.status === 'cancelled' ? 'border-rose-400/60 text-rose-300 bg-rose-500/10' :
                  'border-amber-400/60 text-amber-300 bg-amber-500/10'
                }">${row.status || 'pending'}</span>
              </div>
              <div class="grid md:grid-cols-3 gap-3">
                <div>
                  <h4 class="font-semibold text-slate-100 mb-1 text-xs">Client</h4>
                  <p>${row.full_name || '—'}</p>
                  <p class="text-slate-400">${row.email || ''}</p>
                  <p class="text-slate-400">${row.phone || ''}</p>
                  <p class="text-slate-500 mt-1">Țara de călătorie: ${row.travel_country || '—'}</p>
                  <p class="text-slate-500">Zbor: ${row.flight_number || '—'}</p>
                </div>
                <div>
                  <h4 class="font-semibold text-slate-100 mb-1 text-xs">Rută & perioadă</h4>
                  <p>${(row.pickup_airport_label || row.pickup_airport || '—')} → ${(row.dropoff_airport_label || row.dropoff_airport || '—')}</p>
                  <p class="text-slate-400 mt-1">${(row.pickup_date || '—')} ${row.pickup_time || ''} → ${(row.dropoff_date || '—')} ${row.dropoff_time || ''}</p>
                  <p class="text-slate-500 mt-1">Durată: ${row.rental_days || '—'} zile</p>
                </div>
                <div>
                  <h4 class="font-semibold text-slate-100 mb-1 text-xs">Mașină & preț</h4>
                  <p>${row.car_name || '—'}</p>
                  <p class="text-slate-400">${row.car_segment || ''} ${row.car_gear ? '· ' + row.car_gear : ''}</p>
                  <p class="text-slate-500 mt-1">Preț / zi: ${row.price_per_day ? '€' + row.price_per_day : '—'}</p>
                  <p class="text-slate-100 text-sm mt-1">Total: ${row.price_total ? '€' + row.price_total : '—'}</p>
                </div>
              </div>
            `;
          }catch(e){
            console.error(e);
            if(details){
              details.classList.remove('hidden');
              details.innerHTML = '<p class="text-rose-300 text-xs">Nu s-au putut încărca detaliile rezervării.</p>';
            }
          }
        });
      });

    }catch(e){
      console.error(e);
      if(tbody){
        tbody.innerHTML = '<tr><td class="px-4 py-3 text-xs text-rose-400" colspan="8">Nu s-au putut încărca rezervările.</td></tr>';
      }
    }
  }

  async function loadCars(){
    const list = document.getElementById('carsList');
    if(list){
      list.innerHTML = '<p class="text-xs text-slate-500">Se încarcă mașinile...</p>';
    }
    try{
      const cars = await apiRequest('/cars', {});
      if(!list) return;
      if(!cars || !cars.length){
        list.innerHTML = '<p class="text-xs text-slate-500">Nu sunt încă mașini definite.</p>';
        return;
      }
      list.innerHTML = '';
      cars.forEach(car=>{
        const card = document.createElement('div');
        card.className = 'flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5';
        card.innerHTML = `
          <div>
            <div class="text-sm font-semibold text-slate-50">${car.name}</div>
            <div class="text-xs text-slate-400">${car.brand || ''} ${car.model || ''}</div>
            <div class="text-[11px] text-slate-500 mt-1">${car.category || '—'} · ${car.transmission || '—'} · locuri ${car.seats || '—'}</div>
          </div>
          <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border ${
            car.is_active ? 'border-emerald-400/60 text-emerald-300' : 'border-slate-500/60 text-slate-400'
          }">
            ${car.is_active ? 'activă' : 'inactivă'}
          </span>
        `;
        list.appendChild(card);
      });

      const selects = [document.getElementById('pricingCarSelect'), document.getElementById('addPricingCarSelect')];
      selects.forEach(sel=>{
        if(!sel) return;
        sel.innerHTML = '<option value="">Alege mașina</option>';
        cars.forEach(c=>{
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.name;
          sel.appendChild(opt);
        });
      });

    }catch(e){
      console.error(e);
      if(list){
        list.innerHTML = '<p class="text-xs text-rose-400">Nu s-au putut încărca mașinile.</p>';
      }
    }
  }

  async function loadAirports(){
    const list = document.getElementById('airportsList');
    if(list){
      list.innerHTML = '<p class="text-xs text-slate-500">Se încarcă aeroporturile...</p>';
    }
    try{
      const airports = await apiRequest('/airports', {});
      if(!list) return;
      if(!airports || !airports.length){
        list.innerHTML = '<p class="text-xs text-slate-500">Nu sunt încă aeroporturi definite.</p>';
        return;
      }
      list.innerHTML = '';
      airports.forEach(a=>{
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2';
        row.innerHTML = `
          <div>
            <div class="text-sm font-semibold text-slate-50">${a.code} · ${a.name}</div>
            <div class="text-xs text-slate-400">${a.city || ''} ${a.country || ''}</div>
            <div class="text-[11px] text-slate-500">${a.timezone || ''}</div>
          </div>
        `;
        list.appendChild(row);
      });
    }catch(e){
      console.error(e);
      if(list){
        list.innerHTML = '<p class="text-xs text-rose-400">Nu s-au putut încărca aeroporturile.</p>';
      }
    }
  }

  async function loadPricingRules(){
    const carId = document.getElementById('pricingCarSelect')?.value;
    const list = document.getElementById('pricingRulesList');
    if(!list) return;
    if(!carId){
      list.innerHTML = '<p class="text-xs text-slate-500">Selectează o mașină pentru a vedea regulile de preț.</p>';
      return;
    }
    list.innerHTML = '<p class="text-xs text-slate-500">Se încarcă regulile de preț...</p>';
    try{
      const rules = await apiRequest('/pricing/rules?carId=' + encodeURIComponent(carId), {});
      if(!rules || !rules.length){
        list.innerHTML = '<p class="text-xs text-slate-500">Nu ai încă reguli definite pentru această mașină.</p>';
        return;
      }
      list.innerHTML = '';
      rules.forEach(r=>{
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs';
        const range = (r.min_days || r.max_days) ? ((r.min_days || '?') + '–' + (r.max_days || '?') + ' zile') : 'Toate duratele';
        const season = (r.season_start || r.season_end) ? ((r.season_start || '?') + ' → ' + (r.season_end || '?')) : 'All year';
        row.innerHTML = `
          <div>
            <div class="text-slate-50 font-medium">€${r.base_daily_price}/zi</div>
            <div class="text-slate-400">${range}</div>
            <div class="text-slate-500 text-[11px]">Sezon: ${season}</div>
          </div>
        `;
        list.appendChild(row);
      });
    }catch(e){
      console.error(e);
      list.innerHTML = '<p class="text-xs text-rose-400">Nu s-au putut încărca regulile de preț.</p>';
    }
  }

  async function loadPartners(){
    const list = document.getElementById('partnersList');
    if(list){
      list.innerHTML = '<p class="text-xs text-slate-500">Se încarcă partenerii...</p>';
    }
    try{
      const partners = await apiRequest('/partners', {});
      if(!list) return;
      if(!partners || !partners.length){
        list.innerHTML = '<p class="text-xs text-slate-500">Nu sunt încă parteneri definiți.</p>';
        return;
      }
      list.innerHTML = '';
      partners.forEach(p=>{
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs';
        row.innerHTML = `
          <div>
            <div class="text-sm font-semibold text-slate-50">${p.name}</div>
            <div class="text-slate-400 text-[11px]">${p.api_endpoint || ''}</div>
          </div>
        `;
        list.appendChild(row);
      });
    }catch(e){
      console.error(e);
      if(list){
        list.innerHTML = '<p class="text-xs text-rose-400">Nu s-au putut încărca partenerii.</p>';
      }
    }
  }

  function initPricingCombos(){
    // doar re-populăm selecturile de mașini via loadCars, deci nu e nevoie de cod suplimentar aici.
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    checkHealth();

    const loginForm = document.getElementById('adminLoginForm');
    if(loginForm){
      loginForm.addEventListener('submit', handleLoginSubmit);
    }

    const nav = document.getElementById('adminNav');
    if(nav){
      nav.querySelectorAll('.admin-nav-item').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const section = btn.dataset.section;
          selectNav(section);
          if(section === 'reservations') loadReservations();
          if(section === 'cars') loadCars();
          if(section === 'airports') loadAirports();
          if(section === 'pricing') loadPricingRules();
          if(section === 'partners') loadPartners();
        });
      });
    }

    const logoutBtn = document.getElementById('adminLogoutBtn');
    if(logoutBtn){
      logoutBtn.addEventListener('click', ()=>{
        setToken('', null);
        updateAdminUserLabel();
        showLogin();
      });
    }

    const refreshReservationsBtn = document.getElementById('refreshReservationsBtn');
    if(refreshReservationsBtn){
      refreshReservationsBtn.addEventListener('click', ()=> loadReservations());
    }
    const refreshCarsBtn = document.getElementById('refreshCarsBtn');
    if(refreshCarsBtn){
      refreshCarsBtn.addEventListener('click', ()=> loadCars());
    }
    const refreshAirportsBtn = document.getElementById('refreshAirportsBtn');
    if(refreshAirportsBtn){
      refreshAirportsBtn.addEventListener('click', ()=> loadAirports());
    }
    const refreshPricingBtn = document.getElementById('refreshPricingBtn');
    if(refreshPricingBtn){
      refreshPricingBtn.addEventListener('click', ()=> loadPricingRules());
    }
    const refreshPartnersBtn = document.getElementById('refreshPartnersBtn');
    if(refreshPartnersBtn){
      refreshPartnersBtn.addEventListener('click', ()=> loadPartners());
    }

    const addCarForm = document.getElementById('addCarForm');
    if(addCarForm){
      addCarForm.addEventListener('submit', async (ev)=>{
        ev.preventDefault();
        const form = ev.target;
        const body = {
          name: form.name.value.trim(),
          brand: form.brand.value.trim() || null,
          model: form.model.value.trim() || null,
          category: form.category.value.trim() || null,
          transmission: form.transmission.value.trim() || null,
          seats: form.seats.value ? Number(form.seats.value) : null,
          doors: form.doors.value ? Number(form.doors.value) : null,
          luggageCapacity: form.luggageCapacity.value ? Number(form.luggageCapacity.value) : null,
          isActive: form.isActive.checked
        };
        const msgEl = document.getElementById('addCarMessage');
        if(msgEl){ msgEl.textContent = ''; }
        try{
          await apiRequest('/cars', { method:'POST', body: body });
          if(msgEl){ msgEl.textContent = 'Mașina a fost salvată.'; }
          form.reset();
          form.isActive.checked = true;
          loadCars();
        }catch(e){
          console.error(e);
          if(msgEl){ msgEl.textContent = e.message || 'Nu s-a putut salva mașina.'; }
        }
      });
    }

    const addAirportForm = document.getElementById('addAirportForm');
    if(addAirportForm){
      addAirportForm.addEventListener('submit', async (ev)=>{
        ev.preventDefault();
        const form = ev.target;
        const body = {
          code: form.code.value.trim(),
          name: form.name.value.trim(),
          city: form.city.value.trim() || null,
          country: form.country.value.trim() || null,
          timezone: form.timezone.value.trim() || null
        };
        const msgEl = document.getElementById('addAirportMessage');
        if(msgEl){ msgEl.textContent = ''; }
        try{
          await apiRequest('/airports', { method:'POST', body: body });
          if(msgEl){ msgEl.textContent = 'Aeroportul a fost salvat.'; }
          form.reset();
          loadAirports();
        }catch(e){
          console.error(e);
          if(msgEl){ msgEl.textContent = e.message || 'Nu s-a putut salva aeroportul.'; }
        }
      });
    }

    const addPartnerForm = document.getElementById('addPartnerForm');
    if(addPartnerForm){
      addPartnerForm.addEventListener('submit', async (ev)=>{
        ev.preventDefault();
        const form = ev.target;
        const body = {
          name: form.name.value.trim(),
          apiEndpoint: form.apiEndpoint.value.trim() || null,
          apiKey: form.apiKey.value.trim() || null
        };
        const msgEl = document.getElementById('addPartnerMessage');
        if(msgEl){ msgEl.textContent = ''; }
        try{
          await apiRequest('/partners', { method:'POST', body: body });
          if(msgEl){ msgEl.textContent = 'Partenerul a fost salvat.'; }
          form.reset();
          loadPartners();
        }catch(e){
          console.error(e);
          if(msgEl){ msgEl.textContent = e.message || 'Nu s-a putut salva partenerul.'; }
        }
      });
    }

    const pricingCarSelect = document.getElementById('pricingCarSelect');
    if(pricingCarSelect){
      pricingCarSelect.addEventListener('change', loadPricingRules);
    }

    const addPricingForm = document.getElementById('addPricingRuleForm');
    if(addPricingForm){
      addPricingForm.addEventListener('submit', async (ev)=>{
        ev.preventDefault();
        const form = ev.target;
        const body = {
          carId: form.carId.value,
          minDays: form.minDays.value ? Number(form.minDays.value) : null,
          maxDays: form.maxDays.value ? Number(form.maxDays.value) : null,
          baseDailyPrice: form.baseDailyPrice.value ? Number(form.baseDailyPrice.value) : null,
          seasonStart: form.seasonStart.value.trim() || null,
          seasonEnd: form.seasonEnd.value.trim() || null
        };
        const msgEl = document.getElementById('addPricingMessage');
        if(msgEl){ msgEl.textContent = ''; }
        try{
          await apiRequest('/pricing/rules', { method:'POST', body: body });
          if(msgEl){ msgEl.textContent = 'Regula de preț a fost salvată.'; }
          form.reset();
          loadPricingRules();
        }catch(e){
          console.error(e);
          if(msgEl){ msgEl.textContent = e.message || 'Nu s-a putut salva regula de preț.'; }
        }
      });
    }

    // auto-login dacă avem token valid
    (async ()=>{
      const token = getToken();
      if(!token){
        showLogin();
        updateAdminUserLabel();
        return;
      }
      try{
        const me = await apiRequest('/auth/me', {});
        if(!me || me.role !== 'admin'){
          setToken('', null);
          showLogin();
        }else{
          setToken(token, me);
          updateAdminUserLabel();
          showDashboard();
        }
      }catch(e){
        console.warn('Token invalid, se revine la login');
        setToken('', null);
        showLogin();
        updateAdminUserLabel();
      }
    })();
  });
})();
