import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowUpRight, Bell, Check, CheckCircle2, ChevronRight, CircleDollarSign,
  Clock3, FileCheck2, FileText, LayoutDashboard, ListFilter, MapPin, Menu, PackageCheck,
  RefreshCw, Route, Search, ShieldCheck, Truck, Upload, X,
} from 'lucide-react';
import { supabase } from './lib/supabase';

type Status = 'scheduled' | 'in_transit' | 'delivered' | 'incident' | 'ready_for_billing';
type Service = { id: string; reference: string; origin: string; destination: string; unit: string; operator_name: string; responsible: string; scheduled_at: string; status: Status; progress: number; billing_amount: number; delivered_at: string | null; billing_ready_at: string | null; client_id: string };
type Evidence = { id: string; service_id: string; evidence_type: 'pod' | 'photo' | 'document' | 'note'; title: string; notes: string | null; uploaded_at: string; validated: boolean; file_path: string | null; mime_type: string | null; size_bytes: number | null };
type Incident = { id: string; service_id: string; incident_type: string; occurred_at: string; impact: string; responsible: string; pending_action: string; resolved: boolean };
type Event = { id: string; service_id: string; event_type: string; title: string; detail: string | null; occurred_at: string };
type Validation = { id: string; service_id: string; validated_by: string; validated_at: string; accepted: boolean; notes: string | null };

const statusInfo: Record<Status, { label: string; color: string }> = {
  scheduled: { label: 'Programado', color: 'blue' }, in_transit: { label: 'En ruta', color: 'cyan' }, delivered: { label: 'Entregado', color: 'amber' }, incident: { label: 'Con incidencia', color: 'red' }, ready_for_billing: { label: 'Listo para cobro', color: 'green' },
};
const formatMoney = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value);
const formatTime = (value: string) => new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

