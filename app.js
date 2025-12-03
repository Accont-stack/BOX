/* ==================================================
   THE BOX - FRONTEND CONECTADO AO BACKEND
   ================================================== */

// 🔌 CONFIGURAÇÃO DA API
const API_URL = 'https://the-box-backend.vercel.app/api';
const STRIPE_PUBLIC_KEY = 'pk_test_51Sa74IAxkPjZykOAuTlrYocchOIZqGGrkysyNfEKDarzINyE1xWci1APkx9aN57uWE9mtKE9GgftIkwb3RmLUnYU004HX8SWFy';
let accessToken = null;
let refreshToken = null;
let stripe = null;

// Inicializar Stripe quando página carrega
if (window.Stripe) {
  stripe = Stripe(STRIPE_PUBLIC_KEY);
}

/* ==================================================
   UTILITÁRIOS
   ================================================== */
function showConfirm(message, onConfirm) {
  document.getElementById('modal-msg').textContent = message;
  document.getElementById('custom-modal').style.display = 'flex';
  const btn = document.getElementById('modal-confirm-btn');
  const newBtn = btn.cloneNode(true);
  newBtn.textContent = "Confirmar";
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.addEventListener('click', () => {
    closeModal();
    if (onConfirm) onConfirm();
  });
}

function showAlert(message) {
  document.getElementById('modal-msg').textContent = message;
  document.getElementById('custom-modal').style.display = 'flex';
  const btn = document.getElementById('modal-confirm-btn');
  const newBtn = btn.cloneNode(true);
  newBtn.textContent = "OK";
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.addEventListener('click', () => closeModal());
}

function closeModal() { 
  document.getElementById('custom-modal').style.display = 'none'; 
}

function showToast(msg) {
  const x = document.getElementById("toast");
  x.textContent = msg; 
  x.className = "show";
  setTimeout(() => x.className = x.className.replace("show", ""), 3000);
}

/* ==================================================
   GESTÃO DE DADOS & STATE
   ================================================== */
let currentUser = null;
let state = { tx: [], categories: [], recurring: [], licenseKey: null };

const DEFAULT_CATS = ['Combustível','Peças','Serviços','Marketing','Outros'];

function uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
function fmt(n) { return 'R$ ' + Number(n).toFixed(2).replace('.',','); }

/* ==================================================
   API CALLS - AUTENTICAÇÃO
   ================================================== */

// Registrar novo usuário
async function apiRegister(email, password, name) {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao registrar');
    }
    
    const data = await res.json();
    accessToken = data.tokens.accessToken;
    refreshToken = data.tokens.refreshToken;
    
    // Salvar tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    return data.user;
  } catch (error) {
    console.error('Erro registro:', error);
    throw error;
  }
}

// Fazer login
async function apiLogin(email, password) {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Email ou senha incorretos');
    }
    
    const data = await res.json();
    accessToken = data.tokens.accessToken;
    refreshToken = data.tokens.refreshToken;
    
    // Salvar tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    return data.user;
  } catch (error) {
    console.error('Erro login:', error);
    throw error;
  }
}

// Renovar token
async function apiRefreshToken() {
  try {
    const rt = localStorage.getItem('refreshToken');
    if (!rt) throw new Error('Refresh token não encontrado');
    
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt })
    });
    
    if (!res.ok) throw new Error('Falha ao renovar token');
    
    const data = await res.json();
    accessToken = data.accessToken;
    localStorage.setItem('accessToken', accessToken);
    
    return accessToken;
  } catch (error) {
    console.error('Erro refresh:', error);
    logout();
    throw error;
  }
}

/* ==================================================
   API CALLS - TRANSAÇÕES
   ================================================== */

// Listar transações
async function apiGetTransactions() {
  try {
    const res = await fetch(`${API_URL}/transactions`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (res.status === 401) {
      await apiRefreshToken();
      return apiGetTransactions();
    }
    
    if (!res.ok) throw new Error('Erro ao buscar transações');
    
    const data = await res.json();
    return data.transactions || [];
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return [];
  }
}

// Criar transação
async function apiCreateTransaction(tipo, categoria, descricao, valor, data) {
  try {
    const res = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: tipo,
        category: categoria,
        description: descricao,
        amount: valor,
        date: data,
        device_id: 'web-browser'
      })
    });
    
    if (res.status === 401) {
      await apiRefreshToken();
      return apiCreateTransaction(tipo, categoria, descricao, valor, data);
    }
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao criar transação');
    }
    
    const data2 = await res.json();
    return data2.transaction;
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    throw error;
  }
}

