/**
 * Backend yanitlarinin arayuz tarafindaki tip karsiliklari.
 * Sunucu bicimlendirme yaptigi icin (etiketler, yuzdeler, seriler) burada
 * ek donusum gerekmez; alanlar dogrudan bilesenlere baglanir.
 */

export type SeriesPoint = {
  name: string;
  value: number;
  secondary?: number;
  profit?: number;
};

export type Distribution = { name: string; value: number; percent?: number };

// --- Dashboard ---------------------------------------------------------------

export type DashboardOverview = {
  farmName: string;
  totals: {
    animals: number;
    milking: number;
    milkingPercent: number;
    dry: number;
    dryPercent: number;
    calves: number;
    calvesPercent: number;
    fields: number;
    stockQuantity: number;
    stockUnit: string;
    openAlerts: number;
    criticalAlerts: number;
    upcomingBirths: number;
    todayEvents: number;
  };
  milk: { total: number; changePercent: number; series: SeriesPoint[] };
  fieldYield: { total: number; changePercent: number; series: SeriesPoint[] };
  stockDistribution: Distribution[];
  herdHealth: Distribution[];
  fields: Array<{
    id: string;
    slug: string;
    name: string;
    code: string;
    crop: string;
    soilType: string;
    areaDonum: number;
    imageUrl: string | null;
  }>;
  recentHarvests: Array<{
    id: string;
    crop: string;
    fieldName: string;
    amount: number;
    unit: string;
    date: string;
  }>;
  recentAlerts: AlertRow[];
  camera: { id: string; name: string; snapshotUrl: string | null; isRecording: boolean } | null;
  weather: {
    temperature: number;
    condition: string;
    humidity: number;
    windKph: number;
    updatedAt: string;
  } | null;
  mapImageUrl: string | null;
};

export type ActivityItem = {
  id: string;
  kind: string;
  tone: string;
  text: string;
  at: string;
};

// --- Alarmlar ----------------------------------------------------------------

export type AlertRow = {
  id: string;
  type: string;
  title: string;
  source: string;
  sourceLabel: string;
  severity: string;
  severityLabel: string;
  status: string;
  statusLabel: string;
  message: string;
  subject: string;
  animal: { id: string; earTag: string; breed?: string } | null;
  field: { id: string; name: string } | null;
  camera: { id: string; name: string } | null;
  zone: { id: string; name: string } | null;
  assignedLabel: string;
  cameraVerified: boolean;
  imageUrl: string | null;
  createdAt: string;
};

export type AlertSummary = {
  totals: {
    total: number;
    activeCritical: number;
    today: number;
    todayChangePercent: number;
    resolved: number;
    resolvedChangePercent: number;
    cameraVerified: number;
    pendingAction: number;
  };
  severityDistribution: Distribution[];
  sourceDistribution: Distribution[];
  trend24h: SeriesPoint[];
  highlights: AlertRow[];
};

// --- Sürü --------------------------------------------------------------------

export type AnimalRow = {
  id: string;
  earTag: string;
  name: string;
  breed: string;
  gender: string;
  genderLabel: string;
  birthDate: string | null;
  ageLabel: string;
  status: string;
  lactationStage: string;
  lactationLabel: string;
  lactationNumber: number;
  weightKg: number | null;
  barnSection: string;
  photoUrl: string | null;
  lastInseminationAt: string | null;
  expectedBirthAt: string | null;
  daysToBirth: number | null;
  dailyMilkLiters: number;
  healthScore: number;
  healthLabel: string;
  bodyTemperature: number | null;
  ruminationMinutes: number | null;
  activityMinutes: number | null;
  lastVetCheckAt: string | null;
  zoneName: string | null;
  device: {
    id: string;
    label: string | null;
    batteryLevel: number | null;
    status: string | null;
    lastSeenAt: string | null;
  } | null;
  lastSeenAt: string | null;
};

