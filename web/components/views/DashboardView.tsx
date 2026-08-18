"use client";

import {
  Activity,
  AlarmClock,
  Beef,
  Box,
  CloudSun,
  Droplets,
  Leaf,
  Milk,
  PackageOpen,
  Sprout,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { FarmMapAndWeather } from "@/components/dashboard/FarmMapAndWeather";
import { BarsChart, DonutChart, TrendChart } from "@/components/ui/Charts";
import { ErrorState, Skeleton, SkeletonBlock } from "@/components/ui/AsyncState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Reveal } from "@/components/ui/Reveal";
import { StatCard } from "@/components/ui/StatCard";
import {
  formatDecimal,
  formatNumber,
  formatPercent,
  formatRelative,
  withUnit,
} from "@/lib/format";
import type { ActivityItem, DashboardOverview } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import { useAppSelector } from "@/store/hooks";

const ALERT_ICON: Record<string, typeof AlarmClock> = {
  suru: AlarmClock,
  tarla: Droplets,
  stok: PackageOpen,
  kamera: Activity,
  cihaz: Activity,
  sistem: Activity,
};

export function DashboardView() {
  const user = useAppSelector((state) => state.session.user);
  const { data, loading, error, refetch } = useApi<DashboardOverview>("/dashboard/overview");
  const { data: activity } = useApi<ActivityItem[]>("/dashboard/activity?limit=4");

  const totals = data?.totals;

  return (
    <div className="page-stack page-enter">
      <PageHeader
        title={user?.name ?? "—"}
        eyebrow="Hoş geldiniz,"
        description={
          totals
            ? `Çiftliğinizde ${formatNumber(totals.openAlerts)} açık alarm ve ${formatNumber(
                totals.upcomingBirths,
              )} yaklaşan doğum bulunuyor.`
            : "Çiftlik verileriniz yükleniyor…"
        }
        primaryLabel="Hızlı İşlem"
      />

      {error && <ErrorState message={error} onRetry={refetch} />}

      <Reveal>
        <div className="stats-grid stats-grid-8">
          <StatCard
            icon={<Beef />}
            label="Toplam Hayvan"
            value={formatNumber(totals?.animals)}
            unit="Baş"
            meta="Tümü"
            loading={loading}
          />
          <StatCard
            icon={<Milk />}
            label="Sağmal"
            value={formatNumber(totals?.milking)}
            unit="Baş"
            meta={formatPercent(totals?.milkingPercent)}
            tone="green"
            loading={loading}
          />
          <StatCard
            icon={<Leaf />}
            label="Kuru"
            value={formatNumber(totals?.dry)}
            unit="Baş"
            meta={formatPercent(totals?.dryPercent)}
            tone="orange"
            loading={loading}
          />
          <StatCard
            icon={<UsersRound />}
            label="Buzağı"
            value={formatNumber(totals?.calves)}
            unit="Baş"
            meta={formatPercent(totals?.calvesPercent)}
            tone="blue"
            loading={loading}
          />
          <StatCard
            icon={<Sprout />}
            label="Tarla Sayısı"
            value={formatNumber(totals?.fields)}
            meta="Tümü"
            loading={loading}
          />
          <StatCard
            icon={<Box />}
            label="Stok Durumu"
            value={formatDecimal(totals?.stockQuantity)}
            unit={totals?.stockUnit ?? "Ton"}
            meta="Toplam"
            tone="orange"
            loading={loading}
          />
          <StatCard
            icon={<AlarmClock />}
            label="Aktif Alarm"
            value={formatNumber(totals?.openAlerts)}
            meta={`${formatNumber(totals?.criticalAlerts)} kritik`}
            tone="red"
            loading={loading}
          />
          <StatCard
            icon={<Activity />}
            label="Yaklaşan Doğum"
            value={formatNumber(totals?.upcomingBirths)}
            meta="15 gün içinde"
            tone="purple"
            loading={loading}
          />
        </div>
      </Reveal>

      <div className="dashboard-chart-grid">
        <Reveal delay={60}>
          <Panel title="Süt Üretimi Trendi (Son 30 Gün)">
            <div className="panel-kpi">
              <strong>{data ? `${formatNumber(data.milk.total)} L` : <Skeleton width={110} height={22} />}</strong>
              {data && (
                <span className={data.milk.changePercent < 0 ? "is-down" : ""}>
                  {data.milk.changePercent < 0 ? "▼" : "▲"} {formatPercent(data.milk.changePercent)}
                </span>
              )}
            </div>
            {data ? <TrendChart data={data.milk.series} /> : <SkeletonBlock rows={4} height={22} />}
          </Panel>
        </Reveal>
        <Reveal delay={100}>
          <Panel title="Tarla Verimliliği (Bu Yıl)">
            <div className="panel-kpi">
              <strong>
                {data ? `${formatNumber(data.fieldYield.total)} Ton` : <Skeleton width={110} height={22} />}
              </strong>
              {data && (
                <span className={data.fieldYield.changePercent < 0 ? "is-down" : ""}>
                  {data.fieldYield.changePercent < 0 ? "▼" : "▲"}{" "}
                  {formatPercent(data.fieldYield.changePercent)}
                </span>
              )}
            </div>
            {data ? <BarsChart data={data.fieldYield.series} /> : <SkeletonBlock rows={4} height={22} />}
          </Panel>
        </Reveal>
        <Reveal delay={140}>
          <Panel title="Stok Dağılımı">
            {data ? (
              <DonutChart
                data={data.stockDistribution}
                total={`${formatDecimal(totals?.stockQuantity)} ${totals?.stockUnit ?? "Ton"}`}
              />
            ) : (
              <SkeletonBlock rows={4} height={22} />
            )}
          </Panel>
        </Reveal>
        <Reveal delay={180}>
          <Panel title="Sürü Sağlık Durumu">
            {data ? (
              <DonutChart data={data.herdHealth} total={formatNumber(totals?.animals)} />
            ) : (
              <SkeletonBlock rows={4} height={22} />
            )}
          </Panel>
        </Reveal>
      </div>

      <div className="dashboard-main-grid">
        <div className="dashboard-main-column">
          <Panel title="Tarlalarım" action={<Link href="/tarlalar">Tüm Tarlalar</Link>}>
            <div className="compact-list image-list">
              {!data && <SkeletonBlock rows={3} height={40} />}
              {data?.fields.map((field) => (
                <Link href={`/tarlalar/${field.slug}`} key={field.id}>
                  <Image
                    src={field.imageUrl || "/assets/field_north.png"}
                    alt=""
                    width={108}
                    height={58}
                    unoptimized
                  />
                  <span>
                    <strong>{field.name}</strong>
                    <small>
                      {formatNumber(field.areaDonum)} Dönüm · {field.soilType}
                    </small>
                  </span>
                  <b>{field.crop}</b>
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <div className="dashboard-main-column">
          <Panel title="Son Hasatlar" action={<Link href="/ekim-hasat">Tümünü Gör</Link>}>
            <div className="compact-list">
              {!data && <SkeletonBlock rows={3} height={30} />}
              {data?.recentHarvests.map((harvest) => (
                <div key={harvest.id}>
                  <Leaf />
                  <span>
                    <strong>{harvest.crop}</strong>
                    <small>{harvest.fieldName}</small>
                  </span>
                  <b>{withUnit(harvest.amount, harvest.unit)}</b>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Aktivite Akışı" action={<Link href="/raporlar">Tümünü Gör</Link>}>
            <div className="activity-list">
              {!activity && <SkeletonBlock rows={4} height={18} />}
              {activity?.map((item) => (
                <span key={`${item.kind}-${item.id}`}>
                  <i className={`dot dot-${item.tone}`} /> {item.text}
                  <time>{formatRelative(item.at)}</time>
                </span>
              ))}
            </div>
          </Panel>
        </div>

        <div className="dashboard-side-column">
          <Panel title="Son Alarmlar" action={<Link href="/alarmlar">Tümünü Gör</Link>}>
            <div className="alert-list">
              {!data && <SkeletonBlock rows={3} height={30} />}
              {data?.recentAlerts.map((alert) => {
                const Icon = ALERT_ICON[alert.source] ?? AlarmClock;
                const tone = alert.severity === "kritik" ? "alert-red" : "alert-orange";
                return (
                  <Link className={tone} key={alert.id} href="/alarmlar">
                    <Icon />
                    <b>{alert.title}</b>
                    <small>
                      {alert.subject} · {formatRelative(alert.createdAt)}
                    </small>
                  </Link>
                );
              })}
            </div>
          </Panel>
          <Panel
            title={data?.camera ? `Kamera - ${data.camera.name}` : "Kamera"}
            action={<Link href="/kameralar">Tüm Kameralar</Link>}
          >
            <Link className="camera-preview" href="/kameralar">
              <Image
                src={data?.camera?.snapshotUrl || "/assets/camera_barn.png"}
                alt={data?.camera?.name ?? "Kamera"}
                fill
                unoptimized
              />
              {data?.camera?.isRecording && <span>CANLI</span>}
            </Link>
          </Panel>
        </div>
      </div>

      <Reveal delay={200}>
        <div style={{ marginTop: "16px" }}>
          <FarmMapAndWeather />
        </div>
      </Reveal>
    </div>
  );
}

export default DashboardView;
