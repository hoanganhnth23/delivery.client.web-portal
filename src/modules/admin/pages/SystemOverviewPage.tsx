import { useMemo, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  getSystemNode,
  ORDER_FLOW,
  SYSTEM_NODES,
  SYSTEM_PRINCIPLES,
  type SystemNode,
  type SystemNodeStatus,
} from '../data/systemOverviewData';

type ViewMode = 'MAP' | 'FLOW' | 'SERVICES';
type MapFilter = 'ALL' | 'CLIENT' | 'BACKEND' | 'INFRASTRUCTURE' | 'HIDDEN';
type ServiceFilter = 'ALL' | 'ACTIVE' | 'HIDDEN';

const viewTabs: Array<{ id: ViewMode; label: string; icon: string }> = [
  { id: 'MAP', label: 'Bản đồ hệ thống', icon: 'account_tree' },
  { id: 'FLOW', label: 'Luồng đặt hàng', icon: 'route' },
  { id: 'SERVICES', label: 'Service catalog', icon: 'view_list' },
];

const mapFilters: Array<{ id: MapFilter; label: string }> = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'CLIENT', label: 'Client' },
  { id: 'BACKEND', label: 'Backend' },
  { id: 'INFRASTRUCTURE', label: 'Hạ tầng' },
  { id: 'HIDDEN', label: 'Hidden/Off' },
];

const serviceFilters: Array<{ id: ServiceFilter; label: string }> = [
  { id: 'ALL', label: 'Tất cả service' },
  { id: 'ACTIVE', label: 'Đang dùng' },
  { id: 'HIDDEN', label: 'Hidden/Off' },
];

const statusMeta: Record<
  SystemNodeStatus,
  { label: string; className: string; dotClassName: string }
> = {
  active: {
    label: 'MVP active',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    dotClassName: 'bg-emerald-500',
  },
  hidden: {
    label: 'Hidden / Off',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    dotClassName: 'bg-slate-400',
  },
  private: {
    label: 'Private',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    dotClassName: 'bg-blue-500',
  },
  'test-only': {
    label: 'Test only',
    className: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    dotClassName: 'bg-violet-500',
  },
};

const serviceGroupOrder = ['Identity', 'Commerce', 'Fulfilment', 'Realtime', 'Finance', 'Supporting', 'Gated capabilities'];

function StatusBadge({ status }: { status: SystemNodeStatus }) {
  const meta = statusMeta[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}>
      <span className={`size-1.5 rounded-full ${meta.dotClassName}`} />
      {meta.label}
    </span>
  );
}

function NodeButton({
  node,
  selected,
  onSelect,
  compact = false,
}: {
  node: SystemNode;
  selected: boolean;
  onSelect: (nodeId: string) => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(node.id)}
      className={`group w-full rounded-xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 ${
        compact ? 'p-3' : 'p-3.5'
      } ${
        selected
          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
          : 'border-border-light bg-white hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-sm dark:border-border-dark dark:bg-surface-dark'
      }`}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className={`material-symbols-outlined shrink-0 rounded-lg p-2 ${
          selected
            ? 'bg-primary text-white'
            : 'bg-primary/10 text-primary group-hover:bg-primary/15'
        } ${compact ? 'text-lg' : 'text-xl'}`}>
          {node.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-bold text-gray-900 dark:text-white">{node.label}</span>
            {node.status === 'hidden' && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                off
              </span>
            )}
          </span>
          <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{node.shortLabel}</span>
        </span>
        <span aria-hidden="true" className="material-symbols-outlined shrink-0 text-lg text-gray-300 transition-colors group-hover:text-primary dark:text-gray-600">
          chevron_right
        </span>
      </div>
    </button>
  );
}

function MapLane({
  title,
  subtitle,
  nodes,
  selectedNodeId,
  onSelect,
}: {
  title: string;
  subtitle: string;
  nodes: SystemNode[];
  selectedNodeId: string;
  onSelect: (nodeId: string) => void;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-border-light bg-gray-50/70 p-3 dark:border-border-dark dark:bg-gray-900/30">
      <div className="mb-3 px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">{title}</h3>
        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-2.5">
        {nodes.length > 0 ? nodes.map((node) => (
          <NodeButton
            key={node.id}
            node={node}
            selected={selectedNodeId === node.id}
            onSelect={onSelect}
          />
        )) : (
          <div className="rounded-xl border border-dashed border-border-light px-3 py-6 text-center text-xs text-gray-400 dark:border-border-dark dark:text-gray-500">
            Không có thành phần trong bộ lọc này.
          </div>
        )}
      </div>
    </section>
  );
}