// Deletar transação
async function apiDeleteTransaction(id) {
  try {
    const res = await fetch(`${API_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (res.status === 401) {
      await apiRefreshToken();
      return apiDeleteTransaction(id);
    }
    
    if (!res.ok) throw new Error('Erro ao deletar transação');
    
    return true;
  } catch (error) {
    console.error('Erro ao deletar:', error);
    throw error;
  }
}

// Obter estatísticas
async function apiGetStats() {
  try {
    const res = await fetch(`${API_URL}/stats`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (res.status === 401) {
      await apiRefreshToken();
      return apiGetStats();
    }
    
    if (!res.ok) throw new Error('Erro ao buscar stats');
    
    return await res.json();
  } catch (error) {
    console.error('Erro stats:', error);
    return { totalIncome: 0, totalExpense: 0, balance: 0 };
  }
}

/* ==================================================
   UI - AUTENTICAÇÃO
   ================================================== */

function toggleAuth(view) {
  document.getElementById('login-view').style.display = view === 'login' ? 'block' : 'none';
  document.getElementById('register-view').style.display = view === 'register' ? 'block' : 'none';
}

function doLogin() {
  const email = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value.trim();
  
  if (!email || !password) {
    showAlert('Preencha email e senha');
    return;
  }
  
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = "Entrando...";
  
  apiLogin(email, password)
    .then(user => {
      setUser(user);
      btn.disabled = false;
      btn.textContent = "Entrar";
    })
    .catch(error => {
      showAlert(error.message);
      btn.disabled = false;
      btn.textContent = "Entrar";
    });
}

function doRegister() {
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPass').value;
  
  if (!email || !password) {
    showAlert('Preencha todos os campos');
    return;
  }
  
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = "Criando conta...";
  
  apiRegister(email, password, name)
    .then(user => {
      setUser(user);
      btn.disabled = false;
      btn.textContent = "Criar Conta";
    })
    .catch(error => {
      showAlert(error.message);
      btn.disabled = false;
      btn.textContent = "Criar Conta";
    });
}

function setUser(user) {
  currentUser = user;
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('app-content').style.display = 'block';
  document.getElementById('currentUserDisplay').textContent = `Logado: ${user.name || user.email}`;
  
  initApp();
}

function logout() {
  currentUser = null;
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  location.reload();
}

/* ==================================================
   CORE APP
   ================================================== */

function initApp() {
  document.getElementById('data').value = new Date().toISOString().slice(0,10);
  ensureDefaults();
  applyTheme();
  checkLicense();
  loadTransactions();
}

function ensureDefaults() {
  state.categories = DEFAULT_CATS;
  const opts = state.categories.map(c => `<option value="${c}">${c}</option>`).join('');
  document.getElementById('categoria').innerHTML = opts;
  document.getElementById('filtroCategoria').innerHTML = '<option value="">Todas</option>' + opts;
}

async function loadTransactions() {
  try {
    const transactions = await apiGetTransactions();
    state.tx = transactions;
    updateUI();
  } catch (error) {
    console.error('Erro ao carregar:', error);
  }
}

function updateUI() {
  renderTxList();
  renderChart();
  updateTotals();
}

function updateTotals() {
  const inc = state.tx.filter(t=>t.type==='income').reduce((a,b)=>a+b.amount,0);
  const exp = state.tx.filter(t=>t.type==='expense').reduce((a,b)=>a+b.amount,0);
  document.getElementById('saldo').textContent = fmt(inc - exp);
  document.getElementById('receitas').textContent = fmt(inc);
  document.getElementById('despesas').textContent = fmt(exp);
}

// ADICIONAR TRANSAÇÃO
document.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('addTx');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const tipo = document.getElementById('tipo').value;
      const cat = document.getElementById('categoria').value;
      const desc = document.getElementById('descricao').value.trim();
      const val = Number(document.getElementById('valor').value);
      const dt = document.getElementById('data').value;
      
      if (!val || val<=0) {
        showAlert('Valor inválido');
        return;
      }
      
      addBtn.disabled = true;
      addBtn.textContent = "Salvando...";
      
      apiCreateTransaction(tipo, cat, desc, val, dt)
        .then(tx => {
          state.tx.unshift(tx);
          document.getElementById('descricao').value = '';
          document.getElementById('valor').value = '';
          updateUI();
          showToast('✅ Transação salva!');
          addBtn.disabled = false;
          addBtn.textContent = "Adicionar";
        })
        .catch(error => {
          showAlert(error.message);
          addBtn.disabled = false;
          addBtn.textContent = "Adicionar";
        });
    });
  }
});

function deleteTx(id) {
  showConfirm('Apagar esta transação?', () => {
    apiDeleteTransaction(id)
      .then(() => {
        state.tx = state.tx.filter(t => t.id !== id);
        updateUI();
        showToast('✅ Deletado!');
      })
      .catch(error => showAlert(error.message));
  });
}

function renderTxList() {
  const el = document.getElementById('tx-list');
  if (!el) return;
  
  el.innerHTML = '';
  const fCat = document.getElementById('filtroCategoria')?.value || '';
  
  const list = state.tx.filter(t => {
    if(fCat && t.category !== fCat) return false;
    return true;
  }).sort((a,b) => b.date.localeCompare(a.date));

  list.forEach(t => {
    el.innerHTML += `
      <div class="tx">
        <div class="meta"><div><div style="font-weight:600">${t.description || 'Sem descrição'}</div><div class="small">${t.category} - ${t.date}</div></div></div>
        <div style="text-align:right">
          <div class="amount ${t.type}">${t.type==='income'?'+':'-'} ${fmt(t.amount)}</div>
          <div style="margin-top:4px"><button class="ghost" style="font-size:10px;padding:4px" onclick="deleteTx('${t.id}')">Del</button></div>
        </div>
      </div>`;
  });
}

function renderChart() {
  const cv = document.getElementById('chart');
  if (!cv) return;
  
  const ctx = cv.getContext('2d');
  ctx.clearRect(0,0,cv.width,cv.height);
  const sums = {}; 
  state.tx.filter(t=>t.type==='expense').forEach(t => sums[t.category] = (sums[t.category]||0) + t.amount);
  const data = Object.entries(sums).sort((a,b)=>b[1]-a[1]);
  if(!data.length) { ctx.fillStyle='#555'; ctx.fillText('Sem dados', 10,20); return; }
  let y=10; const max = data[0][1] || 1;
  data.forEach(([k,v], i) => {
    const w = (v/max) * (cv.width - 120);
    ctx.fillStyle = `hsl(${i*50}, 70%, 50%)`; ctx.fillRect(100, y, w, 20);
    ctx.fillStyle = '#fff'; ctx.fillText(k, 10, y+14); ctx.fillText(fmt(v), 100+w+5, y+14);
    y += 30;
  });
}

// FILTROS
document.addEventListener('DOMContentLoaded', () => {
  const filtroBtn = document.getElementById('aplicarFiltro');
  if (filtroBtn) {
    filtroBtn.addEventListener('click', () => {
      loadTransactions();
    });
  }
  
  const limparBtn = document.getElementById('limparFiltro');
  if (limparBtn) {
    limparBtn.addEventListener('click', () => {
      const filtro = document.getElementById('filtroCategoria');
      if (filtro) filtro.value = '';
      loadTransactions();
    });
  }
});

/* ==================================================
   PLANO & LICENÇA
   ================================================== */

function isPro() {
  return currentUser && currentUser.plan && currentUser.plan.includes('pro');
}

function checkLicense() {
  const proMenu = document.getElementById('proMenu');
  const demoBadge = document.getElementById('demoBadge');
  
  if (isPro()) {
    if (demoBadge) demoBadge.style.display = 'none';
    if (proMenu) proMenu.style.display = 'inline-flex';
    if (typeof initializeMicrophoneForPro === 'function') {
      initializeMicrophoneForPro();
    }
  } else {
    if (demoBadge) demoBadge.style.display = 'inline-block';
    if (proMenu) proMenu.style.display = 'none';
  }
}

/* ==================================================
   TEMA
   ================================================== */

function applyTheme() {
  const t = localStorage.getItem('boxmotors_theme');
  if(t === 'light') document.body.setAttribute('data-theme', 'light');
  else document.body.removeAttribute('data-theme');
}

function toggleTheme() {
  const c = localStorage.getItem('boxmotors_theme');
  const n = c === 'light' ? 'dark' : 'light';
  localStorage.setItem('boxmotors_theme', n);
  applyTheme();
}

/* ==================================================
   AUTO-LOGIN
   ================================================== */

window.addEventListener('load', () => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    accessToken = token;
    // Aqui você poderia fazer uma chamada para verificar token válido
    // Por enquanto, vamos só iniciar o app
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        currentUser = JSON.parse(userStr);
        setUser(currentUser);
      } catch (e) {
        console.error('Erro ao restaurar usuário:', e);
      }
    }
  }
});

// Salvar usuário quando faz login
function setUser(user) {
  currentUser = user;
  localStorage.setItem('currentUser', JSON.stringify(user));
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('app-content').style.display = 'block';
  document.getElementById('currentUserDisplay').textContent = `Logado: ${user.name || user.email}`;
  
  initApp();
}

/* ==================================================
   FUNÇÕES ADICIONAIS - INTEGRAÇÃO HTML
   ================================================== */

function doLogout() {
  logout();
}

function openLink() {
  // Função substituída por openCheckout abaixo
  openCheckout();
}

async function openCheckout(plan = 'monthly') {
  if (!stripe) {
    showAlert('Stripe não carregado. Recarregue a página.');
    return;
  }
  
  if (!accessToken) {
    showAlert('Faça login primeiro');
    return;
  }
  
  try {
    const btn = document.getElementById('buyBtn');
    btn.disabled = true;
    btn.textContent = 'Redirecionando...';
    
    // Chamar endpoint para criar sessão Stripe
    const res = await fetch(`${API_URL}/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ plan })
    });
    
    if (!res.ok) {
      throw new Error('Erro ao criar sessão');
    }
    
    const data = await res.json();
    
    // Redirecionar para Stripe Checkout
    if (data.sessionId) {
      const result = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      });
      
      if (result.error) {
        showAlert('Erro: ' + result.error.message);
      }
    }
    
    btn.disabled = false;
    btn.textContent = 'Comprar';
  } catch (error) {
    console.error('Erro checkout:', error);
    showAlert('Erro ao abrir checkout: ' + error.message);
    const btn = document.getElementById('buyBtn');
    btn.disabled = false;
    btn.textContent = 'Comprar';
  }
}