export type AnimalSummary = {
  totals: {
    total: number;
    milking: number;
    dry: number;
    calves: number;
    heifers: number;
    upcomingBirths: number;
    openAlerts: number;
  };
  healthDistribution: Distribution[];
  barnDistribution: Array<{ name: string; count: number; percent: number }>;
  breeds: string[];
  upcomingBirths: Array<{
    _id: string;
    earTag: string;
    breed?: string;
    expectedBirthAt: string;
    daysLeft: number;
  }>;
  milkTrend: SeriesPoint[];
};

export type AnimalDetail = {
  animal: Record<string, unknown> & {
    _id: string;
    earTag: string;
    breed?: string;
    gender: string;
    birthDate?: string;
    photoUrl?: string;
    barnSection?: string;
    lactationNumber?: number;
    lactationStage?: string;
    status?: string;
    dailyMilkLiters?: number;
    healthScore?: number;
    bodyTemperature?: number;
    ruminationMinutes?: number;
    activityMinutes?: number;
    lastInseminationAt?: string;
    expectedBirthAt?: string;
    lastVetCheckAt?: string;
    lastSeenAt?: string;
    currentZone?: { name: string } | null;
    device?: {
      _id: string;
      macAddress: string;
      label?: string;
      batteryLevel?: number;
      status?: string;
      lastSeenAt?: string;
      firmwareVersion?: string;
    } | null;
    healthRecords?: Array<{ _id: string; type: string; title: string; date: string }>;
  };
  alerts: Array<{
    _id: string;
    type: string;
    title?: string;
    severity: string;
    status: string;
    message: string;
    createdAt: string;
  }>;
  healthRecords: Array<{ _id: string; type: string; title: string; date: string; performedBy?: string }>;
  timeline: Array<{ key: string; label: string; date: string | null; done: boolean }>;
  milkSeries: SeriesPoint[];
  /** Zamana bağlı etiketler sunucuda hesaplanır (render saf kalsın diye). */
  derived: {
    ageLabel: string;
    healthLabel: string;
    lactationLabel: string;
    daysToBirth: number | null;
  };
};

// --- Tarlalar ----------------------------------------------------------------

