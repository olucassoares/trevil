"use client";

import {
  ArrowDownRight, BarChart3, Bell, Box, ChevronRight,
  CircleDollarSign, CreditCard, LayoutDashboard,
  Menu, PackageCheck,
  Search, Settings, ShoppingBag, ShoppingCart, Store, Truck,
  Users, X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OperationBrief } from "../components/OperationBrief";
import { TrevilMark } from "../components/TrevilMark";
import { formatStoredDate } from "../lib/dates.mjs";
import {
  CustomersWorkspace,
  EmptyChart,
  InventoryWorkspace,
  OrdersWorkspace,
  ProductsWorkspace,
  ReportsWorkspace,
  SettingsWorkspace,
  channelCopy,
  currency,
  date,
  initials,
  roleCopy,
  statusCopy,
  type Dashboard,
  type Session,
  type View,
} from "../components/Workspaces";
import { summarizeOperation } from "../lib/operations-view";

const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });

export default function Home() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("overview");
  const searchRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setError("");
    await fetch("/api/dashboard", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao carregar");
        return response.json() as Promise<Dashboard>;
      })
      .then(setData)
      .catch(() => setError("Não foi possível carregar os dados da operação."));
  }, []);

  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao carregar");
        return response.json() as Promise<Dashboard>;
      })
      .then(setData)
      .catch(() => setError("Não foi possível carregar os dados da operação."));
    fetch("/api/session", { cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<Session> : null).then((result) => { if (result) setSession(result); });
  }, []);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", focusSearch);
    return () => document.removeEventListener("keydown", focusSearch);
  }, []);

  function openView(next: View) { setView(next); setMenuOpen(false); setQuery(""); }

  const filteredOrders = useMemo(() => {
    if (!data) return [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data.orders;
    return data.orders.filter((order) => `${order.number} ${order.customer} ${statusCopy[order.status]}`.toLowerCase().includes(normalized));
  }, [data, query]);

  const chart = useMemo(() => {
    if (!data?.trend.length) return null;
    const values = data.trend.map((point) => Number(point.revenueCents));
    const max = Math.max(...values, 1);
    const points = values.map((value, index) => {
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
      const y = 86 - (value / max) * 66;
      return `${x},${y}`;
    }).join(" ");
    return { points, max };
  }, [data]);

  const { lowStock, activeOrderCount, packingCount, shippedCount } = summarizeOperation(data?.orders ?? [], data?.inventory ?? []);
  const viewCopy: Record<View, { crumb: string; title: string; subtitle: string; search: string }> = {
    overview: { crumb: "FILA OPERACIONAL", title: "Operação de hoje", subtitle: `${activeOrderCount} pedidos em andamento · ${lowStock.length} ${lowStock.length === 1 ? "produto exige" : "produtos exigem"} reposição.`, search: "Buscar pedido ou cliente..." },
    orders: { crumb: "PEDIDOS", title: "Gestão de pedidos", subtitle: "Acompanhe o workflow e preserve a consistência do estoque.", search: "Buscar em todos os pedidos..." },
    products: { crumb: "PRODUTOS", title: "Catálogo de produtos", subtitle: "Gerencie preços, categorias e disponibilidade comercial.", search: "Buscar produto, SKU ou categoria..." },
    customers: { crumb: "CLIENTES", title: "Relacionamento com clientes", subtitle: "Entenda recorrência, receita e segmentos da sua base.", search: "Buscar cliente, e-mail ou segmento..." },
    inventory: { crumb: "ESTOQUE", title: "Controle de estoque", subtitle: "Mantenha saldos confiáveis e rastreie cada movimentação.", search: "Buscar produto ou SKU..." },
    reports: { crumb: "RELATÓRIOS", title: "Desempenho comercial", subtitle: "Compare receita, pedidos, canais e estoque por período.", search: "Os relatórios usam todos os dados..." },
    settings: { crumb: "CONFIGURAÇÕES", title: "Acesso e permissões", subtitle: "Controle responsabilidades com autorização por função.", search: "Configurações de segurança..." },
  };

  return (
    <main className="commerce-shell">
      <a className="skip-link" href="#commerce-content">Pular para o conteúdo</a>
      <aside className={`commerce-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="commerce-brand"><span><TrevilMark /></span><div><strong>Trevil</strong><small>Ateliê Norte · operações</small></div><button aria-label="Fechar menu" onClick={() => setMenuOpen(false)}><X size={17} /></button></div>
        <nav>
          <p>OPERAÇÃO</p>
          <button className={view === "overview" ? "active" : ""} onClick={() => openView("overview")}><LayoutDashboard size={17} /> Visão geral</button>
          <button className={view === "orders" ? "active" : ""} onClick={() => openView("orders")}><ShoppingCart size={17} /> Pedidos <span>{data?.summary.ordersToday ?? 0}</span></button>
          <button className={view === "products" ? "active" : ""} onClick={() => openView("products")}><Box size={17} /> Produtos</button>
          <button className={view === "customers" ? "active" : ""} onClick={() => openView("customers")}><Users size={17} /> Clientes</button>
          <p>GESTÃO</p>
          <button className={view === "inventory" ? "active" : ""} onClick={() => openView("inventory")}><PackageCheck size={17} /> Estoque <em>{lowStock.length}</em></button>
          <button><Truck size={17} /> Entregas</button>
          <button className={view === "reports" ? "active" : ""} onClick={() => openView("reports")}><BarChart3 size={17} /> Relatórios</button>
          <p>SISTEMA</p>
          <button className={view === "settings" ? "active" : ""} onClick={() => openView("settings")}><Settings size={17} /> Configurações</button>
        </nav>
        <div className="upgrade-card"><PackageCheck size={17} /><strong>Foco do turno</strong><p>{packingCount ? `${packingCount} ${packingCount === 1 ? "pedido aguarda" : "pedidos aguardam"} separação.` : "Nenhum pedido aguardando separação."}</p><i><span style={{width:`${Math.min(100,Math.max(12,activeOrderCount*12))}%`}} /></i><small>Ateliê Norte · base demonstrativa</small></div>
        <div className="commerce-user"><div>{initials(session?.name ?? "Lucas Soares")}</div><span><strong>{session?.name ?? "Lucas Soares"}</strong><small>{session ? roleCopy[session.role] : "Verificando acesso"}</small></span><ChevronRight size={15} /></div>
      </aside>

      {menuOpen && <button className="mobile-backdrop" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}

      <section className="commerce-workspace">
        <header className="commerce-topbar">
          <button className="mobile-trigger" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}><Menu size={18} /></button>
          <label className="global-search"><Search size={16} /><input ref={searchRef} aria-label="Busca global" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={viewCopy[view].search} /><kbd>⌘ K</kbd></label>
          <div className="top-actions"><span className="sync-status"><i /> Atualizado nesta sessão</span><button aria-label="Notificações"><Bell size={17} /><i /></button><div className="avatar">LS</div></div>
        </header>

        <div className="commerce-content" id="commerce-content">
          <section className="welcome-row"><div><p>ATELIÊ NORTE / {viewCopy[view].crumb}</p><h1>{viewCopy[view].title}</h1><span>{viewCopy[view].subtitle}</span></div><div className="date-chip"><Store size={16} /><span><strong>Ateliê Norte</strong><small>Moda autoral · BRL</small></span></div></section>

          {!data && !error && <div className="loading-state"><span /><strong>Organizando sua operação...</strong></div>}
          {error && <div className="error-state"><strong>{error}</strong><button onClick={() => location.reload()}>Tentar novamente</button></div>}

          {data && view === "overview" && <>
            <section className="commerce-metrics">
              <article className="metric-card revenue"><header><span><CircleDollarSign size={17} /></span><small>RECEITA LÍQUIDA</small><em>7 dias</em></header><strong>{currency(data.summary.revenueCents)}</strong><footer><span className="positive">{data.summary.orderCount} pedidos</span><small>pagamentos confirmados</small></footer></article>
              <article className="metric-card"><header><span><ShoppingBag size={17} /></span><small>PEDIDOS</small></header><strong>{data.summary.orderCount}</strong><footer><span className="positive">{data.summary.ordersToday} hoje</span><small>{activeOrderCount} ainda no fluxo</small></footer></article>
              <article className="metric-card"><header><span><CreditCard size={17} /></span><small>TICKET MÉDIO</small></header><strong>{currency(data.summary.averageTicketCents)}</strong><footer><span>Receita ÷ pedidos</span><small>valor calculado no período</small></footer></article>
              <article className="metric-card stock"><header><span><Box size={17} /></span><small>ESTOQUE CRÍTICO</small></header><strong>{lowStock.length}<b> itens</b></strong><footer><span className={lowStock.length ? "negative" : "positive"}>{lowStock.length ? <><ArrowDownRight size={13} /> Repor agora</> : <>Estoque saudável</>}</span><small>abaixo do ponto de pedido</small></footer></article>
            </section>

            <OperationBrief packingCount={packingCount} shippedCount={shippedCount} nextAction={lowStock[0] ? `Repor ${lowStock[0].name}` : "Revisar novos pedidos"} hasStockAlert={lowStock.length > 0} onOpen={() => openView(lowStock.length ? "inventory" : "orders")} />

            <section className="commerce-primary-grid">
              <article className="commerce-panel revenue-panel"><header><div><h2>Receita por dia</h2><p>Desempenho consolidado dos canais</p></div><span>Últimos 7 dias</span></header>
                {chart ? <div className="sales-chart"><div className="chart-scale"><span>{currency(chart.max)}</span><span>{currency(chart.max / 2)}</span><span>R$ 0</span></div><div className="chart-canvas"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7657ff" stopOpacity=".3"/><stop offset="1" stopColor="#7657ff" stopOpacity="0"/></linearGradient></defs><polygon points={`0,100 ${chart.points} 100,100`} fill="url(#salesFill)"/><polyline points={chart.points} fill="none" stroke="#7657ff" strokeWidth="2.2" vectorEffect="non-scaling-stroke"/></svg><div className="chart-days">{data.trend.map((point) => <span key={point.day}>{formatStoredDate(point.day, weekday).replace(".", "")}</span>)}</div></div></div> : <EmptyChart />}
              </article>

              <article className="commerce-panel channel-panel"><header><div><h2>Vendas por canal</h2><p>Participação na receita</p></div><BarChart3 size={17} /></header><div className="channel-list">{data.channels.map((channel, index) => { const share = (Number(channel.revenueCents) / Math.max(Number(data.summary.revenueCents), 1)) * 100; return <div key={channel.channel}><span className={`channel-icon channel-${index}`}><Store size={15} /></span><div><strong>{channelCopy[channel.channel]}</strong><small>{channel.orders} pedidos</small><i><span style={{ width: `${share}%` }} /></i></div><b>{share.toFixed(0)}%</b></div>; })}</div></article>
            </section>

            <section className="commerce-secondary-grid">
              <article className="commerce-panel orders-panel"><header><div><h2>Pedidos recentes</h2><p>Atualizações mais recentes da operação</p></div><button onClick={() => openView("orders")}>Ver todos <ChevronRight size={14} /></button></header><div className="orders-table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Status</th><th>Canal</th><th>Data</th><th>Total</th></tr></thead><tbody>{filteredOrders.slice(0, 6).map((order) => <tr key={order.id}><td><strong>{order.number}</strong><small>{order.itemCount} {order.itemCount === 1 ? "item" : "itens"}</small></td><td><span className="customer"><i>{initials(order.customer)}</i>{order.customer}</span></td><td><span className={`order-status status-${order.status}`}>{statusCopy[order.status]}</span></td><td>{channelCopy[order.channel]}</td><td>{formatStoredDate(order.createdAt, date)}</td><td><strong>{currency(order.totalCents)}</strong></td></tr>)}</tbody></table>{filteredOrders.length === 0 && <div className="empty-search">Nenhum pedido encontrado para “{query}”.</div>}</div></article>

              <aside className="side-stack">
                <article className="commerce-panel stock-panel"><header><div><h2>Alerta de estoque</h2><p>Produtos que precisam de atenção</p></div><span>{lowStock.length}</span></header><div>{lowStock.slice(0, 3).map((product) => { const available = product.stock - product.reservedStock; return <button key={product.id}><span><Box size={16} /></span><div><strong>{product.name}</strong><small>{product.sku}</small></div><b>{available}<small> disp.</small></b><ChevronRight size={14} /></button>; })}</div></article>
                <article className="commerce-panel top-products"><header><div><h2>Mais vendidos</h2><p>Ranking por unidades</p></div></header><div>{data.topProducts.slice(0, 3).map((product, index) => <div key={product.sku}><span>{index + 1}</span><div><strong>{product.name}</strong><small>{product.units} unidades</small></div><b>{currency(product.revenueCents)}</b></div>)}</div></article>
              </aside>
            </section>
          </>}
          {data && view === "orders" && <OrdersWorkspace data={data} query={query} refresh={loadData} />}
          {data && view === "products" && <ProductsWorkspace data={data} query={query} refresh={loadData} />}
          {data && view === "customers" && <CustomersWorkspace data={data} query={query} refresh={loadData} />}
          {data && view === "inventory" && <InventoryWorkspace data={data} query={query} refresh={loadData} />}
          {view === "reports" && <ReportsWorkspace />}
          {view === "settings" && <SettingsWorkspace session={session} />}
        </div>
      </section>
    </main>
  );
}