function activateLicense() {
  showAlert('Sua conta será atualizada automaticamente após pagamento na plataforma Stripe.');
}

function revokeLicense() {
  showConfirm('Desativar licença PRO?', () => {
    // Backend já gerencia isso
    currentUser.plan = 'free';
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    checkLicense();
    showToast('✅ Licença desativada');
  });
}

function resetSystemUsers() {
  showConfirm('Resetar TODOS os usuários do sistema? Isso apagará tudo!', () => {
    localStorage.clear();
    location.reload();
  });
}

function openCategories() {
  document.getElementById('cat-page').style.display = 'block';
  document.getElementById('cat-list').innerHTML = '';
  state.categories.forEach(cat => {
    document.getElementById('cat-list').innerHTML += `
      <div class="tx" style="margin-bottom:8px">
        <div>${cat}</div>
        <button class="ghost" onclick="removeCat('${cat}')" style="font-size:10px">Deletar</button>
      </div>`;
  });
}

function addCat() {
  const val = document.getElementById('newCatName').value.trim();
  if (!val) return;
  if (state.categories.includes(val)) {
    showAlert('Categoria já existe');
    return;
  }
  state.categories.push(val);
  document.getElementById('newCatName').value = '';
  const opts = state.categories.map(c => `<option value="${c}">${c}</option>`).join('');
  document.getElementById('categoria').innerHTML = opts;
  document.getElementById('filtroCategoria').innerHTML = '<option value="">Todas</option>' + opts;
  openCategories();
  showToast('✅ Categoria adicionada');
}

