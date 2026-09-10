"use client";

import {
  Mail,
  Phone,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  X,
  Eye,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { useState, FormEvent } from "react";

import { ErrorState } from "@/components/ui/AsyncState";
import { DataTable } from "@/components/ui/DataTable";
import { Filters } from "@/components/ui/Filters";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { api, withQuery } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import type { UserRow, UserSummary } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/uiSlice";

const ROLE_OPTIONS = [
  { value: "admin", label: "Yönetici" },
  { value: "farmer", label: "İşletme Yöneticisi" },
  { value: "viewer", label: "Görüntüleyici" },
];

const STATUS_OPTIONS = [
  { value: "aktif", label: "Aktif" },
  { value: "planlandi", label: "Planlandı" },
  { value: "pasif", label: "Pasif" },
];

export function UsersView() {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedViewUser, setSelectedViewUser] = useState<UserRow | null>(null);
  const [selectedEditUser, setSelectedEditUser] = useState<UserRow | null>(null);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("farmer");
  const [newPhone, setNewPhone] = useState("");
  const [newJobTitle, setNewJobTitle] = useState("");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const { data: summary, loading: summaryLoading, error, refetch } =
    useApi<UserSummary>("/users/summary");

  const { data: users, meta, loading, refetch: refetchList } = useApi<UserRow[]>(
    withQuery("/users", {
      q: search || undefined,
      role: filters.role,
      status: filters.status,
      page,
      limit: 10,
    }),
  );

  const totals = summary?.totals;

  const openAddModal = () => {
    setNewName(""); setNewEmail(""); setNewRole("farmer");
    setNewPhone(""); setNewJobTitle("");
    setShowAddModal(true);
  };

  const openEditModal = (user: UserRow) => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditPhone(user.phone || "");
    setEditJobTitle(user.jobTitle || "");
    setEditStatus(user.status);
    setSelectedEditUser(user);
    setSelectedViewUser(null);
  };

  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/users", {
        name: newName,
        email: newEmail,
        role: newRole,
        phone: newPhone || undefined,
        jobTitle: newJobTitle || undefined,
      });
      dispatch(showToast(`${newName} kullanıcısı başarıyla eklendi.`));
      setShowAddModal(false);
      refetch();
      refetchList();
    } catch {
      dispatch(showToast("Kullanıcı eklenirken bir hata oluştu."));
    }
  };

  const handleUpdateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedEditUser) return;
    try {
      await api.patch(`/users/${selectedEditUser.id}`, {
        name: editName,
        email: editEmail,
        role: editRole,
        phone: editPhone || undefined,
        jobTitle: editJobTitle || undefined,
        status: editStatus,
      });
      dispatch(showToast(`${editName} kullanıcısı güncellendi.`));
      setSelectedEditUser(null);
      refetch();
      refetchList();
    } catch {
      dispatch(showToast("Kullanıcı güncellenirken bir hata oluştu."));
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`${name} kullanıcısını silmek istediğinize emin misiniz?`)) return;
    try {
      await api.delete(`/users/${id}`);
      dispatch(showToast(`${name} kullanıcısı silindi.`));
      setSelectedViewUser(null);
      setSelectedEditUser(null);
      refetch();
      refetchList();
    } catch {
      dispatch(showToast("Kullanıcı silinirken bir hata oluştu."));
    }
  };

  const rows = (users ?? []).map((user) => [
    user.name,
    user.email,
    user.roleLabel,
    user.accessScope,
    user.statusLabel,
  ]);

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid var(--line)",
    background: "var(--surface-2)",
    color: "inherit",
    fontSize: "14px",
  };

  const labelStyle = {
    display: "block" as const,
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "4px",
  };

  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Kullanıcılar"
        description="Ekip üyelerini, rollerini ve erişim izinlerini yönetin."
        icon={<Users />}
        primaryLabel=""
        hideDateFilter
      />

      {error && <ErrorState message={error} onRetry={refetch} />}

      <div className="stats-grid stats-grid-4">
        <StatCard
          icon={<Users />}
          label="Toplam Kullanıcı"
          value={formatNumber(totals?.total)}
          meta="Tüm roller"
          loading={summaryLoading}
        />
        <StatCard
          icon={<UserCheck />}
          label="Aktif Kullanıcı"
          value={formatNumber(totals?.active)}
          meta={`Bugün ${formatNumber(totals?.onlineToday)} giriş yaptı`}
          loading={summaryLoading}
        />
        <StatCard
          icon={<ShieldCheck />}
          label="Yönetici"
          value={formatNumber(totals?.admins)}
          meta="Tam yetkili"
          tone="purple"
          loading={summaryLoading}
        />
        <StatCard
          icon={<UserPlus />}
          label="Bekleyen Davet"
          value={formatNumber(totals?.invited)}
          meta="Davet gönderildi"
          tone="orange"
          loading={summaryLoading}
        />
      </div>

      <Panel
        title="Kullanıcı Listesi"
        style={{ width: "100%" }}
        action={
          <button className="button button-primary button-sm" onClick={openAddModal}>
            <Plus size={15} /> Yeni Kullanıcı Ekle
          </button>
        }
      >
        <Filters
          placeholder="Ad veya e-posta ara..."
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onSelectChange={(name, value) => {
            setFilters((current) => ({ ...current, [name]: value }));
            setPage(1);
          }}
          selects={[
            { name: "role", placeholder: "Tüm Roller", value: filters.role, options: ROLE_OPTIONS },
            {
              name: "status",
              placeholder: "Tüm Durumlar",
              value: filters.status,
              options: STATUS_OPTIONS,
            },
          ]}
        />
        <DataTable
          loading={loading}
          headers={["Ad Soyad", "E-posta", "Rol", "Erişim Alanı", "Durum"]}
          rows={rows}
          onViewRow={(index: number) => {
            if (users && users[index]) setSelectedViewUser(users[index]);
          }}
          onEditRow={(index: number) => {
            if (users && users[index]) openEditModal(users[index]);
          }}
          pagination={
            meta?.pagination
              ? {
                  page: meta.pagination.page,
                  totalPages: meta.pagination.totalPages,
                  total: meta.pagination.total,
                }
              : undefined
          }
          onPageChange={setPage}
        />
      </Panel>

      {/* MODAL: Görüntüleme */}
      {selectedViewUser && (
        <div className="modal-backdrop" onClick={() => setSelectedViewUser(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--surface)", padding: "28px", borderRadius: "16px", maxWidth: "460px", width: "100%", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <span className="breadcrumb">{selectedViewUser.roleLabel}</span>
                <h3 style={{ margin: 0, fontSize: "20px" }}>Kullanıcı Detayları</h3>
              </div>
              <button className="icon-button" onClick={() => setSelectedViewUser(null)}><X size={18} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--surface-2)", padding: "16px", borderRadius: "12px", marginBottom: "16px" }}>
              {[
                ["Ad Soyad", selectedViewUser.name],
                ["E-posta", selectedViewUser.email],
                ["Rol", selectedViewUser.roleLabel],
                ["Unvan", selectedViewUser.jobTitle || "—"],
                ["Telefon", selectedViewUser.phone || "—"],
                ["Erişim Alanı", selectedViewUser.accessScope],
                ["Durum", selectedViewUser.statusLabel],
                ["Son Giriş", selectedViewUser.lastLoginAt ? formatDate(selectedViewUser.lastLoginAt) : "—"],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "var(--muted)" }}>{label}</span>
                  <strong style={{ fontSize: "14px" }}>{value}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
              <button type="button" className="button button-danger" onClick={() => handleDeleteUser(selectedViewUser.id, selectedViewUser.name)}>
                <Trash2 size={16} /> Sil
              </button>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" className="button button-secondary" onClick={() => setSelectedViewUser(null)}>Kapat</button>
                <button type="button" className="button button-primary" onClick={() => openEditModal(selectedViewUser)}>
                  <Pencil size={16} /> Düzenle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Yeni Kullanıcı Ekle */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--surface)", padding: "28px", borderRadius: "16px", maxWidth: "500px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "20px" }}>Yeni Kullanıcı Ekle</h3>
              <button className="icon-button" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddUser} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Ad Soyad *</label>
                  <input required type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Örn: Ahmet Yılmaz" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>E-posta *</label>
                  <input required type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="ornek@email.com" style={inputStyle} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Rol</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={inputStyle}>
                    <option value="admin">Yönetici</option>
                    <option value="farmer">İşletme Yöneticisi</option>
                    <option value="viewer">Görüntüleyici</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Unvan</label>
                  <input type="text" value={newJobTitle} onChange={(e) => setNewJobTitle(e.target.value)} placeholder="Örn: Çiftlik Müdürü" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Telefon</label>
                <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+90 5xx xxx xx xx" style={inputStyle} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button type="button" className="button button-secondary" onClick={() => setShowAddModal(false)}>İptal</button>
                <button type="submit" className="button button-primary"><UserPlus size={16} /> Kullanıcı Ekle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Düzenleme */}
      {selectedEditUser && (
        <div className="modal-backdrop" onClick={() => setSelectedEditUser(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--surface)", padding: "28px", borderRadius: "16px", maxWidth: "500px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <span className="breadcrumb">{selectedEditUser.roleLabel}</span>
                <h3 style={{ margin: 0, fontSize: "20px" }}>Kullanıcıyı Düzenle</h3>
              </div>
              <button className="icon-button" onClick={() => setSelectedEditUser(null)}><X size={18} /></button>
            </div>

            <form onSubmit={handleUpdateUser} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Ad Soyad *</label>
                  <input required type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>E-posta *</label>
                  <input required type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Rol</label>
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value)} style={inputStyle}>
                    <option value="admin">Yönetici</option>
                    <option value="farmer">İşletme Yöneticisi</option>
                    <option value="viewer">Görüntüleyici</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Durum</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={inputStyle}>
                    <option value="aktif">Aktif</option>
                    <option value="pasif">Pasif</option>
                    <option value="planlandi">Planlandı</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Unvan</label>
                  <input type="text" value={editJobTitle} onChange={(e) => setEditJobTitle(e.target.value)} placeholder="Örn: Çiftlik Müdürü" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Telefon</label>
                  <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+90 5xx xxx xx xx" style={inputStyle} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                <button type="button" className="button button-danger" onClick={() => handleDeleteUser(selectedEditUser.id, selectedEditUser.name)}>
                  <Trash2 size={16} /> Sil
                </button>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="button" className="button button-secondary" onClick={() => setSelectedEditUser(null)}>İptal</button>
                  <button type="submit" className="button button-primary">Değişiklikleri Kaydet</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersView;
