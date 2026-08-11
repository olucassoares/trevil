"use client";

import {
  Archive, ArrowUpRight, BarChart3, Bell, Box, CheckCircle2, CircleDollarSign,
  ChevronRight, Download, FileSpreadsheet, History, Loader2, Mail, PackageCheck,
  Pencil, Plus, RotateCcw, Save, ShoppingBag, ShoppingCart, UserCog, UserPlus,
  Users, Warehouse, X,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

export type Order = { id: number; number: string; customerId: number; status: string; paymentStatus: string; totalCents: number; channel: string; createdAt: string; customer: string; itemCount: number };
export type Product = { id: number; sku: string; name: string; category: string; stock: number; reservedStock: number; reorderPoint: number; priceCents: number; status: string; createdAt: string };
export type Customer = { id: number; name: string; email: string; segment: string; totalSpentCents: number; orderCount: number; createdAt: string };
export type StockMovement = { id: number; productId: number; orderId: number | null; type: string; quantity: number; actor: string; createdAt: string; product: string; sku: string; orderNumber: string | null };
export type Channel = { channel: string; orders: number; revenueCents: number };
export type Trend = { day: string; revenueCents: number };
export type TopProduct = { name: string; sku: string; units: number; revenueCents: number };
export type Dashboard = {
  summary: { revenueCents: number; orderCount: number; averageTicketCents: number; ordersToday: number };
  orders: Order[]; inventory: Product[]; customers: Customer[]; channels: Channel[]; trend: Trend[]; topProducts: TopProduct[]; stockMovements: StockMovement[];
};
export type OrderDetail = { order: Order & { email: string }; items: Array<{ id: number; quantity: number; unitPriceCents: number; name: string; sku: string }>; events: Array<{ id: number; action: string; fromStatus: string | null; toStatus: string; actor: string; details: string; createdAt: string }> };
export type Session = { email: string; name: string; role: "admin" | "manager" | "viewer"; permissions: string[] };
export type ReportData = {
  period: number;
  summary: { revenueCents: number; orderCount: number; averageTicketCents: number; cancellationRate: number; fulfillmentRate: number; revenueGrowth: number };
  trend: Array<{ day: string; revenueCents: number; orders: number }>;
  statuses: Array<{ status: string; count: number; revenueCents: number }>;
  categories: Array<{ category: string; units: number; revenueCents: number }>;
  customers: Array<{ name: string; segment: string; orders: number; revenueCents: number }>;
  channels: Channel[];
  inventory: { stockValueCents: number; physicalUnits: number; reservedUnits: number; criticalProducts: number };
};
export type View = "overview" | "orders" | "products" | "customers" | "inventory" | "reports" | "settings";

export const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
export const statusCopy: Record<string, string> = { pending: "Pendente", paid: "Pago", processing: "Preparando", shipped: "Enviado", delivered: "Entregue", canceled: "Cancelado" };
export const channelCopy: Record<string, string> = { store: "Loja própria", marketplace: "Marketplace", social: "Social commerce" };
export const nextStatuses: Record<string, string[]> = { pending: ["paid", "canceled"], paid: ["processing", "canceled"], processing: ["shipped", "canceled"], shipped: ["delivered"], delivered: [], canceled: [] };
export const segmentCopy: Record<string, string> = { new: "Novo", returning: "Recorrente", vip: "VIP" };
export const movementCopy: Record<string, string> = { reserve: "Reserva", release: "Liberação", sale: "Saída por venda", restock: "Reposição" };
export const roleCopy = { admin: "Administrador", manager: "Gestor", viewer: "Leitor" };

export function currency(cents: number) { return money.format(Number(cents ?? 0) / 100); }

export function initials(value: string) {
  return value.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}
export function EmptyChart() {
  return <div className="chart-empty">Aguardando histórico de vendas</div>;
}

export function Toast({ message, close }: { message: string; close: () => void }) {
  return message ? <div className="commerce-toast"><CheckCircle2 size={15} />{message}<button aria-label="Fechar aviso" onClick={close}><X size={13} /></button></div> : null;
}

export function ProductsWorkspace({ data, query, refresh }: { data: Dashboard; query: string; refresh: () => Promise<void> }) {
  const [selected, setSelected] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const normalized = query.trim().toLowerCase();
  const products = data.inventory.filter((product) => !normalized || `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(normalized));

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = { name: form.get("name"), sku: form.get("sku"), category: form.get("category"), priceCents: Math.round(Number(form.get("price")) * 100), stock: Number(form.get("stock")), reorderPoint: Number(form.get("reorderPoint")), status: form.get("status") };
    const response = await fetch(selected ? `/api/products/${selected.id}` : "/api/products", { method: selected ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json() as { error?: string };
    if (response.ok) { setCreating(false); setSelected(null); setMessage(selected ? "Produto atualizado." : "Produto cadastrado com sucesso."); await refresh(); }
    else setMessage(result.error ?? "Não foi possível salvar o produto.");
    setSaving(false);
  }

  return <>
    <section className="catalog-stats"><article><Box size={18}/><span><small>Produtos cadastrados</small><strong>{data.inventory.length}</strong></span></article><article><CheckCircle2 size={18}/><span><small>Ativos</small><strong>{data.inventory.filter((item) => item.status === "active").length}</strong></span></article><article><Archive size={18}/><span><small>Arquivados</small><strong>{data.inventory.filter((item) => item.status === "archived").length}</strong></span></article><article><CircleDollarSign size={18}/><span><small>Valor em estoque</small><strong>{currency(data.inventory.reduce((sum, item) => sum + item.stock * item.priceCents, 0))}</strong></span></article></section>
    <section className="commerce-panel catalog-panel"><header><div><h2>Catálogo de produtos</h2><p>Preço, disponibilidade e ponto de reposição em uma única visão</p></div><button className="primary-commerce-action" onClick={() => setCreating(true)}><Plus size={14}/> Novo produto</button></header><div className="catalog-grid">{products.map((product) => { const available = product.stock - product.reservedStock; const critical = product.status === "active" && available <= product.reorderPoint; return <article className={product.status === "archived" ? "archived" : ""} key={product.id}><header><span><Box size={19}/></span><button aria-label={`Editar ${product.name}`} onClick={() => setSelected(product)}><Pencil size={14}/></button></header><small>{product.sku}</small><h3>{product.name}</h3><p>{product.category}</p><strong>{currency(product.priceCents)}</strong><div className="product-stock"><span><small>Disponível</small><b className={critical ? "critical" : ""}>{available}</b></span><span><small>Reservado</small><b>{product.reservedStock}</b></span><span><small>Total</small><b>{product.stock}</b></span></div><footer><span className={critical ? "critical-badge" : product.status === "archived" ? "archive-badge" : "healthy-badge"}>{product.status === "archived" ? "Arquivado" : critical ? "Repor estoque" : "Estoque saudável"}</span><small>Mín. {product.reorderPoint}</small></footer></article>; })}</div>{!products.length && <div className="empty-search">Nenhum produto encontrado.</div>}</section>
    <Toast message={message} close={() => setMessage("")} />
    {(creating || selected) && <><button className="commerce-modal-backdrop" aria-label="Fechar formulário" onClick={() => { setCreating(false); setSelected(null); }}/><div className="order-modal catalog-modal"><header><div><small>{selected ? "EDITAR PRODUTO" : "NOVO PRODUTO"}</small><h2>{selected ? selected.name : "Adicionar ao catálogo"}</h2><p>Dados comerciais e regras de disponibilidade.</p></div><button aria-label="Fechar" onClick={() => { setCreating(false); setSelected(null); }}><X size={17}/></button></header><form onSubmit={saveProduct}><label><span>Nome</span><input name="name" required minLength={2} defaultValue={selected?.name}/></label><label><span>SKU</span><input name="sku" required pattern="[A-Za-z0-9-]{3,24}" disabled={!!selected} defaultValue={selected?.sku} placeholder="CAM-ESS-006"/></label><label><span>Categoria</span><input name="category" required defaultValue={selected?.category} placeholder="Vestuário"/></label><label><span>Preço (R$)</span><input name="price" type="number" required min="0.01" step="0.01" defaultValue={selected ? selected.priceCents / 100 : ""}/></label><label><span>Ponto de reposição</span><input name="reorderPoint" type="number" required min="0" defaultValue={selected?.reorderPoint ?? 5}/></label>{!selected && <label><span>Estoque inicial</span><input name="stock" type="number" required min="0" defaultValue="0"/></label>}{selected && <label><span>Status</span><select name="status" defaultValue={selected.status}><option value="active">Ativo</option><option value="archived">Arquivado</option></select></label>}<footer><button type="button" onClick={() => { setCreating(false); setSelected(null); }}>Cancelar</button><button className="primary-commerce-action" disabled={saving}>{saving ? <Loader2 className="spin" size={14}/> : <Save size={14}/>} Salvar produto</button></footer></form></div></>}
  </>;
}

export function CustomersWorkspace({ data, query, refresh }: { data: Dashboard; query: string; refresh: () => Promise<void> }) {
  const [selected, setSelected] = useState<Customer | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const normalized = query.trim().toLowerCase();
  const customers = data.customers.filter((customer) => !normalized || `${customer.name} ${customer.email} ${segmentCopy[customer.segment]}`.toLowerCase().includes(normalized));

  async function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = { name: form.get("name"), email: form.get("email"), segment: form.get("segment") };
    const response = await fetch(selected ? `/api/customers/${selected.id}` : "/api/customers", { method: selected ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json() as { error?: string };
    if (response.ok) { setCreating(false); setSelected(null); setMessage(selected ? "Cliente atualizado." : "Cliente cadastrado com sucesso."); await refresh(); }
    else setMessage(result.error ?? "Não foi possível salvar o cliente.");
    setSaving(false);
  }

  return <>
    <section className="customer-segments">{["vip","returning","new"].map((segment) => <article key={segment}><span className={`segment-icon segment-${segment}`}><Users size={17}/></span><div><small>{segmentCopy[segment]}</small><strong>{data.customers.filter((customer) => customer.segment === segment).length}</strong><p>{segment === "vip" ? "Maior valor recorrente" : segment === "returning" ? "Já compraram novamente" : "Em fase de ativação"}</p></div></article>)}</section>
    <section className="commerce-panel customer-panel"><header><div><h2>Base de clientes</h2><p>Segmentação e histórico de relacionamento</p></div><button className="primary-commerce-action" onClick={() => setCreating(true)}><UserPlus size={14}/> Novo cliente</button></header><div className="orders-table-wrap management-table"><table><thead><tr><th>Cliente</th><th>Segmento</th><th>Pedidos</th><th>Receita</th><th>Desde</th><th/></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td><span className="customer customer-detail"><i>{initials(customer.name)}</i><span><strong>{customer.name}</strong><small><Mail size={11}/>{customer.email}</small></span></span></td><td><span className={`segment-badge segment-${customer.segment}`}>{segmentCopy[customer.segment]}</span></td><td><strong>{customer.orderCount}</strong></td><td><strong>{currency(customer.totalSpentCents)}</strong></td><td>{new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(new Date(customer.createdAt.replace(" ", "T") + "Z"))}</td><td><button className="table-icon-action" aria-label={`Editar ${customer.name}`} onClick={() => setSelected(customer)}><Pencil size={14}/></button></td></tr>)}</tbody></table>{!customers.length && <div className="empty-search">Nenhum cliente encontrado.</div>}</div></section>
    <Toast message={message} close={() => setMessage("")} />
    {(creating || selected) && <><button className="commerce-modal-backdrop" aria-label="Fechar formulário" onClick={() => { setCreating(false); setSelected(null); }}/><div className="order-modal customer-modal"><header><div><small>{selected ? "EDITAR CLIENTE" : "NOVO CLIENTE"}</small><h2>{selected ? selected.name : "Adicionar cliente"}</h2><p>Informações essenciais para vendas e segmentação.</p></div><button aria-label="Fechar" onClick={() => { setCreating(false); setSelected(null); }}><X size={17}/></button></header><form onSubmit={saveCustomer}><label><span>Nome completo</span><input name="name" required minLength={2} defaultValue={selected?.name}/></label><label><span>E-mail</span><input name="email" type="email" required defaultValue={selected?.email}/></label><label><span>Segmento</span><select name="segment" defaultValue={selected?.segment ?? "new"}><option value="new">Novo</option><option value="returning">Recorrente</option><option value="vip">VIP</option></select></label><footer><button type="button" onClick={() => { setCreating(false); setSelected(null); }}>Cancelar</button><button className="primary-commerce-action" disabled={saving}>{saving ? <Loader2 className="spin" size={14}/> : <Save size={14}/>} Salvar cliente</button></footer></form></div></>}
  </>;
}

export function InventoryWorkspace({ data, query, refresh }: { data: Dashboard; query: string; refresh: () => Promise<void> }) {
  const [restock, setRestock] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const normalized = query.trim().toLowerCase();
  const active = data.inventory.filter((item) => item.status === "active");
  const products = active.filter((product) => !normalized || `${product.name} ${product.sku}`.toLowerCase().includes(normalized));
  const low = active.filter((product) => product.stock - product.reservedStock <= product.reorderPoint);
  async function submitRestock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!restock) return; setSaving(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/inventory", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId: restock.id, quantity: Number(form.get("quantity")) }) });
    const result = await response.json() as { error?: string; message?: string };
    if (response.ok) { setRestock(null); setMessage(result.message ?? "Reposição registrada."); await refresh(); } else setMessage(result.error ?? "Não foi possível repor o estoque.");
    setSaving(false);
  }
  return <>
    <section className="inventory-summary"><article><Warehouse size={19}/><div><small>Unidades físicas</small><strong>{active.reduce((sum, item) => sum + item.stock, 0)}</strong></div></article><art