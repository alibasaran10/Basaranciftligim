"use client";

import { Camera, Grid3X3, Maximize2, Plus, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { LiveCamera } from "@/components/camera/LiveCamera";
import { ErrorState, SkeletonBlock } from "@/components/ui/AsyncState";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { formatNumber, formatTime } from "@/lib/format";
import type { CameraOverview, CameraRow } from "@/lib/types";
import { useApi } from "@/lib/useApi";

const TABS = ["Canlı İzleme", "Kamera Listesi", "Kayıtlar", "Olaylar"] as const;

/** Kamera ekraninin genel verisi bu araliklarla tazelenir. */
const OVERVIEW_REFRESH_MS = 10_000;

type CameraEventRow = {
  id: string;
  type: string;
  typeLabel: string;
  cameraName: string;
  group: string;
  occurredAt: string;
  timeLabel: string;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
};

export function CamerasView() {
  const [tab, setTab] = useState(0);
  const [group, setGroup] = useState("Tümü");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useApi<CameraOverview>("/cameras/overview");

  // Kamera durumlari (cevrimici/canli) surekli degisir; ekran acik kaldigi
  // surece periyodik tazelenir ki "Canli" rozeti gercegi yansitsin.
  useEffect(() => {
    const timer = setInterval(refetch, OVERVIEW_REFRESH_MS);
    return () => clearInterval(timer);
  }, [refetch]);

  const cameras = useMemo(
    () =>
      (data?.cameras ?? []).filter(
        (camera) => group === "Tümü" || camera.group === group,
      ),
    [data?.cameras, group],
  );

  // Secili kamera: kullanici secmediyse yayinda olan ilk kamera.
  const selected: CameraRow | null = useMemo(() => {
    if (!cameras.length) return null;
    const found = cameras.find((camera) => camera.id === selectedId);
    return found ?? cameras.find((camera) => camera.live) ?? cameras[0];
  }, [cameras, selectedId]);

  const rows = cameras.map((camera) => [
    camera.name,
    camera.group,
    camera.location,
    camera.statusLabel,
    camera.lastFrameLabel,
    camera.recordingLabel,
  ]);

  return (
    <div className="page-stack page-enter">
      <PageHeader
        eyebrow="Kameralar / Canlı İzleme"
        title="Kameralar"
        description={
          data
            ? `${formatNumber(data.totals.total)} kameranın ${formatNumber(
                data.totals.live,
              )} tanesi canlı yayında, ${formatNumber(data.totals.recording)} tanesi kayıt yapıyor.`
            : "Kamera verileri yükleniyor…"
        }
        icon={<Camera />}
        primaryLabel="Yeni Kamera"
      />

      {error && <ErrorState message={error} onRetry={refetch} />}

      <div className="tabs">
        {TABS.map((label, index) => (
          <button
            key={label}
            className={tab === index ? "is-active" : ""}
            onClick={() => setTab(index)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <LiveTab
          data={data}
          loading={loading}
          cameras={cameras}
          selected={selected}
          onSelect={setSelectedId}
          group={group}
          onGroupChange={setGroup}
        />
      )}

      {tab === 1 && (
        <Panel title="Kamera Listesi" className="table-panel">
          <DataTable
            loading={loading}
            headers={["Kamera Adı", "Grup", "Konum", "Durum", "Son Görüntü", "Kayıt Durumu"]}
            rows={rows}
          />
        </Panel>
      )}

      {tab === 2 && <EventsTab title="Kayıtlar" type="kayit_baslatildi" showDuration />}

      {tab === 3 && <EventsTab title="Olaylar" />}
    </div>
  );
}

// ---------------------------------------------------------------------------

type LiveTabProps = {
  data: CameraOverview | null;
  loading: boolean;
  cameras: CameraRow[];
  selected: CameraRow | null;
  onSelect: (id: string) => void;
  group: string;
  onGroupChange: (name: string) => void;
};

function LiveTab({
  data,
  loading,
  cameras,
  selected,
  onSelect,
  group,
  onGroupChange,
}: LiveTabProps) {
  return (
    <div className="camera-layout">
      <div>
        {/*
          Secili kamera tam MJPEG akisiyla gosterilir; izgaradaki kartlar
          birkac saniyede bir tazelenen tek kare kullanir. Boylece 12
          kameralik bir ekran tarayicinin es zamanli baglanti sinirina
          takilmaz (bkz. LiveCamera.tsx).
        */}
        {selected && (
          <Panel
            title={selected.name}
            action={
              <span className="panel-tools">
                <span className={selected.live ? "camera-dot is-live" : "camera-dot"} />
                {selected.statusLabel}
                <Maximize2 />
              </span>
            }
          >
            <LiveCamera
              cameraId={selected.id}
              cameraName={selected.name}
              live={selected.live}
              posterUrl={selected.snapshotUrl}
              mode="live"
              className="camera-stage"
            />
            <div className="camera-stage-meta">
              <span>{selected.location}</span>
              <span>Son görüntü: {selected.lastFrameLabel}</span>
              {selected.agentModel && <span>{selected.agentModel}</span>}
              {!selected.hasAgentKey && (
                <span className="camera-hint">
                  Bu kameraya henüz saha ajanı bağlanmadı — kurulum için pi-agent/README.md
                </span>
              )}
            </div>
          </Panel>
        )}

        <Panel
          title="Canlı İzleme"
          action={
            <span className="panel-tools">
              <Grid3X3 />
            </span>
          }
        >
          {loading && !data ? (
            <SkeletonBlock rows={3} height={110} />
          ) : cameras.length === 0 ? (
            <p className="empty-note">Bu grupta kamera yok.</p>
          ) : (
            <div className="camera-grid">
              {cameras.map((camera) => (
                <article
                  key={camera.id}
                  onClick={() => onSelect(camera.id)}
                  className={selected?.id === camera.id ? "is-selected" : ""}
                >
                  <LiveCamera
                    cameraId={camera.id}
                    cameraName={camera.name}
                    live={camera.live}
                    posterUrl={camera.snapshotUrl}
                    mode="snapshot"
                    className="camera-thumb"
                  />
                  <span>
                    <strong>{camera.name}</strong>
                    <small>{camera.lastFrameLabel}</small>
                    <Video />
                  </span>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="camera-sidebar">
        <Panel title="Kamera Grupları" action={<Plus />}>
          <div className="action-list">
            {!data && <SkeletonBlock rows={4} height={30} />}
            {data?.groups.map((item) => (
              <button
                key={item.name}
                className={group === item.name ? "is-active" : ""}
                onClick={() => onGroupChange(item.name)}
              >
                <Camera /> {item.name} · {item.count}
                <b>›</b>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Son Kayıtlar / Olaylar">
          <div className="recording-list">
            {!data && <SkeletonBlock rows={4} height={40} />}
            {data?.events.length === 0 && <p className="empty-note">Henüz olay yok.</p>}
            {data?.events.map((event) => (
              <div key={event.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.thumbnailUrl || "/assets/camera_barn.png"}
                  alt=""
                  width={80}
                  height={48}
                />
                <span>
                  <b>{event.typeLabel}</b>
                  <strong>{event.cameraName}</strong>
                  <small>{formatTime(event.occurredAt)}</small>
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

/**
 * "Kayitlar" ve "Olaylar" sekmeleri ayni ucu kullanir; tek fark
 * kayitlarin yalnizca klip ureten olaylari (kayit_baslatildi) gostermesi.
 */
function EventsTab({
  title,
  type,
  showDuration = false,
}: {
  title: string;
  type?: string;
  showDuration?: boolean;
}) {
  const path = type
    ? `/cameras/events?limit=50&type=${encodeURIComponent(type)}`
    : "/cameras/events?limit=50";

  const { data, loading, error, refetch } = useApi<CameraEventRow[]>(path);

  const headers = showDuration
    ? ["Kamera", "Grup", "Tür", "Tarih", "Saat", "Süre"]
    : ["Kamera", "Grup", "Tür", "Tarih", "Saat"];

  const rows = (data ?? []).map((event) => {
    const base = [
      event.cameraName,
      event.group,
      event.typeLabel,
      new Date(event.occurredAt).toLocaleDateString("tr-TR"),
      event.timeLabel,
    ];
    return showDuration
      ? [...base, event.durationSeconds ? `${event.durationSeconds} sn` : "—"]
      : base;
  });

  return (
    <>
      {error && <ErrorState message={error} onRetry={refetch} />}
      <Panel title={title} className="table-panel">
        {!loading && rows.length === 0 ? (
          <p className="empty-note">Kayıt bulunamadı.</p>
        ) : (
          <DataTable loading={loading} headers={headers} rows={rows} />
        )}
      </Panel>
    </>
  );
}

export default CamerasView;