function Inspector({ node }: { node: SystemNode }) {
  return (
    <aside className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-surface-dark" aria-label="Chi tiết thành phần">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Đang chọn</p>
          <h2 className="mt-1 break-words text-xl font-black text-gray-900 dark:text-white">{node.label}</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{node.group} · {node.shortLabel}</p>
        </div>
        <span aria-hidden="true" className="material-symbols-outlined rounded-xl bg-primary/10 p-2 text-2xl text-primary">{node.icon}</span>
      </div>

      <div className="mt-4">
        <StatusBadge status={node.status} />
      </div>

      <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">{node.description}</p>

      <div className="mt-5 border-t border-border-light pt-4 dark:border-border-dark">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Trách nhiệm chính</h3>
        <ul className="mt-3 space-y-2">
          {node.responsibilities.map((responsibility) => (
            <li key={responsibility} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span aria-hidden="true" className="material-symbols-outlined mt-0.5 text-base text-primary">check_circle</span>
              <span>{responsibility}</span>
            </li>
          ))}
        </ul>
      </div>

      <dl className="mt-5 grid gap-3 border-t border-border-light pt-4 dark:border-border-dark">
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Interface</dt>
          <dd className="mt-1 text-sm text-gray-800 dark:text-gray-200">{node.interface}</dd>
        </div>
        {node.dataStore && (
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Data / state</dt>
            <dd className="mt-1 font-mono text-xs text-gray-700 dark:text-gray-300">{node.dataStore}</dd>
          </div>
        )}
      </dl>
    </aside>
  );
}