export default function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [selected, setSelected] = useState<Service | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [view, setView] = useState<'dashboard' | 'incidents' | 'billing'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true); setError('');
    const [serviceResult, evidenceResult, incidentResult] = await Promise.all([
      supabase.from('services').select('*').order('scheduled_at', { ascending: true }),
      supabase.from('evidences').select('*').order('uploaded_at', { ascending: false }),
      supabase.from('incidents').select('*').order('occurred_at', { ascending: false }),
    ]);
    if (serviceResult.error || evidenceResult.error || incidentResult.error) { setError('No pudimos cargar la operación. Revisa la conexión y vuelve a intentar.'); setLoading(false); return; }
    setServices((serviceResult.data ?? []) as Service[]); setEvidences((evidenceResult.data ?? []) as Evidence[]); setIncidents((incidentResult.data ?? []) as Incident[]); setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const openService = async (service: Service) => {
    setSelected(service); setValidation(null);
    const [eventResult, validationResult] = await Promise.all([
      supabase.from('service_events').select('*').eq('service_id', service.id).order('occurred_at', { ascending: true }),
      supabase.from('delivery_validations').select('*').eq('service_id', service.id).maybeSingle(),
    ]);
    setEvents((eventResult.data ?? []) as Event[]); setValidation((validationResult.data as Validation | null) ?? null);
  };

  const filteredServices = useMemo(() => services.filter((service) => {
    const matchesQuery = `${service.reference} ${service.origin} ${service.destination} ${service.operator_name} ${service.responsible}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (statusFilter === 'all' || service.status === statusFilter);
  }), [services, query, statusFilter]);
  const readyAmount = services.filter((s) => s.status === 'ready_for_billing').reduce((sum, s) => sum + Number(s.billing_amount), 0);
  const completeCount = services.filter((s) => s.status === 'ready_for_billing').length;
  const activeCount = services.filter((s) => s.status === 'in_transit').length;

  const validateDelivery = async () => {
    if (!selected) return;
    const serviceEvidence = evidences.filter((e) => e.service_id === selected.id);
    if (!serviceEvidence.length) { setError('Este expediente necesita al menos una evidencia antes de validar la entrega.'); return; }
    setSaving(true); setError('');
    const now = new Date().toISOString();
    const { error: validationError } = await supabase.from('delivery_validations').upsert({ service_id: selected.id, validated_by: 'Equipo Ruta Limpia', accepted: true, notes: 'Entrega revisada y aceptada.' }, { onConflict: 'service_id' });
    if (validationError) { setError('No se pudo validar la entrega.'); setSaving(false); return; }
    const nextStatus: Status = 'ready_for_billing';
    const { error: updateError } = await supabase.from('services').update({ status: nextStatus, progress: 100, billing_ready_at: now }).eq('id', selected.id);
    if (updateError) { setError('La validación se guardó, pero el estado no pudo actualizarse.'); setSaving(false); return; }
    await supabase.from('service_events').insert({ service_id: selected.id, event_type: 'validation', title: 'Entrega validada', detail: 'Expediente listo para revisión de cobranza.', occurred_at: now });
    await load(); setSaving(false); setSelected({ ...selected, status: nextStatus, progress: 100, billing_ready_at: now }); setValidation({ id: 'new', service_id: selected.id, validated_by: 'Equipo Ruta Limpia', validated_at: now, accepted: true, notes: 'Entrega revisada y aceptada.' });
  };

  const uploadEvidence = async (file: File) => {
    if (!selected) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError('Solo se aceptan fotos JPG, PNG o WebP y documentos PDF de hasta 10 MB.');
      return;
    }
    setUploading(true); setError('');
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
    const filePath = `${selected.id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from('service-evidence').upload(filePath, file, { contentType: file.type, upsert: false });
    if (uploadError) { setError('No se pudo cargar el archivo. Intenta de nuevo.'); setUploading(false); return; }
    const evidenceType: Evidence['evidence_type'] = file.type === 'application/pdf' ? 'document' : 'photo';
    const { error: insertError } = await supabase.from('evidences').insert({ service_id: selected.id, evidence_type: evidenceType, title: file.name, file_path: filePath, mime_type: file.type, size_bytes: file.size, notes: 'Archivo cargado por operaciones.' });
    if (insertError) { await supabase.storage.from('service-evidence').remove([filePath]); setError('No se pudo registrar el archivo en el expediente.'); setUploading(false); return; }
    const { data: evidenceData } = await supabase.from('evidences').select('*').eq('file_path', filePath).maybeSingle();
    if (evidenceData) setEvidences((current) => [evidenceData as Evidence, ...current]);
    setUploading(false);
  };

  const openEvidence = async (evidence: Evidence) => {
    if (!evidence.file_path) return;
    const { data, error: urlError } = await supabase.storage.from('service-evidence').createSignedUrl(evidence.file_path, 60 * 5);
    if (urlError || !data?.signedUrl) { setError('No se pudo abrir este archivo.'); return; }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const visibleIncidents = view === 'incidents' ? incidents : incidents.slice(0, 2);
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Route size={21} /></div><div><strong>Ruta Limpia</strong><span>Centro de control</span></div></div>
      <div className="workspace"><span className="workspace-dot" /> Piloto Nortecarga <ChevronRight size={15} /></div>
      <nav><p className="nav-label">OPERACIÓN</p><button className={view === 'dashboard' ? 'nav-item active' : 'nav-item'} onClick={() => setView('dashboard')}><LayoutDashboard size={18} /> Resumen operativo</button><button className={view === 'incidents' ? 'nav-item active' : 'nav-item'} onClick={() => setView('incidents')}><AlertTriangle size={18} /> Incidencias <b>{incidents.filter((i) => !i.resolved).length}</b></button><button className="nav-item" onClick={() => setView('dashboard')}><FileCheck2 size={18} /> Evidencias</button><p className="nav-label">ADMINISTRACIÓN</p><button className={view === 'billing' ? 'nav-item active' : 'nav-item'} onClick={() => setView('billing')}><CircleDollarSign size={18} /> Cobranza <b className="green-count">{completeCount}</b></button></nav>
      <div className="sidebar-bottom"><div className="online"><span /> Sistema operativo</div><div className="profile"><div className="avatar">AL</div><div><strong>Ana López</strong><span>Operaciones</span></div><ChevronRight size={15} /></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="mobile-menu"><Menu size={20} /></button><div className="breadcrumb">Operación <ChevronRight size={15} /> <strong>{view === 'dashboard' ? 'Resumen operativo' : view === 'incidents' ? 'Incidencias' : 'Cobranza'}</strong></div><div className="top-actions"><button className="icon-button"><Bell size={19} /><span className="notification-dot" /></button><div className="avatar">AL</div></div></header>
      <div className="page-wrap">
        <div className="page-heading"><div><div className="eyebrow">LUNES, 02 DE NOVIEMBRE · 09:42</div><h1>{view === 'dashboard' ? 'Buenos días, Ana.' : view === 'incidents' ? 'Incidencias activas' : 'Expedientes para cobrar'}</h1><p>{view === 'dashboard' ? 'Toda la operación en un solo lugar. Estos son los movimientos que requieren tu atención.' : view === 'incidents' ? 'Da seguimiento a lo que puede afectar la entrega y protege el compromiso con el cliente.' : 'Servicios con entrega validada y evidencias completas, listos para el siguiente paso.'}</p></div><button className="refresh-button" onClick={() => void load()}><RefreshCw size={16} /> Actualizar</button></div>
        {error && <div className="alert error"><AlertTriangle size={17} /> {error}<button onClick={() => setError('')}><X size={15} /></button></div>}
        {view === 'dashboard' && <><section className="metrics"><Metric icon={<Truck />} label="Servicios en curso" value={String(activeCount)} detail="2 requieren seguimiento" tone="blue" /><Metric icon={<PackageCheck />} label="Entregas de hoy" value={String(services.filter((s) => s.status === 'delivered' || s.status === 'ready_for_billing').length)} detail="1 pendiente de validación" tone="green" /><Metric icon={<AlertTriangle />} label="Incidencias abiertas" value={String(incidents.filter((i) => !i.resolved).length).padStart(2, '0')} detail="1 con impacto alto" tone="red" /><Metric icon={<CircleDollarSign />} label="Listos para cobrar" value={formatMoney(readyAmount)} detail={`${completeCount} expedientes completos`} tone="amber" /></section><section className="section-header"><div><h2>Servicios de hoy</h2><p>El expediente completo hace visible el siguiente paso.</p></div><span className="service-count">{filteredServices.length} servicios</span></section><div className="toolbar"><div className="search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por ruta, unidad o responsable" /></div><div className="filter-wrap"><ListFilter size={16} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | Status)}><option value="all">Todos los estados</option>{Object.entries(statusInfo).map(([key, info]) => <option key={key} value={key}>{info.label}</option>)}</select></div></div>{loading ? <div className="loading"><RefreshCw className="spin" /> Cargando operación...</div> : <ServiceTable services={filteredServices} onOpen={(service) => void openService(service)} />}</>}
        {view === 'billing' && <BillingView services={services.filter((s) => s.status === 'ready_for_billing')} onOpen={(service) => void openService(service)} />}
        {view === 'incidents' && <IncidentView incidents={visibleIncidents} services={services} onOpen={(service) => void openService(service)} />}
      </div>
    </main>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><aside className="drawer" onClick={(e) => e.stopPropagation()}><div className="drawer-header"><div><span className={`status-pill ${statusInfo[selected.status].color}`}>{statusInfo[selected.status].label}</span><h2>{selected.reference}</h2><p>{selected.origin} <ArrowUpRight size={14} /> {selected.destination}</p></div><button className="close-button" onClick={() => setSelected(null)}><X size={20} /></button></div><div className="drawer-body"><div className="route-summary"><div><span>Cliente</span><strong>Grupo Nortecarga</strong></div><div><span>Responsable</span><strong>{selected.responsible}</strong></div><div><span>Unidad / operador</span><strong>{selected.unit} · {selected.operator_name}</strong></div></div><div className="progress-card"><div className="progress-head"><span>Avance del servicio</span><strong>{selected.progress}%</strong></div><div className="progress-track"><span style={{ width: `${selected.progress}%` }} /></div><div className="step-labels"><span className="done">Salida</span><span className={selected.progress >= 60 ? 'done' : ''}>En ruta</span><span className={selected.progress >= 90 ? 'done' : ''}>Entrega</span><span className={selected.progress === 100 ? 'done' : ''}>Cobro</span></div></div><div className="drawer-section"><div className="section-title"><div><h3>Evidencias</h3><span>{evidences.filter((e) => e.service_id === selected.id).length} archivos</span></div><><input ref={fileInputRef} className="file-input" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadEvidence(file); event.target.value = ''; }} /><button className="upload-button" onClick={() => fileInputRef.current?.click()} disabled={uploading}><Upload size={14} /> {uploading ? 'Cargando...' : 'Subir evidencia'}</button></></div>{evidences.filter((e) => e.service_id === selected.id).length ? evidences.filter((e) => e.service_id === selected.id).map((e) => <button className="evidence-row evidence-clickable" key={e.id} onClick={() => void openEvidence(e)} disabled={!e.file_path}><div className="evidence-icon"><FileText size={17} /></div><div><strong>{e.title}</strong><span>{e.notes ?? 'Sin observaciones'} · {formatTime(e.uploaded_at)}</span></div>{e.file_path ? <ArrowUpRight className="evidence-open" size={17} /> : <CheckCircle2 className="evidence-check" size={17} />}</button>) : <div className="empty-small">Aún no hay evidencias cargadas.</div>}</div><div className="drawer-section"><div className="section-title"><h3>Incidencias</h3><span>{incidents.filter((i) => i.service_id === selected.id).length}</span></div>{incidents.filter((i) => i.service_id === selected.id).map((i) => <div className="incident-card" key={i.id}><div className="incident-card-head"><AlertTriangle size={16} /><strong>{i.incident_type}</strong><span>{i.resolved ? 'Resuelta' : 'Abierta'}</span></div><p>{i.impact}</p><small>Próximo paso: {i.pending_action}</small></div>)}{!incidents.some((i) => i.service_id === selected.id) && <div className="empty-small">Sin incidencias registradas.</div>}</div><div className="drawer-section"><div className="section-title"><h3>Línea de tiempo</h3></div>{events.length ? <div className="timeline">{events.map((event) => <div className="timeline-item" key={event.id}><span className="timeline-dot" /><div><strong>{event.title}</strong><span>{event.detail}</span><small>{formatTime(event.occurred_at)}</small></div></div>)}</div> : <div className="empty-small">Este servicio todavía no tiene eventos registrados.</div>}</div></div><div className="drawer-footer">{validation ? <div className="validated"><ShieldCheck size={18} /><div><strong>Entrega validada</strong><span>Por {validation.validated_by} · {formatTime(validation.validated_at)}</span></div></div> : <button className="primary-button" onClick={() => void validateDelivery()} disabled={saving}><Check size={17} /> {saving ? 'Guardando...' : 'Validar entrega'}</button>}</div></aside></div>}
  </div>;
}

