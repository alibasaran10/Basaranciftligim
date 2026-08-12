import mongoose from 'mongoose';
import { catchAsync } from '../../common/http/catchAsync.js';
import { sendSuccess, sendCreated } from '../../common/http/response.js';
import { ApiError } from '../../common/errors/ApiError.js';
import CalendarEvent from './event.model.js';
import Animal from '../animal/animal.model.js';
import Alert from '../alert/alert.model.js';
import {
  EVENT_TYPE,
  EVENT_STATUS,
  ALERT_STATUS,
  ALERT_SEVERITY,
} from '../../common/constants.js';

/** Tarih gruplamalarinda kullanilan ciftlik saat dilimi. */
const FARM_TIMEZONE = 'Europe/Istanbul';

function farmObjectId(req) {
  const farmId = req.auth?.farmId;
  if (!farmId) throw ApiError.forbidden('Hesabiniz bir ciftlige bagli degil');
  return new mongoose.Types.ObjectId(farmId);
}

export const EVENT_TYPE_LABELS = Object.freeze({
  [EVENT_TYPE.BIRTH]: 'Doğum',
  [EVENT_TYPE.INSEMINATION]: 'Tohumlama',
  [EVENT_TYPE.VETERINARY]: 'Veteriner',
  [EVENT_TYPE.VACCINE]: 'Aşı',
  [EVENT_TYPE.HARVEST]: 'Hasat',
  [EVENT_TYPE.IRRIGATION]: 'Sulama',
  [EVENT_TYPE.FERTILIZING]: 'Gübreleme',
  [EVENT_TYPE.STOCK_COUNT]: 'Stok Sayımı',
  [EVENT_TYPE.MAINTENANCE]: 'Bakım',
  [EVENT_TYPE.CAMERA_CHECK]: 'Kamera Kontrolü',
  [EVENT_TYPE.OTHER]: 'Diğer',
});

/** "HH:mm" bicimi (takvim hucrelerindeki "10:00 Doğum" metni). */
function timeLabel(date) {
  return new Date(date).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function present(event) {
  return {
    id: String(event._id),
    title: event.title,
    type: event.type,
    typeLabel: EVENT_TYPE_LABELS[event.type] ?? 'Diğer',
    status: event.status,
    priority: event.priority,
    startAt: event.startAt,
    endAt: event.endAt ?? null,
    allDay: !!event.allDay,
    day: new Date(event.startAt).getDate(),
    time: event.allDay ? '' : timeLabel(event.startAt),
    label: event.allDay
      ? EVENT_TYPE_LABELS[event.type] ?? event.title
      : `${timeLabel(event.startAt)} ${EVENT_TYPE_LABELS[event.type] ?? event.title}`,
    location: event.location ?? '',
    description: event.description ?? '',
    assignedLabel: event.assignedLabel || event.assignedTo?.name || '—',
    animal: event.animal ? { id: String(event.animal._id ?? event.animal), earTag: event.animal.earTag } : null,
    field: event.field ? { id: String(event.field._id ?? event.field), name: event.field.name } : null,
  };
}

/** Query'den tarih araligi cikarir (ay gorunumu veya serbest aralik). */
function resolveRange(query) {
  if (query.from || query.to) {
    return {
      from: query.from ? new Date(query.from) : new Date(0),
      to: query.to ? new Date(query.to) : new Date(8640000000000000),
    };
  }
  const now = new Date();
  const year = Number(query.year) || now.getFullYear();
  const month = Number(query.month) || now.getMonth() + 1;
  return {
    from: new Date(year, month - 1, 1),
    to: new Date(year, month, 1),
    year,
    month,
  };
}

/** GET /events?year=&month= — ay gorunumu icin etkinlikler. */
export const list = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const { from, to, year, month } = resolveRange(req.query);

  const filter = { farm, startAt: { $gte: from, $lt: to } };
  if (req.query.type) filter.type = String(req.query.type);
  if (req.query.status) filter.status = String(req.query.status);

  const events = await CalendarEvent.find(filter)
    .sort({ startAt: 1 })
    .limit(Number(req.query.limit) || 500)
    .populate('animal', 'earTag')
    .populate('field', 'name')
    .populate('assignedTo', 'name')
    .lean();

  const items = events.map(present);

  // Ay gorunumu icin gun -> etiket listesi (takvim hucreleri).
  const byDay = {};
  for (const item of items) {
    (byDay[item.day] ||= []).push(item.label);
  }

  return sendSuccess(res, {
    data: {
      year: year ?? from.getFullYear(),
      month: month ?? from.getMonth() + 1,
      monthLabel: from.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
      events: items,
      byDay,
    },
  });
});

/**
 * GET /events/summary?year=&month=
 * Takvim ekranindaki kartlar, bugunku ajanda, yaklasan dogumlar,
 * hatirlatmalar, haftalik plan, gorev dagilimi ve tur sayaclari.
 */