function FilterButtons<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</span>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
              value === option.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MapView({
  filter,
  selectedNodeId,
  onSelect,
}: {
  filter: MapFilter;
  selectedNodeId: string;
  onSelect: (nodeId: string) => void;
}) {
  const visibleNodes = useMemo(() => SYSTEM_NODES.filter((node) => {
    if (filter === 'CLIENT') return node.kind === 'client';
    if (filter === 'BACKEND') return node.kind === 'edge' || node.kind === 'service';
    if (filter === 'INFRASTRUCTURE') return node.kind === 'infrastructure';
    if (filter === 'HIDDEN') return node.status === 'hidden';
    return true;
  }), [filter]);

  const clients = visibleNodes.filter((node) => node.mapColumn === 'client');
  const edge = visibleNodes.filter((node) => node.mapColumn === 'edge');
  const coreServices = visibleNodes.filter((node) => node.mapColumn === 'service' && node.status !== 'hidden');
  const hiddenServices = visibleNodes.filter((node) => node.mapColumn === 'service' && node.status === 'hidden');
  const infrastructure = visibleNodes.filter((node) => node.mapColumn === 'infrastructure');

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(310px,0.7fr)]">
      <div className="min-w-0 rounded-2xl border border-border-light bg-white p-4 shadow-sm dark:border-border-dark dark:bg-surface-dark lg:p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Public edge → domain → data plane</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Các node có thể click để xem ownership và contract.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" />MVP active</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-400" />Hidden</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-blue-500" />Private</span>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(145px,0.8fr)_auto_minmax(145px,0.8fr)_auto_minmax(260px,1.5fr)] xl:items-stretch">
          <MapLane
            title="Clients"
            subtitle="3 ứng dụng qua Gateway"
            nodes={clients}
            selectedNodeId={selectedNodeId}
            onSelect={onSelect}
          />
          <div className="hidden flex-col items-center justify-center gap-1 text-primary xl:flex" aria-hidden="true">
            <span className="material-symbols-outlined text-3xl">arrow_forward</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">REST / WS</span>
          </div>
          <MapLane
            title="Public edge"
            subtitle="Application traffic"
            nodes={edge}
            selectedNodeId={selectedNodeId}
            onSelect={onSelect}
          />
          <div className="hidden flex-col items-center justify-center gap-1 text-primary xl:flex" aria-hidden="true">
            <span className="material-symbols-outlined text-3xl">arrow_forward</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Contracts</span>
          </div>
          <MapLane
            title="Domain services"
            subtitle="Mỗi service sở hữu state riêng"
            nodes={coreServices}
            selectedNodeId={selectedNodeId}
            onSelect={onSelect}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/30">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">Gated capabilities</h3>
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Có code/schema nhưng không mở trong COD MVP.</p>
              </div>
              <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{hiddenServices.length} off</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {hiddenServices.length > 0 ? hiddenServices.map((node) => (
                <NodeButton
                  key={node.id}
                  node={node}
                  selected={selectedNodeId === node.id}
                  onSelect={onSelect}
                  compact
                />
              )) : (
                <p className="text-xs text-gray-400 dark:text-gray-500">Không có capability hidden trong bộ lọc.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border-light bg-gray-50/70 p-3 dark:border-border-dark dark:bg-gray-900/30">
            <div className="mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">Event & data plane</h3>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Private infrastructure và external integration.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {infrastructure.length > 0 ? infrastructure.map((node) => (
                <NodeButton
                  key={node.id}
                  node={node}
                  selected={selectedNodeId === node.id}
                  onSelect={onSelect}
                  compact
                />
              )) : (
                <p className="text-xs text-gray-400 dark:text-gray-500">Không có hạ tầng trong bộ lọc.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      <Inspector node={getSystemNode(selectedNodeId)} />
    </div>
  );
}

function FlowView({
  selectedNodeId,
  onSelect,
}: {
  selectedNodeId: string;
  onSelect: (nodeId: string) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(310px,0.75fr)]">
      <section className="rounded-2xl border border-border-light bg-white p-4 shadow-sm dark:border-border-dark dark:bg-surface-dark lg:p-6">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Canonical happy path</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Từ đặt món đến đối soát COD</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            Luồng chính kết hợp REST đồng bộ, Kafka event/command và raw WebSocket tracking. Chọn một bước để xem service authority.
          </p>
        </div>

        <ol className="grid gap-3 lg:grid-cols-2">
          {ORDER_FLOW.map((step, index) => {
            const service = getSystemNode(step.serviceId);
            const selected = selectedNodeId === step.serviceId;
            return (
              <li key={step.id} className="relative">
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(step.serviceId)}
                  className={`group flex h-full w-full gap-3 rounded-2xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                    selected
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                      : 'border-border-light hover:border-primary/60 hover:shadow-sm dark:border-border-dark'
                  }`}
                >
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                    selected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                  }`}>{step.number}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{step.label}</span>
                      <span aria-hidden="true" className="material-symbols-outlined text-lg text-gray-300 group-hover:text-primary dark:text-gray-600">arrow_outward</span>
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-primary">{step.actor}</span>
                    <span className="mt-2 block text-xs leading-5 text-gray-500 dark:text-gray-400">{step.detail}</span>
                    <span className="mt-3 inline-flex max-w-full rounded-lg bg-gray-100 px-2 py-1 font-mono text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-300">{step.transport}</span>
                    <span className="mt-2 block text-[11px] text-gray-400 dark:text-gray-500">Authority: {service.label}</span>
                  </span>
                </button>
                {index < ORDER_FLOW.length - 1 && index % 2 === 0 && (
                  <span className="pointer-events-none absolute -bottom-4 left-1/2 z-10 hidden -translate-x-1/2 text-primary lg:block" aria-hidden="true">
                    <span className="material-symbols-outlined">south</span>
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-6 grid gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Sync</p>
            <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">Checkout validation, ownership và participant checks.</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Async</p>
            <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">Outbox → Kafka → receipt/dedup → retry/DLT.</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Realtime</p>
            <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">Raw WebSocket qua Gateway, room authorization và reconnect.</p>
          </div>
        </div>
      </section>

      <Inspector node={getSystemNode(selectedNodeId)} />
    </div>
  );
}

function ServiceCatalogView({
  filter,
  selectedNodeId,
  onSelect,
  onFilterChange,
}: {
  filter: ServiceFilter;
  selectedNodeId: string;
  onSelect: (nodeId: string) => void;
  onFilterChange: (filter: ServiceFilter) => void;
}) {
  const services = SYSTEM_NODES.filter((node) => {
    if (node.kind !== 'service') return false;
    if (filter === 'ACTIVE') return node.status === 'active';
    if (filter === 'HIDDEN') return node.status === 'hidden';
    return true;
  });

  const groupedServices = serviceGroupOrder
    .map((group) => ({
      group,
      services: services.filter((service) => service.group === group),
    }))
    .filter((entry) => entry.services.length > 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(310px,0.75fr)]">
      <section className="min-w-0 rounded-2xl border border-border-light bg-white p-4 shadow-sm dark:border-border-dark dark:bg-surface-dark lg:p-6">
        <div className="mb-5 flex flex-col gap-4 border-b border-border-light pb-5 dark:border-border-dark">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Service catalog</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Ownership và capability status theo source-of-truth hiện tại.</p>
          </div>
          <FilterButtons
            label="Hiển thị"
            options={serviceFilters}
            value={filter}
            onChange={onFilterChange}
          />
        </div>

        <div className="space-y-6">
          {groupedServices.map(({ group, services: groupServices }) => (
            <section key={group}>
              <div className="mb-3 flex items-center gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{group}</h3>
                <span className="h-px flex-1 bg-border-light dark:bg-border-dark" />
                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">{groupServices.length}</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {groupServices.map((service) => (
                  <NodeButton
                    key={service.id}
                    node={service}
                    selected={selectedNodeId === service.id}
                    onSelect={onSelect}
                    compact
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <Inspector node={getSystemNode(selectedNodeId)} />
    </div>
  );
}

const SystemOverviewPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('MAP');
  const [mapFilter, setMapFilter] = useState<MapFilter>('ALL');
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('ALL');
  const [selectedNodeId, setSelectedNodeId] = useState('gateway');

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2b1d0d] via-[#5a3412] to-[#b86b14] p-6 text-white shadow-lg shadow-primary/10 lg:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border-[28px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-32 right-24 size-80 rounded-full border-[20px] border-white/5" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-100">
                <span className="material-symbols-outlined text-sm">architecture</span>
                System map · as-built
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Hiểu hệ thống Delivery</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-orange-50/85 sm:text-base">
                Bản đồ trực quan của các client, Gateway, domain service, event bus và ownership boundary trong nền tảng đặt & giao đồ ăn.
              </p>
            </div>
            <div className="shrink-0 rounded-2xl border border-white/20 bg-black/10 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-100/75">Nguồn kiến trúc</p>
              <p className="mt-1 text-sm font-semibold">docs/ARCHITECTURE.md</p>
              <p className="mt-1 text-xs text-orange-100/75">Verified 09/08/2026 · read-only view</p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Tổng quan hệ thống">
          {[
            { icon: 'devices', value: '3', label: 'Client applications', detail: 'Flutter · React · React Native' },
            { icon: 'route', value: '13', label: 'COD MVP footprint', detail: 'Gateway + 12 active services' },
            { icon: 'hub', value: '4', label: 'Core data plane', detail: 'Kafka · Redis · PostgreSQL · ES' },
            { icon: 'lock', value: '4', label: 'Gated capabilities', detail: 'Voucher · Flash · Analytics · Live' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-border-light bg-white p-4 shadow-sm dark:border-border-dark dark:bg-surface-dark">
              <span aria-hidden="true" className="material-symbols-outlined rounded-xl bg-primary/10 p-2.5 text-2xl text-primary">{stat.icon}</span>
              <div className="min-w-0">
                <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{stat.label}</p>
                <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">{stat.detail}</p>
              </div>
            </div>
          ))}
        </section>

        <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-white p-3 shadow-sm dark:border-border-dark dark:bg-surface-dark sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Chế độ xem kiến trúc">
            {viewTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={viewMode === tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  viewMode === tab.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
          {viewMode === 'MAP' && (
            <FilterButtons
              label="Lọc map"
              options={mapFilters}
              value={mapFilter}
              onChange={setMapFilter}
            />
          )}
        </div>

        {viewMode === 'MAP' && (
          <MapView
            filter={mapFilter}
            selectedNodeId={selectedNodeId}
            onSelect={setSelectedNodeId}
          />
        )}
        {viewMode === 'FLOW' && (
          <FlowView
            selectedNodeId={selectedNodeId}
            onSelect={setSelectedNodeId}
          />
        )}
        {viewMode === 'SERVICES' && (
          <ServiceCatalogView
            filter={serviceFilter}
            selectedNodeId={selectedNodeId}
            onSelect={setSelectedNodeId}
            onFilterChange={setServiceFilter}
          />
        )}

        <section className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-surface-dark lg:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Boundary rules</p>
              <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Các nguyên tắc không được phá vỡ</h2>
            </div>
            <span aria-hidden="true" className="material-symbols-outlined rounded-xl bg-primary/10 p-2 text-2xl text-primary">policy</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {SYSTEM_PRINCIPLES.map((principle) => (
              <div key={principle.title} className="rounded-xl border border-border-light bg-gray-50/70 p-4 dark:border-border-dark dark:bg-gray-900/30">
                <span aria-hidden="true" className="material-symbols-outlined text-2xl text-primary">{principle.icon}</span>
                <h3 className="mt-3 text-sm font-bold text-gray-900 dark:text-white">{principle.title}</h3>
                <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{principle.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default SystemOverviewPage;