function Metric({ icon, label, value, detail, tone }: { icon: JSX.Element; label: string; value: string; detail: string; tone: string }) { return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>; }
function ServiceTable({ services, onOpen }: { services: Service[]; onOpen: (service: Service) => void }) { return <div className="table-card"><div className="table-head"><span>Servicio</span><span>Ruta</span><span>Responsable</span><span>Avance</span><span>Estado</span><span /></div>{services.map((service) => <button className="service-row" key={service.id} onClick={() => onOpen(service)}><div className="service-id"><div className="truck-icon"><Truck size={18} /></div><div><strong>{service.reference}</strong><span>{new Date(service.scheduled_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} · {service.unit}</span></div></div><div className="route-cell"><span>{service.origin}</span><ArrowUpRight size={14} /><span>{service.destination}</span></div><div className="responsible"><div className="mini-avatar">{service.responsible.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>{service.responsible}</div><div className="row-progress"><div className="mini-progress"><span style={{ width: `${service.progress}%` }} /></div><span>{service.progress}%</span></div><span className={`status-pill ${statusInfo[service.status].color}`}>{statusInfo[service.status].label}</span><ChevronRight size={18} className="row-chevron" /></button>)}{!services.length && <div className="empty-state"><Search size={25} /><strong>No encontramos servicios</strong><span>Prueba con otro filtro o término de búsqueda.</span></div>}</div>; }
function BillingView({ services, onOpen }: { services: Service[]; onOpen: (service: Service) => void }) { const total = services.reduce((sum, s) => sum + Number(s.billing_amount), 0); return <><div className="billing-hero"><div className="billing-icon"><CircleDollarSign size={27} /></div><div><span>Disponible para cobranza</span><strong>{formatMoney(total)}</strong><p>{services.length} expedientes con entrega validada y evidencias completas.</p></div></div><div className="section-header"><div><h2>Cola de cobranza</h2><p>Abre cada expediente para revisar el contexto completo.</p></div></div><ServiceTable services={services} onOpen={onOpen} /></>; }
function IncidentView({ incidents, services, onOpen }: { incidents: Incident[]; services: Service[]; onOpen: (service: Service) => void }) { return <div className="incident-list">{incidents.map((incident) => { const service = services.find((s) => s.id === incident.service_id); return <div className="large-incident" key={incident.id}><div className="large-incident-icon"><AlertTriangle size={21} /></div><div className="large-incident-content"><div className="incident-top"><div><span className="eyebrow">{service?.reference ?? 'Servicio'}</span><h3>{incident.incident_type}</h3></div><span className={`status-pill ${incident.resolved ? 'green' : 'red'}`}>{incident.resolved ? 'Resuelta' : 'Requiere atención'}</span></div><p>{service?.origin} <ArrowUpRight size={14} /> {service?.destination}</p><div className="incident-meta"><div><span>Impacto</span><strong>{incident.impact}</strong></div><div><span>Responsable</span><strong>{incident.responsible}</strong></div><div><span>Próximo paso</span><strong>{incident.pending_action}</strong></div></div></div><button className="secondary-button" onClick={() => service && onOpen(service)}>Abrir expediente <ArrowUpRight size={16} /></button></div>})}{!incidents.length && <div className="empty-state"><CheckCircle2 size={29} /><strong>Todo bajo control</strong><span>No hay incidencias abiertas en este momento.</span></div>}</div>; }