export type FieldRow = {
  id: string;
  slug: string;
  name: string;
  code: string;
  crop: string;
  cropVariety: string;
  soilType: string;
  areaDonum: number;
  areaHectares: number | null;
  imageUrl: string | null;
  growthStage: string;
  sowingDate: string | null;
  expectedHarvestDate: string | null;
  irrigation: {
    method: string;
    status: string;
    statusLabel: string;
    moisturePercent: number | null;
    label: string;
    lastIrrigatedAt: string | null;
  };
  altitudeMeters: number | null;
  slopePercent: number | null;
  locality: string;
  expectedYieldPerDonum: number;
  actualYieldPerDonum: number;
  yieldUnit: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type FieldSummary = {
  totals: {
    fields: number;
    areaDonum: number;
    activeSowing: number;
    nearHarvest: number;
    activeIrrigation: number;
    criticalAlerts: number;
  };
  cropDistribution: Distribution[];
  irrigationDistribution: Distribution[];
  irrigationHealthPercent: number;
  yieldTrend: SeriesPoint[];
  criticalField: {
    _id: string;
    name: string;
    imageUrl?: string;
    irrigation?: { moisturePercent?: number; lastIrrigatedAt?: string };
  } | null;
  recentRecords: Array<{
    id: string;
    type: string;
    crop: string;
    fieldName: string;
    date: string;
    amount: number;
    unit: string;
  }>;
};

export type FieldDetail = {
  field: Record<string, unknown> & {
    _id: string;
    name: string;
    code?: string;
    crop?: string;
    cropVariety?: string;
    soilType?: string;
    areaDonum?: number;
    imageUrl?: string;
    altitudeMeters?: number;
    slopePercent?: number;
    locality?: string;
    notes?: string;
    growthStage?: string;
    sowingDate?: string;
    expectedHarvestDate?: string;
    createdAt?: string;
    updatedAt?: string;
    irrigation?: { method?: string; status?: string; moisturePercent?: number };
    boundary?: { coordinates: number[][][] };
    operations?: Array<{ _id: string; type: string; date: string }>;
  };
  records: Array<{
    _id: string;
    type: string;
    crop: string;
    variety?: string;
    date: string;
    amount: number;
    unit: string;
    status: string;
  }>;
  operations: Array<{ _id: string; type: string; date: string }>;
  yieldSummary: {
    expectedPerDonum: number;
    actualPerDonum: number;
    totalYield: number;
    unit: string;
    achievementPercent: number;
  };
};

// --- Ekim & Hasat ------------------------------------------------------------

export type CropRecordRow = {
  id: string;
  type: string;
  typeLabel: string;
  date: string;
  fieldId: string | null;
  fieldName: string;
  fieldSlug: string | null;
  crop: string;
  variety: string;
  areaDonum: number;
  amount: number;
  unit: string;
  method: string;
  cost: number;
  revenue: number;
  yieldPerDonum: number | null;
  status: string;
  statusLabel: string;
  season: string;
  notes: string;
};

export type CropSummary = {
  type: string;
  totals: {
    records: number;
    totalArea: number;
    seasonArea: number;
    seasonCompletionPercent: number;
    totalCost: number;
    totalRevenue: number;
    costPerDonum: number;
    averageYield: number;
    yieldChangePercent: number;
  };
  monthlyArea: SeriesPoint[];
  cropDistribution: Distribution[];
};

// --- Stok --------------------------------------------------------------------

export type StockRow = {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  warehouse: string;
  quantity: number;
  unit: string;
  minLevel: number;
  capacity: number | null;
  fillPercent: number | null;
  unitPrice: number;
  totalValue: number;
  lastIn: string;
  lastInAt: string | null;
  lastOut: string;
  lastOutAt: string | null;
  level: string;
  levelLabel: string;
};

export type StockSummary = {
  totals: {
    totalQuantity: number;
    unit: string;
    warehouses: number;
    criticalCount: number;
    lastIn: number;
    lastOut: number;
    inMovements: number;
    outMovements: number;
    turnoverRate: number;
    totalValue: number;
  };
  distribution: Distribution[];
  monthlyTrend: SeriesPoint[];
  warehouseFill: Distribution[];
  criticalItems: StockRow[];
};

export type StockMovementRow = {
  id: string;
  direction: string;
  directionLabel: string;
  itemName: string;
  warehouse: string;
  amount: number;
  unit: string;
  signedAmount: string;
  date: string;
  reason: string;
};

// --- Finans ------------------------------------------------------------------

export type FinanceTransactionRow = {
  id: string;
  type: string;
  code: string;
  date: string;
  description: string;
  category: string;
  counterparty: string;
  paymentMethod: string;
  paymentMethodLabel: string;
  amount: number;
  paidAmount: number;
  remaining: number;
  status: string;
  statusLabel: string;
  dueDate: string | null;
};

export type FinanceSummary = {
  year: number;
  totals: {
    income: number;
    incomeChangePercent: number;
    expense: number;
    expenseChangePercent: number;
    net: number;
    netChangePercent: number;
    marginPercent: number;
    marginChangePercent: number;
  };
  monthly: SeriesPoint[];
  expenseDistribution: Distribution[];
  cash: {
    total: number;
    cash: number;
    bank: number;
    accounts: Array<{ id: string; name: string; type: string; bankName: string | null; balance: number }>;
  };
  recentTransactions: FinanceTransactionRow[];
  budgets: Array<{ id: string; category: string; planned: number; spent: number; usagePercent: number }>;
  balances: {
    receivables: number;
    payables: number;
    netCashFlow: number;
    annualInvestment: number;
  };
};

export type FinanceLedgerData = {
  type: string;
  year: number;
  totals: {
    total: number;
    totalChangePercent: number;
    month: number;
    monthChangePercent: number;
    settled: number;
    settledPercent: number;
    pending: number;
    pendingPercent: number;
    averageTransaction: number;
    transactionCount: number;
  };
  monthly: SeriesPoint[];
  categoryDistribution: Distribution[];
  topCategories: Distribution[];
  settlementPercent: number;
  upcoming: Array<{ id: string; date: string; title: string; amount: number; label: string }>;
};

// --- Takvim ------------------------------------------------------------------

export type CalendarEventRow = {
  id: string;
  title: string;
  type: string;
  typeLabel: string;
  status: string;
  priority: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  day: number;
  time: string;
  label: string;
  location: string;
  description: string;
  assignedLabel: string;
};

export type CalendarMonth = {
  year: number;
  month: number;
  monthLabel: string;
  events: CalendarEventRow[];
  byDay: Record<string, string[]>;
};

export type CalendarSummary = {
  totals: {
    today: number;
    upcomingBirths: number;
    plannedHarvests: number;
    vetAppointments: number;
    irrigationPlans: number;
    criticalReminders: number;
  };
  todayAgenda: Array<{ id: string; time: string; title: string; meta: string }>;
  upcomingBirthList: Array<{
    id: string;
    earTag: string;
    breed: string;
    ageLabel: string;
    daysLeft: number;
  }>;
  reminders: Array<{ id: string; severity: string; title: string; message: string; createdAt: string }>;
  weeklyPlan: Array<{ date: string; label: string; count: number; irrigation: number }>;
  assigneeLoad: Array<{ name: string; count: number; percent: number }>;
  typeCounts: Array<{ type: string; name: string; count: number }>;
};

// --- Kameralar ---------------------------------------------------------------

export type CameraRow = {
  id: string;
  name: string;
  group: string;
  location: string;
  zoneName: string | null;
  snapshotUrl: string | null;
  online: boolean;
  /** Saha ajani su an kare gonderiyor -> canli goruntu acilabilir. */
  live: boolean;
  statusLabel: string;
  isRecording: boolean;
  recordingLabel: string;
  lastFrameAt: string | null;
  lastFrameLabel: string;
  source: string | null;
  agentModel: string | null;
  hasAgentKey: boolean;
};

/** POST /cameras/:id/stream-token yaniti. */
export type CameraStreamToken = {
  token: string;
  expiresInSeconds: number;
  streamUrl: string;
  snapshotUrl: string;
  online: boolean;
};

export type CameraOverview = {
  totals: {
    total: number;
    online: number;
    /** Su an gercekten kare akan kamera sayisi. */
    live: number;
    recording: number;
    offline: number;
    lastSync: string | null;
  };
  cameras: CameraRow[];
  groups: Array<{ name: string; count: number }>;
  events: Array<{
    id: string;
    type: string;
    typeLabel: string;
    cameraName: string;
    thumbnailUrl: string | null;
    occurredAt: string;
    timeLabel: string;
  }>;
};

// --- Raporlar ----------------------------------------------------------------

export type ReportRow = {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  format: string;
  generatedAt: string;
  generatedBy: string;
  isScheduled: boolean;
  scheduleLabel: string | null;
  downloadCount: number;
};

export type ReportSummary = {
  totals: {
    total: number;
    categories: number;
    thisMonth: number;
    thisMonthChangePercent: number;
    scheduled: number;
    exports: number;
  };
  monthlyActivity: SeriesPoint[];
  categories: Array<{ category: string; name: string; count: number }>;
  recent: ReportRow[];
};

// --- Kullanıcılar & Ayarlar --------------------------------------------------

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  jobTitle: string | null;
  accessScope: string;
  phone: string | null;
  avatarUrl: string | null;
  status: string;
  statusLabel: string;
  lastLoginAt: string | null;
};

export type UserSummary = {
  totals: { total: number; active: number; admins: number; invited: number; onlineToday: number };
  roleDistribution: Array<{ role: string; name: string; count: number }>;
};

export type UsageMetric = { used: number; limit: number; percent: number };

export type FarmSettings = {
  business: {
    id: string;
    name: string;
    businessType: string;
    taxNumber: string;
    phone: string;
    email: string;
    address: string;
    timezone: string;
    logoUrl: string | null;
    mapImageUrl: string | null;
  };
  subscription: {
    plan: string;
    startedAt: string | null;
    renewalAt: string | null;
    animals: UsageMetric;
    fields: UsageMetric;
    cameras: UsageMetric;
    users: UsageMetric;
    storage: UsageMetric;
    devices: number;
  };
  preferences: Record<string, boolean>;
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChangeAt: string | null;
    passwordChangedDaysAgo: number | null;
  };
};
