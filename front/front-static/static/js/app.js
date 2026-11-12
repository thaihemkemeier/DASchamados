'use strict';

/* ================= Constantes ================= */
const STATUS = {
  ABERTO: 'Aberto', EM_ATENDIMENTO: 'Em atendimento',
  AGUARDANDO_CLIENTE: 'Aguardando cliente', FECHADO: 'Fechado'
};
const PRIORIDADE = { BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta', CRITICA: 'Crítica' };
const PERFIL = { ADMIN: 'Administrador', TECNICO: 'Técnico' };
// Espelha as transições permitidas no ChamadoService (backend)
const TRANSICOES = {
  ABERTO: ['EM_ATENDIMENTO', 'FECHADO'],
  EM_ATENDIMENTO: ['AGUARDANDO_CLIENTE', 'FECHADO'],
  AGUARDANDO_CLIENTE: ['EM_ATENDIMENTO', 'FECHADO'],
  FECHADO: []
};

/* ================= Utilitários ================= */
const $ = (sel, el = document) => el.querySelector(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtData = d => d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const badgeS = s => `<span class="badge s-${s}">${STATUS[s] || s}</span>`;
const badgeP = p => `<span class="badge p-${p}">${PRIORIDADE[p] || p}</span>`;
const opts = (obj, sel) => Object.entries(obj)
  .map(([k, v]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${v}</option>`).join('');

function toast(msg, erro = false) {
  const t = document.createElement('div');
  t.className = 'toast' + (erro ? ' err' : '');
  t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

class ApiError extends Error {
  constructor(status, body) {
    super((body && body.erro) || 'Erro ao comunicar com o servidor');
    this.status = status;
    this.detalhes = (body && body.detalhes) || [];
  }
}

async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(0, { erro: 'Não foi possível conectar ao servidor' });
  }
  if (res.status === 204) return null;
  let data = null;
  try { data = await res.json(); } catch { /* sem corpo */ }
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

const qs = params => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== '' && v != null) p.set(k, v); });
  const s = p.toString();
  return s ? '?' + s : '';
};

/* ================= Modal / formulários ================= */
function closeModal() { $('#modalRoot').innerHTML = ''; }

/**
 * Abre um modal com formulário.
 * fields: [{name,label,type,required,max,options,value,rows}]
 * onSubmit(valores) deve retornar uma Promise; erros da API aparecem no formulário.
 */
function formModal({ title, fields, submitLabel = 'Salvar', onSubmit }) {
  const html = fields.map(f => {
    const id = 'f_' + f.name;
    let input;
    if (f.type === 'select') {
      input = `<select id="${id}" name="${f.name}" ${f.required ? 'required' : ''}>
        ${f.placeholder ? `<option value="">${esc(f.placeholder)}</option>` : ''}
        ${f.options.map(o => `<option value="${esc(o.value)}" ${String(o.value) === String(f.value ?? '') ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
      </select>`;
    } else if (f.type === 'textarea') {
      input = `<textarea id="${id}" name="${f.name}" rows="${f.rows || 4}" ${f.required ? 'required' : ''} ${f.max ? `maxlength="${f.max}"` : ''}>${esc(f.value ?? '')}</textarea>`;
    } else {
      input = `<input id="${id}" name="${f.name}" type="${f.type || 'text'}" value="${esc(f.value ?? '')}" ${f.required ? 'required' : ''} ${f.max ? `maxlength="${f.max}"` : ''}>`;
    }
    return `<div class="field"><label for="${id}">${esc(f.label)}${f.required ? ' *' : ''}</label>${input}</div>`;
  }).join('');

  $('#modalRoot').innerHTML = `
    <div class="overlay"><form class="modal" novalidate>
      <h3>${esc(title)}</h3>
      <div id="formErr"></div>
      ${html}
      <div class="foot">
        <button type="button" class="btn" data-cancel>Cancelar</button>
        <button type="submit" class="btn primary">${esc(submitLabel)}</button>
      </div>
    </form></div>`;

  const form = $('#modalRoot form');
  const overlay = $('#modalRoot .overlay');
  overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeModal(); });
  $('[data-cancel]', form).onclick = closeModal;
  const first = form.querySelector('input,select,textarea');
  if (first) first.focus();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const valores = {};
    fields.forEach(f => {
      let v = form.elements[f.name].value.trim();
      if (f.type === 'select' && f.numeric && v !== '') v = Number(v);
      valores[f.name] = v;
    });
    const btn = $('button[type=submit]', form);
    btn.disabled = true;
    try {
      await onSubmit(valores);
      closeModal();
    } catch (err) {
      $('#formErr').innerHTML = `<div class="form-error">${esc(err.message)}
        ${err.detalhes?.length ? `<ul>${err.detalhes.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}</div>`;
      btn.disabled = false;
    }
  });
}

function confirmar(msg) { return window.confirm(msg); }

async function tentar(fn, okMsg) {
  try { const r = await fn(); if (okMsg) toast(okMsg); return r; }
  catch (err) { toast(err.message, true); return undefined; }
}

/* ================= Páginas ================= */
const view = () => $('#view');
function setPage(title, actionsHtml = '') {
  $('#pageTitle').textContent = title;
  $('#pageActions').innerHTML = actionsHtml;
}
const loading = () => { view().innerHTML = '<p class="muted">Carregando…</p>'; };
const failed = err => { view().innerHTML = `<div class="card"><div class="form-error">${esc(err.message)}</div></div>`; };

/* ---------- Painel ---------- */
async function pagePainel() {
  setPage('Painel');
  loading();
  try {
    const statuses = Object.keys(STATUS);
    const [totais, recentes] = await Promise.all([
      Promise.all(statuses.map(s => api('/chamados' + qs({ status: s, size: 1 })).then(r => r.totalElementos))),
      api('/chamados' + qs({ size: 5 }))
    ]);
    const cores = { ABERTO: 'var(--s-aberto)', EM_ATENDIMENTO: 'var(--s-atend)', AGUARDANDO_CLIENTE: 'var(--s-aguard)', FECHADO: 'var(--s-fechado)' };
    view().innerHTML = `
      <div class="grid stats">
        ${statuses.map((s, i) => `<div class="stat" style="--c:${cores[s]}" data-status="${s}">
          <div class="n">${totais[i]}</div><div class="l">${STATUS[s]}</div></div>`).join('')}
      </div>
      <div class="card"><h2>Chamados recentes</h2>
        ${tabelaChamados(recentes.conteudo)}
      </div>`;
    view().querySelectorAll('.stat').forEach(el =>
      el.onclick = () => { location.hash = '#/chamados?status=' + el.dataset.status; });
    bindLinhasChamado();
  } catch (err) { failed(err); }
}

function tabelaChamados(lista) {
  if (!lista.length) return '<div class="empty">Nenhum chamado encontrado.</div>';
  return `<div class="table-wrap"><table>
    <thead><tr><th>#</th><th>Título</th><th>Cliente</th><th>Prioridade</th><th>Status</th><th>Técnico</th><th>Abertura</th></tr></thead>
    <tbody>${lista.map(c => `<tr class="click" data-id="${c.id}">
      <td>${c.id}</td><td>${esc(c.titulo)}</td><td>${esc(c.clienteNome)}</td>
      <td>${badgeP(c.prioridade)}</td><td>${badgeS(c.status)}</td>
      <td>${esc(c.tecnicoNome) || '<span class="muted">—</span>'}</td><td>${fmtData(c.dataAbertura)}</td>
    </tr>`).join('')}</tbody></table></div>`;
}
function bindLinhasChamado() {
  view().querySelectorAll('tr.click').forEach(tr =>
    tr.onclick = () => { location.hash = '#/chamados/' + tr.dataset.id; });
}

/* ---------- Lista de chamados ---------- */
async function pageChamados(params) {
  setPage('Chamados', '<button class="btn primary" id="novo">+ Novo chamado</button>');
  $('#novo').onclick = novoChamado;
  const f = { status: params.get('status') || '', prioridade: params.get('prioridade') || '',
              clienteId: params.get('clienteId') || '', page: Number(params.get('page') || 0) };
  loading();
  try {
    const [clientes, dados] = await Promise.all([
      api('/clientes'),
      api('/chamados' + qs({ ...f, size: 10 }))
    ]);
    const go = patch => {
      const n = { ...f, page: 0, ...patch };
      location.hash = '#/chamados' + qs(n);
    };
    view().innerHTML = `
      <div class="filters">
        <select id="fStatus"><option value="">Todos os status</option>${opts(STATUS, f.status)}</select>
        <select id="fPrio"><option value="">Todas as prioridades</option>${opts(PRIORIDADE, f.prioridade)}</select>
        <select id="fCli"><option value="">Todos os clientes</option>
          ${clientes.map(c => `<option value="${c.id}" ${String(c.id) === f.clienteId ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}
        </select>
      </div>
      <div class="card">${tabelaChamados(dados.conteudo)}
        <div class="pager">
          <span>${dados.totalElementos} chamado(s) — página ${dados.totalPaginas ? dados.pagina + 1 : 0} de ${dados.totalPaginas}</span>
          <span class="row">
            <button class="btn sm" id="prev" ${dados.pagina <= 0 ? 'disabled' : ''}>← Anterior</button>
            <button class="btn sm" id="next" ${dados.pagina + 1 >= dados.totalPaginas ? 'disabled' : ''}>Próxima →</button>
          </span>
        </div>
      </div>`;
    $('#fStatus').onchange = e => go({ status: e.target.value });
    $('#fPrio').onchange = e => go({ prioridade: e.target.value });
    $('#fCli').onchange = e => go({ clienteId: e.target.value });
    $('#prev').onclick = () => go({ page: f.page - 1 });
    $('#next').onclick = () => go({ page: f.page + 1 });
    bindLinhasChamado();
  } catch (err) { failed(err); }
}

async function novoChamado() {
  const [clientes, categorias] = await tentar(() => Promise.all([api('/clientes'), api('/categorias')])) || [];
  if (!clientes) return;
  if (!clientes.length || !categorias.length) {
    toast('Cadastre ao menos um cliente e uma categoria antes de abrir chamados.', true);
    return;
  }
  formModal({
    title: 'Novo chamado', submitLabel: 'Abrir chamado',
    fields: [
      { name: 'titulo', label: 'Título', required: true, max: 120 },
      { name: 'descricao', label: 'Descrição', type: 'textarea', required: true, max: 1000 },
      { name: 'prioridade', label: 'Prioridade', type: 'select', required: true, value: 'MEDIA',
        options: Object.entries(PRIORIDADE).map(([value, label]) => ({ value, label })) },
      { name: 'clienteId', label: 'Cliente', type: 'select', required: true, numeric: true, placeholder: 'Selecione…',
        options: clientes.map(c => ({ value: c.id, label: c.nome })) },
      { name: 'categoriaId', label: 'Categoria', type: 'select', required: true, numeric: true, placeholder: 'Selecione…',
        options: categorias.map(c => ({ value: c.id, label: c.nome })) }
    ],
    onSubmit: async v => {
      const c = await api('/chamados', { method: 'POST', body: v });
      toast('Chamado aberto');
      location.hash = '#/chamados/' + c.id;
    }
  });
}

/* ---------- Detalhe do chamado ---------- */
async function pageChamado(id) {
  setPage('Chamado #' + id);
  loading();
  try {
    const c = await api('/chamados/' + id);
    const fechado = c.status === 'FECHADO';
    const prox = TRANSICOES[c.status];
    setPage('Chamado #' + c.id);
    view().innerHTML = `
      <a class="back" href="#/chamados">← Voltar</a>
      <div class="detail">
        <div>
          <div class="card">
            <div class="row" style="justify-content:space-between">
              <h2 style="margin:0">${esc(c.titulo)}</h2>
              <span class="row">${badgeP(c.prioridade)} ${badgeS(c.status)}</span>
            </div>
            <p class="desc">${esc(c.descricao)}</p>
            <div class="row">
              <button class="btn sm" id="editar" ${fechado ? 'disabled' : ''}>Editar</button>
              <button class="btn sm danger" id="excluir">Excluir</button>
            </div>
          </div>
          <div class="card">
            <h2>Comentários (${c.comentarios.length})</h2>
            ${c.comentarios.length ? c.comentarios.map(m => `
              <div class="comment"><span class="who">${esc(m.autor)}</span><span class="when">${fmtData(m.data)}</span>
              <div class="desc">${esc(m.texto)}</div></div>`).join('') : '<div class="muted">Nenhum comentário ainda.</div>'}
            <hr style="border:0;border-top:1px solid var(--border);margin:14px 0">
            <button class="btn" id="comentar">+ Adicionar comentário</button>
          </div>
        </div>
        <div>
          <div class="card">
            <h2>Detalhes</h2>
            <dl class="meta" style="margin:0">
              <dt>Cliente</dt><dd>${esc(c.clienteNome)}</dd>
              <dt>Categoria</dt><dd>${esc(c.categoriaNome)}</dd>
              <dt>Técnico</dt><dd>${esc(c.tecnicoNome) || '<span class="muted">Não atribuído</span>'}</dd>
              <dt>Aberto em</dt><dd>${fmtData(c.dataAbertura)}</dd>
              <dt>Fechado em</dt><dd>${fmtData(c.dataFechamento)}</dd>
            </dl>
            <button class="btn sm" id="atribuir" style="margin-top:12px" ${fechado ? 'disabled' : ''}>
              ${c.tecnicoId ? 'Reatribuir técnico' : 'Atribuir técnico'}</button>
          </div>
          <div class="card">
            <h2>Alterar status</h2>
            ${prox.length ? `<div class="row">${prox.map(s =>
              `<button class="btn sm ${s === 'FECHADO' ? 'danger' : ''}" data-status="${s}">${STATUS[s]}</button>`).join('')}</div>`
              : '<div class="muted">Chamado fechado — não pode mais ser alterado.</div>'}
          </div>
        </div>
      </div>`;

    view().querySelectorAll('[data-status]').forEach(b => b.onclick = async () => {
      const s = b.dataset.status;
      if (s === 'FECHADO' && !confirmar('Fechar este chamado? Depois disso ele não poderá mais ser alterado.')) return;
      if (await tentar(() => api(`/chamados/${id}/status`, { method: 'PATCH', body: { status: s } }), 'Status atualizado') !== undefined) route();
    });
    $('#excluir').onclick = async () => {
      if (!confirmar('Excluir este chamado e seus comentários?')) return;
      if (await tentar(() => api('/chamados/' + id, { method: 'DELETE' }), 'Chamado excluído') !== undefined) location.hash = '#/chamados';
    };
    $('#comentar').onclick = () => formModal({
      title: 'Novo comentário', submitLabel: 'Comentar',
      fields: [
        { name: 'autor', label: 'Autor', required: true, max: 100, value: localStorage.getItem('autor') || '' },
        { name: 'texto', label: 'Comentário', type: 'textarea', required: true, max: 1000 }
      ],
      onSubmit: async v => {
        await api(`/chamados/${id}/comentarios`, { method: 'POST', body: v });
        localStorage.setItem('autor', v.autor);
        toast('Comentário adicionado'); route();
      }
    });
    $('#atribuir').onclick = async () => {
      const tecnicos = await tentar(() => api('/tecnicos'));
      if (!tecnicos) return;
      if (!tecnicos.length) return toast('Cadastre um técnico primeiro.', true);
      formModal({
        title: 'Atribuir técnico',
        fields: [{ name: 'tecnicoId', label: 'Técnico', type: 'select', required: true, numeric: true, value: c.tecnicoId,
          placeholder: 'Selecione…', options: tecnicos.map(t => ({ value: t.id, label: `${t.nome} (${PERFIL[t.perfil]})` })) }],
        onSubmit: async v => {
          await api(`/chamados/${id}/atribuir`, { method: 'PATCH', body: v });
          toast('Técnico atribuído'); route();
        }
      });
    };
    $('#editar').onclick = async () => {
      const cats = await tentar(() => api('/categorias'));
      if (!cats) return;
      formModal({
        title: 'Editar chamado',
        fields: [
          { name: 'titulo', label: 'Título', required: true, max: 120, value: c.titulo },
          { name: 'descricao', label: 'Descrição', type: 'textarea', required: true, max: 1000, value: c.descricao },
          { name: 'prioridade', label: 'Prioridade', type: 'select', required: true, value: c.prioridade,
            options: Object.entries(PRIORIDADE).map(([value, label]) => ({ value, label })) },
          { name: 'categoriaId', label: 'Categoria', type: 'select', required: true, numeric: true, value: c.categoriaId,
            options: cats.map(x => ({ value: x.id, label: x.nome })) }
        ],
        onSubmit: async v => {
          await api('/chamados/' + id, { method: 'PUT', body: v });
          toast('Chamado atualizado'); route();
        }
      });
    };
  } catch (err) { failed(err); }
}

/* ---------- CRUD genérico (clientes, técnicos, categorias) ---------- */
function crudPage({ titulo, singular, endpoint, colunas, campos, extraAcoes }) {
  return async () => {
    setPage(titulo, `<button class="btn primary" id="novo">+ Novo ${singular}</button>`);
    loading();
    const carregar = async () => {
      try {
        const lista = await api(endpoint);
        view().innerHTML = `<div class="card">${lista.length ? `<div class="table-wrap"><table>
          <thead><tr>${colunas.map(c => `<th>${c.titulo}</th>`).join('')}<th></th></tr></thead>
          <tbody>${lista.map(r => `<tr>${colunas.map(c => `<td>${c.render ? c.render(r) : esc(r[c.campo]) || '<span class="muted">—</span>'}</td>`).join('')}
            <td class="actions">${extraAcoes ? extraAcoes(r) : ''}
              <button class="btn sm" data-edit="${r.id}">Editar</button>
              <button class="btn sm danger" data-del="${r.id}">Excluir</button></td></tr>`).join('')}
          </tbody></table></div>` : `<div class="empty">Nenhum ${singular} cadastrado.</div>`}</div>`;
        view().querySelectorAll('[data-edit]').forEach(b => b.onclick = () =>
          abrir(lista.find(r => String(r.id) === b.dataset.edit)));
        view().querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
          if (!confirmar(`Excluir este ${singular}?`)) return;
          if (await tentar(() => api(`${endpoint}/${b.dataset.del}`, { method: 'DELETE' }), `${singular[0].toUpperCase() + singular.slice(1)} excluído`) !== undefined) carregar();
        });
      } catch (err) { failed(err); }
    };
    const abrir = reg => formModal({
      title: reg ? `Editar ${singular}` : `Novo ${singular}`,
      fields: campos.map(f => ({ ...f, value: reg ? reg[f.name] : f.value })),
      onSubmit: async v => {
        await api(reg ? `${endpoint}/${reg.id}` : endpoint, { method: reg ? 'PUT' : 'POST', body: v });
        toast('Salvo com sucesso'); carregar();
      }
    });
    $('#novo').onclick = () => abrir(null);
    carregar();
  };
}