function removeCat(cat) {
  state.categories = state.categories.filter(c => c !== cat);
  openCategories();
  showToast('✅ Categoria removida');
}

function closePages() {
  document.getElementById('cat-page').style.display = 'none';
  document.getElementById('rec-page').style.display = 'none';
}

function openRecurring() {
  document.getElementById('rec-page').style.display = 'block';
  renderRecurring();
  updateRecMonthLabel();
}

let currentRecMonth = new Date();

function prevRecMonth() {
  currentRecMonth.setMonth(currentRecMonth.getMonth() - 1);
  updateRecMonthLabel();
  renderRecurring();
}

function nextRecMonth() {
  currentRecMonth.setMonth(currentRecMonth.getMonth() + 1);
  updateRecMonthLabel();
  renderRecurring();
}

function updateRecMonthLabel() {
  const mes = currentRecMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  document.getElementById('recMonthLabel').textContent = mes;
}

function renderRecurring() {
  const list = document.getElementById('rec-list');
  list.innerHTML = '';
  if (!state.recurring || state.recurring.length === 0) {
    list.innerHTML = '<div class="small">Nenhuma conta recorrente</div>';
    return;
  }
  state.recurring.forEach(rec => {
    list.innerHTML += `
      <div class="tx" style="margin-bottom:8px">
        <div>
          <strong>${rec.desc}</strong>
          <div class="small">${rec.dia}º - ${fmt(rec.valor)}</div>
        </div>
        <div style="text-align:right">
          <button class="ghost" onclick="editRec('${rec.id}')" style="font-size:10px">Editar</button>
          <button class="ghost" onclick="deleteRec('${rec.id}')" style="font-size:10px; border-color:#c8102e; color:#c8102e">Del</button>
        </div>
      </div>`;
  });
}