export const summary = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 86400000);
  const in15Days = new Date(now.getTime() + 15 * 86400000);
  const weekEnd = new Date(startOfToday.getTime() + 7 * 86400000);

  const [
    todayCount,
    upcomingBirths,
    plannedHarvests,
    vetAppointments,
    irrigationPlans,
    criticalReminders,
    todayAgenda,
    births,
    reminders,
    weeklyAgg,
    assigneeAgg,
    typeAgg,
  ] = await Promise.all([
    CalendarEvent.countDocuments({ farm, startAt: { $gte: startOfToday, $lt: endOfToday } }),
    Animal.countDocuments({ farm, isActive: true, expectedBirthAt: { $gte: now, $lte: in15Days } }),
    CalendarEvent.countDocuments({
      farm,
      type: EVENT_TYPE.HARVEST,
      startAt: { $gte: now, $lte: in15Days },
    }),
    CalendarEvent.countDocuments({
      farm,
      type: EVENT_TYPE.VETERINARY,
      startAt: { $gte: startOfToday, $lt: weekEnd },
    }),
    CalendarEvent.countDocuments({
      farm,
      type: EVENT_TYPE.IRRIGATION,
      startAt: { $gte: startOfToday, $lt: weekEnd },
    }),
    CalendarEvent.countDocuments({
      farm,
      status: EVENT_STATUS.PLANNED,
      priority: { $in: [ALERT_SEVERITY.CRITICAL, ALERT_SEVERITY.HIGH] },
      startAt: { $gte: startOfToday },
    }),
    CalendarEvent.find({ farm, startAt: { $gte: startOfToday, $lt: endOfToday } })
      .sort({ startAt: 1 })
      .limit(8)
      .populate('assignedTo', 'name')
      .lean(),
    Animal.find({ farm, isActive: true, expectedBirthAt: { $gte: now, $lte: in15Days } })
      .select('earTag breed birthDate expectedBirthAt')
      .sort({ expectedBirthAt: 1 })
      .limit(5)
      .lean(),
    Alert.find({ farm, status: ALERT_STATUS.OPEN })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title type severity message createdAt')
      .lean(),
    // Haftalik plan: gun bazli etkinlik ve sulama sayilari.
    CalendarEvent.aggregate([
      { $match: { farm, startAt: { $gte: startOfToday, $lt: weekEnd } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$startAt', timezone: FARM_TIMEZONE },
          },
          count: { $sum: 1 },
          irrigation: {
            $sum: { $cond: [{ $eq: ['$type', EVENT_TYPE.IRRIGATION] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    CalendarEvent.aggregate([
      { $match: { farm, startAt: { $gte: startOfToday, $lt: weekEnd } } },
      {
        $group: {
          _id: { $ifNull: ['$assignedLabel', 'Atanmamış'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    CalendarEvent.aggregate([
      { $match: { farm, startAt: { $gte: startOfToday, $lt: new Date(startOfToday.getTime() + 30 * 86400000) } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const maxAssignee = assigneeAgg[0]?.count ?? 0;

  return sendSuccess(res, {
    data: {
      totals: {
        today: todayCount,
        upcomingBirths,
        plannedHarvests,
        vetAppointments,
        irrigationPlans,
        criticalReminders,
      },
      todayAgenda: todayAgenda.map((e) => ({
        id: String(e._id),
        time: e.allDay ? 'Tüm gün' : timeLabel(e.startAt),
        title: e.title,
        meta: [e.assignedLabel || e.assignedTo?.name, e.location].filter(Boolean).join(' · '),
      })),
      upcomingBirthList: births.map((a) => ({
        id: String(a._id),
        earTag: a.earTag,
        breed: a.breed ?? '',
        ageLabel: a.birthDate
          ? `${Math.floor((Date.now() - new Date(a.birthDate).getTime()) / (365.25 * 86400000))} Yaş`
          : '',
        daysLeft: Math.max(
          0,
          Math.ceil((new Date(a.expectedBirthAt).getTime() - now.getTime()) / 86400000)
        ),
      })),
      reminders: reminders.map((r) => ({
        id: String(r._id),
        severity: r.severity,
        title: r.title || r.type,
        message: r.message,
        createdAt: r.createdAt,
      })),
      weeklyPlan: weeklyAgg.map((row) => {
        const date = new Date(`${row._id}T00:00:00`);
        return {
          date: row._id,
          label: date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'short' }),
          count: row.count,
          irrigation: row.irrigation,
        };
      }),
      assigneeLoad: assigneeAgg.map((a) => ({
        name: a._id,
        count: a.count,
        percent: maxAssignee ? Math.round((a.count / maxAssignee) * 100) : 0,
      })),
      typeCounts: typeAgg.map((t) => ({
        type: t._id,
        name: EVENT_TYPE_LABELS[t._id] ?? 'Diğer',
        count: t.count,
      })),
    },
  });
});

/** POST /events */
export const create = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const event = await CalendarEvent.create({
    ...req.body,
    startAt: new Date(req.body.startAt),
    endAt: req.body.endAt ? new Date(req.body.endAt) : undefined,
    farm,
    createdBy: req.auth.userId,
  });
  return sendCreated(res, { data: present(event.toObject()), message: 'Etkinlik olusturuldu' });
});

/** PATCH /events/:id */
export const update = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const payload = { ...req.body };
  delete payload.farm;
  if (payload.startAt) payload.startAt = new Date(payload.startAt);
  if (payload.endAt) payload.endAt = new Date(payload.endAt);

  const event = await CalendarEvent.findOneAndUpdate(
    { _id: req.params.id, farm },
    { $set: payload },
    { new: true, runValidators: true }
  ).lean();
  if (!event) throw ApiError.notFound('Etkinlik bulunamadi');

  return sendSuccess(res, { data: present(event), message: 'Guncellendi' });
});

/** DELETE /events/:id */
export const remove = catchAsync(async (req, res) => {
  const farm = farmObjectId(req);
  const event = await CalendarEvent.findOneAndDelete({ _id: req.params.id, farm });
  if (!event) throw ApiError.notFound('Etkinlik bulunamadi');
  return sendSuccess(res, { message: 'Silindi' });
});

export default { list, summary, create, update, remove };