const pageClientes = crudPage({
  titulo: 'Clientes', singular: 'cliente', endpoint: '/clientes',
  colunas: [{ titulo: 'Nome', campo: 'nome' }, { titulo: 'E-mail', campo: 'email' }, { titulo: 'Telefone', campo: 'telefone' }],
  campos: [
    { name: 'nome', label: 'Nome', required: true, max: 100 },
    { name: 'email', label: 'E-mail', type: 'email', required: true },
    { name: 'telefone', label: 'Telefone', max: 20 }
  ],
  extraAcoes: r => `<a class="btn sm" href="#/chamados?clienteId=${r.id}">Chamados</a>`
});

const pageTecnicos = crudPage({
  titulo: 'Técnicos', singular: 'técnico', endpoint: '/tecnicos',
  colunas: [{ titulo: 'Nome', campo: 'nome' }, { titulo: 'E-mail', campo: 'email' },
            { titulo: 'Perfil', render: r => PERFIL[r.perfil] || r.perfil }],
  campos: [
    { name: 'nome', label: 'Nome', required: true, max: 100 },
    { name: 'email', label: 'E-mail', type: 'email', required: true, max: 120 },
    { name: 'perfil', label: 'Perfil', type: 'select', required: true, value: 'TECNICO',
      options: Object.entries(PERFIL).map(([value, label]) => ({ value, label })) }
  ]
});

