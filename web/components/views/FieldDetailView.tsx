"use client";

import {
  CalendarDays,
  Droplets,
  FileText,
  Gauge,
  Leaf,
  MapPin,
  Mountain,
  Sprout,
  ThermometerSun,
  Wheat,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { formatDate, formatNumber, formatPercent, withUnit, formatArea } from "@/lib/format";
import type { FieldDetail } from "@/lib/types";
import { useApi } from "@/lib/useApi";

const TABS = ["Genel Bakış", "Ekim / Hasat Kayıtları", "Verim Analizi", "Maliyetler", "Notlar & Belgeler"];

const OPERATION_LABELS: Record<string, string> = {
  suruldu: "Sürüldü",
  ekildi: "Ekim",
  bicildi: "Biçildi",
  hasat_edildi: "Hasat",
  balyalandi: "Balyalandı",
  gubrelendi: "Gübreleme",
  ilaclandi: "İlaçlama",
  sulandi: "Sulama",
};

export function FieldDetailView({ slug }: { slug: string }) {
  const [tab, setTab] = useState(0);
  const { data, loading, error, refetch } = useApi<FieldDetail>(`/fields/by-slug/${slug}`);

  const field = data?.field;
  const yieldSummary = data?.yieldSummary;

  if (error) {
    return (
      <div className="page-stack page-enter">
        <PageHeader title="Tarla Detayı" eyebrow="Tarla Yönetimi" primaryLabel="Yeni İşlem" />
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  const coordinates = field?.boundary?.coordinates?.[0]?.[0];

  return (
    <div className="page-stack page-enter">
      <PageHeader
        title={field?.name ?? "Tarla Detayı"}
        eyebrow={`Tarla Yönetimi / ${field?.name ?? "…"}`}
        primaryLabel="Yeni İşlem"
      />

      <div className="tabs">
        {TABS.map((label, index) => (
          <button key={label} className={tab === index ? "is-active" : ""} onClick={() => setTab(index)}>
            {label}
          </button>
        ))}
      </div>

      <div className="field-hero-grid">
        <div className="field-hero-image">
          <Image
            src={field?.imageUrl || "/assets/field_north.png"}
            alt={field?.name ?? ""}
            fill
            unoptimized
          />
          <button>
            <MapPin /> Haritada Görüntüle
          </button>
        </div>

        <Panel className="field-facts-panel">
          {field ? (
            <div className="field-facts">
              {[
                [MapPin, "Tarla Adı", field.name],
                [Sprout, "Toprak Tipi", field.soilType ?? "—"],
                [Leaf, "Arazi Büyüklüğü", formatArea(field.areaDonum)],
                [Mountain, "Rakım", field.altitudeMeters ? `${formatNumber(field.altitudeMeters)} m` : "—"],
                [Gauge, "Eğim", field.slopePercent != null ? `%${field.slopePercent}` : "—"],
                [Droplets, "Sulama Durumu", field.irrigation?.method ?? "—"],
                [CalendarDays, "Oluşturulma Tarihi", formatDate(field.createdAt)],
                [CalendarDays, "Son Güncelleme", formatDate(field.updatedAt)],
                [Leaf, "Durum", field.growthStage ?? "—"],
              ].map(([Icon, label, value]) => {
                const FactIcon = Icon as typeof Leaf;
                return (
                  <span key={label as string}>
                    <FactIcon />
                    <small>{label as string}</small>
                    <b>{value as string}</b>
                  </span>
                );
              })}
            </div>
          ) : (
            <SkeletonBlock rows={6} height={24} />
          )}
        </Panel>

        <Panel title="Konum">
          <Image
            className="location-map"
            src="/assets/farm_map.png"
            alt="Tarla konumu"
            width={500}
            height={250}
            unoptimized
          />
          <div className="map-meta">
            <span>
              <small>Köy / Mevki</small>
              <b>{field?.locality || "—"}</b>
            </span>
            <span>
              <small>Koordinatlar</small>
              <b>
                {coordinates
                  ? `${coordinates[1].toFixed(4)}° N, ${coordinates[0].toFixed(4)}° E`
                  : "—"}
              </b>
            </span>
          </div>
        </Panel>
      </div>

      <div className="field-detail-grid">
        <Panel title="Mevcut Ürün Bilgileri">
          {field ? (
            <>
              <div className="crop-card-title">
                <Wheat />
                <span>
                  <strong>{field.crop ?? "—"}</strong>
                  <small>{field.cropVariety ?? ""}</small>
                </span>
                <Badge>{field.growthStage ?? "—"}</Badge>
              </div>
              <div className="info-grid">
                <span>
                  <small>Ekim Tarihi</small>
                  <b>{formatDate(field.sowingDate)}</b>
                </span>
                <span>
                  <small>Hasat Tarihi</small>
                  <b>{formatDate(field.expectedHarvestDate)}</b>
                </span>
                <span>
                  <small>Sulama Yöntemi</small>
                  <b>{field.irrigation?.method ?? "—"}</b>
                </span>
                <span>
                  <small>Tohum Çeşidi</small>
                  <b>{field.cropVariety ?? "—"}</b>
                </span>
              </div>
              <Link className="button button-secondary" href="/ekim-hasat">
                Ekim / Hasat Geçmişi
              </Link>
            </>
          ) : (
            <SkeletonBlock rows={5} height={24} />
          )}
        </Panel>

        <Panel title="Verim Özeti">
          {yieldSummary ? (
            <>
              <div className="yield-cards">
                <span>
                  <Sprout />
                  <small>Beklenen Verim</small>
                  <strong>
                    {formatNumber(yieldSummary.expectedPerDonum)}{" "}
                    <em>{yieldSummary.unit} / Dönüm</em>
                  </strong>
                </span>
                <span>
                  <Leaf />
                  <small>Gerçekleşen Verim</small>
                  <strong>
                    {formatNumber(yieldSummary.actualPerDonum)} <em>{yieldSummary.unit} / Dönüm</em>
                  </strong>
                </span>
                <span>
                  <Wheat />
                  <small>Toplam Verim</small>
                  <strong>
                    {formatNumber(yieldSummary.totalYield)} <em>{yieldSummary.unit}</em>
                  </strong>
                </span>
              </div>
              <div className="achievement">
                <i>
                  <em style={{ width: `${Math.min(100, yieldSummary.achievementPercent)}%` }} />
                </i>
                <strong>{formatPercent(yieldSummary.achievementPercent)}</strong>
                <small>Hedefe Ulaşma Oranı</small>
              </div>
            </>
          ) : (
            <SkeletonBlock rows={4} height={30} />
          )}
        </Panel>

        <Panel title="Hızlı İşlemler">
          <div className="action-list">
            {[
              [Sprout, "Yeni Ekim Kaydı Oluştur"],
              [Wheat, "Hasat Kaydı Ekle"],
              [FileText, "Gübreleme Kaydı Ekle"],
              [Droplets, "Sulama Kaydı Ekle"],
              [ThermometerSun, "İlaçlama Kaydı Ekle"],
            ].map(([Icon, label]) => {
              const ItemIcon = Icon as typeof Sprout;
              return (
                <button key={label as string}>
                  <ItemIcon /> {label as string}
                  <b>›</b>
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="field-bottom-grid">
        <Panel title="İşlem Takvimi">
          <div className="timeline field-timeline">
            {loading && <SkeletonBlock rows={5} height={26} />}
            {data?.operations.map((operation) => {
              const done = new Date(operation.date) <= new Date();
              return (
                <span className={done ? "is-done" : ""} key={operation._id}>
                  <i>{done ? "✓" : "•"}</i>
                  <b>{OPERATION_LABELS[operation.type] ?? operation.type}</b>
                  <small>{formatDate(operation.date)}</small>
                </span>
              );
            })}
            {data?.operations.length === 0 && (
              <span>
                <i>•</i>
                <b>İşlem kaydı yok</b>
                <small>Bu tarla için henüz işlem girilmemiş.</small>
              </span>
            )}
          </div>
        </Panel>

        <Panel title="Ekim / Hasat Kayıtları" action={<Link href="/ekim-hasat">Tümü</Link>}>
          <div className="compact-list">
            {loading && <SkeletonBlock rows={3} height={30} />}
            {data?.records.slice(0, 5).map((record) => (
              <div key={record._id}>
                {record.type === "hasat" ? <Wheat /> : <Leaf />}
                <span>
                  <strong>
                    {record.crop} {record.variety ? `· ${record.variety}` : ""}
                  </strong>
                  <small>{formatDate(record.date)}</small>
                </span>
                <b>{withUnit(record.amount, record.unit)}</b>
              </div>
            ))}
            {data?.records.length === 0 && (
              <div>
                <Leaf />
                <span>
                  <strong>Kayıt yok</strong>
                  <small>Bu tarla için ekim/hasat kaydı bulunmuyor.</small>
                </span>
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Notlar">
          <div className="note-card">
            <p>{field?.notes || "Bu tarla için not girilmemiş."}</p>
            <small>{formatDate(field?.updatedAt)}</small>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default FieldDetailView;
