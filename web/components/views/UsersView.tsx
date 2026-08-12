"use client";

import { ShieldCheck, UserCheck, UserPlus, Users } from "lucide-react";
import { useState } from "react";

import { ErrorState } from "@/components/ui/AsyncState";
import { DataTable } from "@/components/ui/DataTable";
import { Filters } from "@/components/ui/Filters";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { withQuery } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import type { UserRow, UserSummary } from "@/lib/types";
import { useApi } from "@/lib/useApi";

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
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const { data: summary, loading: summaryLoading, error, refetch } =
    useApi<UserSummary>("/users/summary");

  const { data: users, meta, loading } = useApi<UserRow[]>(
    withQuery("/users", {
      q: search || undefined,
      role: filters.role,
      status: filters.status,
      page,
      limit: 10,
    }),
  );

  const totals = summary?.totals;

  const rows = (users ?? []).map((user) => [
    user.name,
    user.email,
    user.roleLabel,
    user.accessScope,
    user.statusLabel,
  ]);

  return (
    <div className="page-stack page-enter">
      <PageHeader
        title="Kullanıcılar"
        description="Ekip üyelerini, rollerini ve erişim izinlerini yönetin."
        icon={<Users />}
        primaryLabel="Yeni Kullanıcı"
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

      <Panel title="Kullanıcı Listesi" className="table-panel">
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
    </div>
  );
}

export default UsersView;