const pageCategorias = crudPage({
  titulo: 'Categorias', singular: 'categoria', endpoint: '/categorias',
  colunas: [{ titulo: 'Nome', campo: 'nome' }, { titulo: 'Descrição', campo: 'descricao' }],
  campos: [
    { name: 'nome', label: 'Nome', required: true, max: 100 },
    { name: 'descricao', label: 'Descrição', type: 'textarea', rows: 3, max: 255 }
  ]
});

/* ================= Roteador ================= */
function route() {
  closeModal();
  const hash = location.hash.replace(/^#/, '') || '/';
  const [path, query] = hash.split('?');
  const params = new URLSearchParams(query || '');
  const partes = path.split('/').filter(Boolean);
  const base = partes[0] || '';

  document.querySelectorAll('.sidebar nav a').forEach(a =>
    a.classList.toggle('active', a.dataset.route === base));
  $('#sidebar').classList.remove('open');

  if (base === '') return pagePainel();
  if (base === 'chamados') return partes[1] ? pageChamado(partes[1]) : pageChamados(params);
  if (base === 'clientes') return pageClientes();
  if (base === 'tecnicos') return pageTecnicos();
  if (base === 'categorias') return pageCategorias();
  setPage('Página não encontrada');
  view().innerHTML = '<div class="empty">Página não encontrada. <a href="#/">Voltar ao painel</a></div>';
}

window.addEventListener('hashchange', route);
$('#menuBtn').onclick = () => $('#sidebar').classList.toggle('open');
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
route();