function saveRecurring() {
  const desc = document.getElementById('recDesc').value.trim();
  const valor = Number(document.getElementById('recValor').value);
  const dia = Number(document.getElementById('recDia').value);
  
  if (!desc || !valor || !dia) {
    showAlert('Preencha todos os campos');
    return;
  }
  
  const editId = document.getElementById('recEditId').value;
  if (editId) {
    const rec = state.recurring.find(r => r.id === editId);
    if (rec) {
      rec.desc = desc;
      rec.valor = valor;
      rec.dia = dia;
    }
  } else {
    state.recurring.push({ id: uid(), desc, valor, dia });
  }
  
  resetRecForm();
  renderRecurring();
  showToast('✅ Recorrente salva');
}

function resetRecForm() {
  document.getElementById('recDesc').value = '';
  document.getElementById('recValor').value = '';
  document.getElementById('recDia').value = '';
  document.getElementById('recEditId').value = '';
  document.getElementById('btnSaveRec').textContent = 'Salvar Regra';
  document.getElementById('btnSaveRec').style.display = 'inline-block';
  document.getElementById('btnCancelRec').style.display = 'none';
}

function editRec(id) {
  const rec = state.recurring.find(r => r.id === id);
  if (!rec) return;
  
  document.getElementById('recDesc').value = rec.desc;
  document.getElementById('recValor').value = rec.valor;
  document.getElementById('recDia').value = rec.dia;
  document.getElementById('recEditId').value = id;
  document.getElementById('btnSaveRec').textContent = 'Salvar Edição';
  document.getElementById('btnCancelRec').style.display = 'inline-block';
}

function deleteRec(id) {
  showConfirm('Apagar esta recorrente?', () => {
    state.recurring = state.recurring.filter(r => r.id !== id);
    renderRecurring();
    showToast('✅ Recorrente apagada');
  });
}

function toggleBackupMenu() {
  const menu = document.getElementById('backupMenu');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  
  if (!document.getElementById('exportJson').onClickListener) {
    document.getElementById('exportJson').addEventListener('click', () => {
      const backup = { tx: state.tx, categories: state.categories, recurring: state.recurring };
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `box-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
    document.getElementById('exportJson').onClickListener = true;
  }
  
  if (!document.getElementById('exportCsv').onClickListener) {
    document.getElementById('exportCsv').addEventListener('click', () => {
      let csv = 'Data,Tipo,Categoria,Descrição,Valor\n';
      state.tx.forEach(t => {
        csv += `${t.date},${t.type},${t.category},"${t.description}",${t.amount}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `box-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
    document.getElementById('exportCsv').onClickListener = true;
  }
  
  if (!document.getElementById('resetAll').onClickListener) {
    document.getElementById('resetAll').addEventListener('click', () => {
      showConfirm('Apagar TODAS as transações?', () => {
        state.tx = [];
        updateUI();
        showToast('✅ Dados apagados');
      });
    });
    document.getElementById('resetAll').onClickListener = true;
  }
}

function processRestore(input) {
  const file = input.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const backup = JSON.parse(e.target.result);
      state.tx = backup.tx || [];
      state.categories = backup.categories || [];
      state.recurring = backup.recurring || [];
      updateUI();
      showToast('✅ Backup restaurado com sucesso!');
    } catch (error) {
      showAlert('Erro ao restaurar: ' + error.message);
    }
  };
  reader.readAsText(file);
}

function cancelEdit() {
  document.getElementById('editingId').value = '';
  document.getElementById('addTx').style.display = 'inline-block';
  document.getElementById('updateTx').style.display = 'none';
  document.getElementById('cancelEdit').style.display = 'none';
  document.getElementById('descricao').value = '';
  document.getElementById('valor').value = '';
}
