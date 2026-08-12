import React, { useState, useEffect } from 'react';
import { 
  Home, Activity, Bell, MapPin, Camera, Settings, RefreshCw, 
  Wifi, Battery, ShieldAlert, CheckCircle2, ChevronRight, User, 
  Lock, Search, Filter, AlertTriangle, Cpu, Radio, Sparkles, Smartphone, Maximize2,
  Sprout, Leaf, Calendar, Droplets, ArrowUpRight, CloudSun, Database, FileText, Plus, X,
  TrendingUp, Award, Layers, ShieldCheck, Check, Info
} from 'lucide-react';

const API_BASE = 'http://localhost:4000/api/v1';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('surum_token') || '');
  const [email, setEmail] = useState('info@yesilvadiciftligi.com');
  const [password, setPassword] = useState('Parola123');
  const [activeTab, setActiveTab] = useState('home');
  const [fieldSubTab, setFieldSubTab] = useState('fields'); // 'fields' | 'harvest'
  const [integSubTab, setIntegSubTab] = useState('cameras'); // 'cameras' | 'devices' | 'sync'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Selected detail modal states
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedField, setSelectedField] = useState(null);

  // New field modal state
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldCrop, setNewFieldCrop] = useState('Ryegrass');
  const [newFieldArea, setNewFieldArea] = useState('35');

  // Data states
  const [dashboard, setDashboard] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [fields, setFields] = useState([]);
  const [devices, setDevices] = useState([]);
  const [isFrameMode, setIsFrameMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-login on mount if no token
  useEffect(() => {
    if (!token) {
      handleLogin();
    } else {
      fetchData();
    }
  }, [token]);



  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success && data.data?.accessToken) {
        setToken(data.data.accessToken);
        localStorage.setItem('surum_token', data.data.accessToken);
      } else {
        setError(data.error?.message || 'Giriş başarısız oldu.');
      }
    } catch (err) {
      setError('Backend sunucusuna bağlanılamadı (http://localhost:4000).');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [dashRes, animRes, alertRes, camRes, fieldRes, devRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard/summary`, { headers }),
        fetch(`${API_BASE}/animals`, { headers }),
        fetch(`${API_BASE}/alerts`, { headers }),
        fetch(`${API_BASE}/cameras`, { headers }),
        fetch(`${API_BASE}/fields`, { headers }),
        fetch(`${API_BASE}/devices`, { headers })
      ]);

      const dashData = await dashRes.json();
      const animData = await animRes.json();
      const alertData = await alertRes.json();
      const camData = await camRes.json();
      const fieldData = await fieldRes.json();
      const devData = await devRes.json();

      if (dashData.success) setDashboard(dashData.data);
      if (animData.success) setAnimals(animData.data?.items || animData.data || []);
      if (alertData.success) setAlerts(alertData.data?.items || alertData.data || []);
      if (camData.success) setCameras(camData.data?.items || camData.data || []);
      if (fieldData.success) setFields(fieldData.data?.items || fieldData.data || []);
      if (devData.success) setDevices(devData.data?.items || devData.data || []);
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.logoBadge}>
            <Sprout size={32} color="#10b981" />
          </div>
          <h2 style={styles.loginTitle}>SÜRÜM Mobil</h2>
          <p style={styles.loginSub}>Akıllı Çiftlik & Hayvan Takip Platformu</p>

          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <User size={18} color="#64748b" />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="E-posta"
                style={styles.input}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <Lock size={18} color="#64748b" />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Şifre"
                style={styles.input}
                required
              />
            </div>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredAnimals = animals.filter(a => 
    a.earTag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={isFrameMode ? styles.frameWrapper : styles.fullWrapper}>
      <div style={styles.topControlBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sprout size={18} color="#10b981" />
          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 700 }}>SÜRÜM Mobil App (v1.0.0)</span>
        </div>
        <button 
          onClick={() => setIsFrameMode(!isFrameMode)} 
          style={styles.frameToggleBtn}
        >
          {isFrameMode ? <Maximize2 size={14} /> : <Smartphone size={14} />}
          {isFrameMode ? 'Tam Ekran Modu' : 'Telefon Görünümü'}
        </button>
      </div>

      <div style={isFrameMode ? styles.phoneFrame : styles.fullPhone}>
        {/* Status Bar */}
        <div style={styles.statusBar}>
          <span>14:35</span>
          <div style={styles.notch}></div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Wifi size={14} color="#10b981" />
            <Battery size={14} color="#10b981" />
          </div>
        </div>

        {/* Header */}
        <div style={styles.appHeader}>
          <div>
            <span style={styles.headerSubtitle}>Yeşil Vadi Çiftliği</span>
            <h1 style={styles.headerTitle}>SÜRÜM Mobil</h1>
          </div>
          <button onClick={fetchData} style={styles.iconBtn} title="Verileri Yenile">
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
          </button>
        </div>

        {/* Content Body */}
        <div style={styles.appBody}>
          
          {/* ==================== 1. ANA SAYFA (HOME) ==================== */}
          {activeTab === 'home' && (
            <div style={styles.tabContent}>
              {/* Weather Widget */}
              <div style={styles.weatherCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>ÇİFTLİK HAVA DURUMU</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>24°C • Açık</div>
                    <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>Nem %45 • Rüzgar 12 km/s</div>
                  </div>
                  <CloudSun size={38} color="#f59e0b" />
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={styles.metricsGrid}>
                <div style={styles.metricCard} onClick={() => setActiveTab('herd')}>
                  <span style={styles.metricLabel}>Canlı Hayvan</span>
                  <span style={styles.metricValue}>{dashboard?.animalsCount || animals.length || 63}</span>
                  <span style={styles.metricSub}>38 Sağmal • 15 Kuru • 10 Buzağı</span>
                </div>
                <div style={styles.metricCard} onClick={() => setActiveTab('fields')}>
                  <span style={styles.metricLabel}>Tarla & Mahsul</span>
                  <span style={{ ...styles.metricValue, color: '#10b981' }}>{fields.length || 12}</span>
                  <span style={styles.metricSub}>450 Dönüm Toplam Alan</span>
                </div>
                <div style={styles.metricCard} onClick={() => setActiveTab('alerts')}>
                  <span style={styles.metricLabel}>Açık Alarmlar</span>
                  <span style={{ ...styles.metricValue, color: '#f59e0b' }}>{alerts.filter(a => a.status === 'ACTIVE').length || 12}</span>
                  <span style={styles.metricSub}>Acil Müdahale Bekleyen</span>
                </div>
                <div style={styles.metricCard} onClick={() => setActiveTab('integrations')}>
                  <span style={styles.metricLabel}>Aktif Tasmalar</span>
                  <span style={{ ...styles.metricValue, color: '#6366f1' }}>{devices.length || 57}</span>
                  <span style={styles.metricSub}>RSSI Sinyal Konumlandırma</span>
                </div>
              </div>

              {/* Recent Alerts */}
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Anlık İkazlar</h3>
                <span style={styles.seeAll} onClick={() => setActiveTab('alerts')}>Tümünü Gör</span>
              </div>
              
              <div style={styles.listStack}>
                {alerts.slice(0, 3).map((alert, i) => (
                  <div key={alert._id || i} style={styles.alertCard}>
                    <div style={styles.alertIconBg}>
                      <ShieldAlert size={20} color="#f43f5e" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.alertTitle}>{alert.title || alert.type || 'Anormal İvme Algılandı'}</div>
                      <div style={styles.alertDesc}>{alert.message || 'ESP32 tasma sensörü şüpheli hareket tespit etti.'}</div>
                    </div>
                    <span style={styles.alertBadge}>Kritik</span>
                  </div>
                ))}
              </div>

              {/* Sürü Özet Listesi */}
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Sürü Canlı Durum</h3>
                <span style={styles.seeAll} onClick={() => setActiveTab('herd')}>Sürüye Git</span>
              </div>

              <div style={styles.listStack}>
                {animals.slice(0, 4).map((animal, i) => (
                  <div key={animal._id || i} style={styles.animalRow} onClick={() => setSelectedAnimal(animal)}>
                    <div style={styles.animalAvatar}>
                      {animal.category === 'COW' ? '🐄' : animal.category === 'SHEEP' ? '🐑' : '🐐'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.animalTag}>{animal.earTag || `TR-34-${100 + i}`}</div>
                      <div style={styles.animalSub}>{animal.name || 'Holstein Sığır'} • {animal.status || 'SAĞLIKLI'}</div>
                    </div>
                    <div style={styles.locationChip}>
                      <MapPin size={12} color="#10b981" />
                      <span>{animal.currentZone?.name || 'Büyük Ahır'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 2. TARLALAR & MAHSUL (FIELDS) ==================== */}
          {activeTab === 'fields' && (
            <div style={styles.tabContent}>
              {/* Field Sub Tabs */}
              <div style={styles.subTabBar}>
                <button 
                  style={fieldSubTab === 'fields' ? styles.subTabActive : styles.subTab}
                  onClick={() => setFieldSubTab('fields')}
                >
                  <Leaf size={16} />
                  <span>Tarlalarım ({fields.length || 12})</span>
                </button>
                <button 
                  style={fieldSubTab === 'harvest' ? styles.subTabActive : styles.subTab}
                  onClick={() => setFieldSubTab('harvest')}
                >
                  <Calendar size={16} />
                  <span>Ekim / Hasat Kayıtları</span>
                </button>
              </div>

              {fieldSubTab === 'fields' && (
                <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowAddFieldModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#10b981',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={14} /> Yeni Tarla Ekle
                  </button>
                </div>
              )}

              {fieldSubTab === 'fields' && (
                <div style={styles.listStack}>
                  {fields.map((field, i) => (
                    <div key={field._id || i} style={styles.fieldCard} onClick={() => setSelectedField(field)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <div style={styles.fieldBadgeIcon}>🌾</div>
                          <div>
                            <div style={styles.fieldTitle}>{field.name || `Kuzey Tarlası ${i + 1}`}</div>
                            <div style={styles.fieldSub}>{field.crop || 'Silajlık Mısır'} • {field.areaDonum || (35 + i * 10)} Dönüm</div>
                          </div>
                        </div>
                        <span style={styles.moistureBadge}>
                          <Droplets size={12} color="#38bdf8" />
                          <span>%{field.moisture || (65 + i * 2)} Nem</span>
                        </span>
                      </div>

                      <div style={styles.fieldStatsRow}>
                        <div style={styles.fieldStatCol}>
                          <span style={styles.fieldStatLabel}>Toprak Tipi</span>
                          <span style={styles.fieldStatVal}>{field.soilType || 'Tınlı Alüvyon'}</span>
                        </div>
                        <div style={styles.fieldStatCol}>
                          <span style={styles.fieldStatLabel}>Sulama Yöntemi</span>
                          <span style={styles.fieldStatVal}>{field.irrigationMethod || 'Damla Sulama'}</span>
                        </div>
                        <div style={styles.fieldStatCol}>
                          <span style={styles.fieldStatLabel}>Büyüme Evresi</span>
                          <span style={styles.fieldStatVal}>{field.stage || 'Vejetatif'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {fieldSubTab === 'harvest' && (
                <div style={styles.listStack}>
                  <div style={styles.sectionTitle}>Yaklaşan Hasat Dönemleri</div>
                  {fields.map((field, i) => (
                    <div key={field._id || i} style={styles.harvestCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ fontSize: '24px' }}>
                            {i % 3 === 0 ? '🌽' : i % 3 === 1 ? '🌾' : '🌿'}
                          </div>
                          <div>
                            <div style={styles.harvestTitle}>{field.crop || (i % 2 === 0 ? 'Ekmeklik Buğday' : 'Silajlık Mısır')}</div>
                            <div style={styles.harvestSub}>{field.name || `Sektör ${i + 1}`}</div>
                          </div>
                        </div>
                        <span style={styles.daysBadge}>{(i + 1) * 14} Gün Kaldı</span>
                      </div>

                      <div style={styles.harvestDateRow}>
                        <div>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>Ekim Tarihi:</span>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1' }}>15 Nisan 2026</div>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>Tahmini Hasat:</span>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>28 Ağustos 2026</div>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>Beklenen Verim:</span>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>{(4.5 + i * 0.5).toFixed(1)} Ton/Dönüm</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== 3. SÜRÜ TAKİBİ (HERD) ==================== */}
          {activeTab === 'herd' && (
            <div style={styles.tabContent}>
              <div style={styles.searchBar}>
                <Search size={16} color="#64748b" />
                <input 
                  type="text" 
                  placeholder="Kulak no, isim veya ırk ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
              </div>

              {/* Status filter chips */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                <span style={styles.filterChipActive}>Tümü ({animals.length})</span>
                <span style={styles.filterChip}>Sağmal (38)</span>
                <span style={styles.filterChip}>Kuru (15)</span>
                <span style={styles.filterChip}>Buzağı (10)</span>
              </div>

              <div style={styles.listStack}>
                {filteredAnimals.map((animal, i) => (
                  <div key={animal._id || i} style={styles.animalDetailCard} onClick={() => setSelectedAnimal(animal)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={styles.animalAvatar}>
                          {animal.category === 'COW' ? '🐄' : animal.category === 'SHEEP' ? '🐑' : '🐐'}
                        </div>
                        <div>
                          <div style={styles.animalTag}>{animal.earTag || `TR-34-${100 + i}`}</div>
                          <div style={styles.animalSub}>{animal.name || 'Holstein Süt Sığırı'} • {animal.breed || 'Siyah Alaca'}</div>
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: animal.healthStatus === 'SICK' ? '#f43f5e20' : '#10b98120',
                        color: animal.healthStatus === 'SICK' ? '#f43f5e' : '#10b981'
                      }}>
                        {animal.healthStatus || 'SAĞLIKLI'}
                      </span>
                    </div>

                    <div style={styles.cardFooterInfo}>
                      <div style={styles.infoCol}>
                        <span style={styles.infoLabel}>Mevcut Bölge</span>
                        <span style={styles.infoValue}>{animal.currentZone?.name || 'Sağınhane'}</span>
                      </div>
                      <div style={styles.infoCol}>
                        <span style={styles.infoLabel}>Günlük Süt</span>
                        <span style={{ ...styles.infoValue, color: '#38bdf8' }}>{(24.5 + (i % 5)).toFixed(1)} Litre</span>
                      </div>
                      <div style={styles.infoCol}>
                        <span style={styles.infoLabel}>Tasma Pil</span>
                        <span style={styles.infoValue}>%{animal.batteryLevel || (85 + (i % 12))}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 4. İKAZ & ALARMLAR (ALERTS) ==================== */}
          {activeTab === 'alerts' && (
            <div style={styles.tabContent}>
              <h3 style={styles.sectionTitle}>Sistem İkaz ve Alarmları ({alerts.length})</h3>
              <div style={styles.listStack}>
                {alerts.map((alert, i) => (
                  <div key={alert._id || i} style={styles.alertDetailCard}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={styles.alertIconBg}>
                        <AlertTriangle size={20} color="#f59e0b" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={styles.alertTitle}>{alert.title || alert.type || 'Sınır İhlali Alarmı'}</div>
                        <div style={styles.alertDesc}>{alert.message || 'Hayvan belirlenen otlatma alanının dışına çıktı. GPS/RSSI uyarısı.'}</div>
                        <div style={styles.alertTime}>Tarih: {new Date(alert.createdAt || Date.now()).toLocaleTimeString('tr-TR')}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 5. ENTEGRASYONLAR (CAMERAS & DEVICES) ==================== */}
          {activeTab === 'integrations' && (
            <div style={styles.tabContent}>
              {/* Integration Sub Tabs */}
              <div style={styles.subTabBar}>
                <button 
                  style={integSubTab === 'cameras' ? styles.subTabActive : styles.subTab}
                  onClick={() => setIntegSubTab('cameras')}
                >
                  <Camera size={16} />
                  <span>Kameralar ({cameras.length || 10})</span>
                </button>
                <button 
                  style={integSubTab === 'devices' ? styles.subTabActive : styles.subTab}
                  onClick={() => setIntegSubTab('devices')}
                >
                  <Cpu size={16} />
                  <span>Tasmalar ({devices.length || 57})</span>
                </button>
              </div>

              {integSubTab === 'cameras' && (
                <div style={styles.listStack}>
                  {cameras.map((cam, i) => (
                    <div key={cam._id || i} style={styles.cameraCard}>
                      <div style={styles.cameraViewPlaceholder}>
                        <Camera size={36} color="#64748b" />
                        <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>MJPEG / RTSP Canlı Akış</span>
                        <div style={styles.liveIndicator}>• CANLI</div>
                      </div>
                      <div style={styles.cameraMeta}>
                        <div>
                          <span style={styles.cameraName}>{cam.name || `Kamera ${i + 1} - Ahır İçi`}</span>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>IP: 192.168.1.{(100 + i)} • RTSP HD</div>
                        </div>
                        <span style={styles.cameraZone}>{cam.zone?.name || 'Büyük Ahır'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {integSubTab === 'devices' && (
                <div style={styles.listStack}>
                  <div style={styles.gatewayBox}>
                    <Radio size={20} color="#10b981" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>Çiftlik RSSI Gateway</div>
                      <div style={{ fontSize: '11px', color: '#10b981' }}>● Bağlı ve Çalışıyor • 57/57 Tasma Online</div>
                    </div>
                  </div>

                  {devices.map((dev, i) => (
                    <div key={dev._id || i} style={styles.deviceRow}>
                      <div style={styles.deviceIcon}>
                        <Cpu size={18} color="#38bdf8" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={styles.deviceTag}>{dev.mac || `ESP32-COLLAR-${1000 + i}`}</div>
                        <div style={styles.deviceSub}>Sinyal: -68 dBm • Veri Gönderim: 5 sn</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#10b981' }}>%{85 + (i % 15)} Pil</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>Aktif</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== 6. AYARLAR (SETTINGS) ==================== */}
          {activeTab === 'settings' && (
            <div style={styles.tabContent}>
              <div style={styles.profileBox}>
                <div style={styles.profileAvatar}>YV</div>
                <div>
                  <div style={styles.profileName}>Yeşil Vadi Çiftliği</div>
                  <div style={styles.profileEmail}>info@yesilvadiciftligi.com</div>
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>PRO Kurumsal Paket</div>
                </div>
              </div>

              {/* Package limits */}
              <div style={styles.packageCard}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>Paket Kullanım Oranları</div>
                <div style={styles.usageRow}>
                  <span>Canlı Hayvan Limit:</span>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>63 / 500</span>
                </div>
                <div style={styles.usageRow}>
                  <span>Tarla Limit:</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>12 / 50</span>
                </div>
                <div style={styles.usageRow}>
                  <span>Kamera Limit:</span>
                  <span style={{ fontWeight: 700, color: '#f59e0b' }}>10 / 20</span>
                </div>
              </div>

              <div style={styles.settingsList}>
                <div style={styles.settingItem}>
                  <Cpu size={18} color="#10b981" />
                  <span style={{ flex: 1 }}>Tasma Cihaz Yapılandırması</span>
                  <ChevronRight size={16} color="#64748b" />
                </div>
                <div style={styles.settingItem}>
                  <Radio size={18} color="#6366f1" />
                  <span style={{ flex: 1 }}>RSSI Konumlandırma Hassasiyeti</span>
                  <ChevronRight size={16} color="#64748b" />
                </div>
                <div style={styles.settingItem}>
                  <Bell size={18} color="#f59e0b" />
                  <span style={{ flex: 1 }}>Bildirim & Alarm Tercihleri</span>
                  <ChevronRight size={16} color="#64748b" />
                </div>
              </div>

              <button 
                onClick={() => { localStorage.removeItem('surum_token'); setToken(''); }} 
                style={styles.logoutBtn}
              >
                Oturumu Kapat
              </button>
            </div>
          )}
        </div>

        {/* Modal: Hayvan Detayı */}
        {selectedAnimal && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>Hayvan & Yavru Kartı</h3>
                <button onClick={() => setSelectedAnimal(null)} style={styles.closeBtn}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '36px' }}>🐄</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>{selectedAnimal.earTag || 'TR-34-102'}</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>{selectedAnimal.name || 'İnek'} • {selectedAnimal.breed || 'Holstein'}</div>
                </div>
              </div>

              <div style={styles.modalGrid}>
                <div style={styles.modalCell}><span>Sağlık Durumu</span><strong>{selectedAnimal.status === 'vefat' ? 'Öldü / Vefat' : (selectedAnimal.healthStatus || 'SAĞLIKLI')}</strong></div>
                <div style={styles.modalCell}><span>Mevcut Bölge</span><strong>{selectedAnimal.currentZone?.name || selectedAnimal.barnSection || 'Sağınhane'}</strong></div>
                <div style={styles.modalCell}><span>Günlük Süt</span><strong>{selectedAnimal.dailyMilkLiters ? `${selectedAnimal.dailyMilkLiters} L` : '28.5 L'}</strong></div>
                <div style={styles.modalCell}><span>Tasma Pil</span><strong>%{selectedAnimal.batteryLevel || 92}</strong></div>
              </div>

              {/* Geçmiş Yavrular (Offspring) */}
              <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #1e293b' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
                  👶 Geçmiş Yavrular / Çocuklar
                </h4>
                {(() => {
                  const children = animals.filter(a => a.damTag === selectedAnimal.earTag || a.sireTag === selectedAnimal.earTag);
                  if (children.length === 0) {
                    return <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>Kayıtlı yavru bulunmuyor.</div>;
                  }
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {children.map(child => (
                        <div key={child._id || child.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>{child.earTag} ({child.name || 'Buzağı'})</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {child.gender === 'disi' ? '♀ Dişi' : '♂ Erkek'} • {child.ageLabel || '4 Aylık'}
                            </div>
                          </div>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            backgroundColor: child.status === 'vefat' ? '#f43f5e20' : '#10b98120',
                            color: child.status === 'vefat' ? '#f43f5e' : '#10b981'
                          }}>
                            {child.status === 'vefat' ? 'Öldü / Vefat' : 'Aktif'}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Hayvan Aksiyon Butonları (Vefat / Sil) */}
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                {selectedAnimal.status !== 'vefat' && (
                  <button
                    onClick={async () => {
                      if (!confirm(`${selectedAnimal.earTag} hayvanını VEFAT ETTİ (Öldü) olarak işaretlemek istiyor musunuz?`)) return;
                      try {
                        await fetch(`${API_BASE}/animals/${selectedAnimal._id || selectedAnimal.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ status: 'vefat', isActive: false })
                        });
                        alert('Hayvan Vefat Etti olarak işaretlendi.');
                        setSelectedAnimal(null);
                        fetchData();
                      } catch (err) { alert('Hata oluştu.'); }
                    }}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#ef444420', border: '1px solid #ef4444', color: '#ef4444', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Vefat Etti (Öldü İşaretle)
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (!confirm(`${selectedAnimal.earTag} kaydını SİLMEK istediğinize emin misiniz?`)) return;
                    try {
                      await fetch(`${API_BASE}/animals/${selectedAnimal._id || selectedAnimal.id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      alert('Hayvan kaydı silindi.');
                      setSelectedAnimal(null);
                      fetchData();
                    } catch (err) { alert('Hata oluştu.'); }
                  }}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#334155', border: '1px solid #475569', color: '#f8fafc', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Kayıttan Sil
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Yeni Tarla Ekle */}
        {showAddFieldModal && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '440px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>Yeni Tarla Kaydı</h3>
                <button onClick={() => setShowAddFieldModal(false)} style={styles.closeBtn}><X size={18} /></button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newFieldName) return;
                try {
                  await fetch(`${API_BASE}/fields`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                      name: newFieldName,
                      code: `Parsel ${Math.floor(Math.random() * 20) + 1}A`,
                      crop: newFieldCrop,
                      areaDonum: parseFloat(newFieldArea) || 30,
                      soilType: 'Tınlı Alüvyon',
                      irrigation: { method: 'Damlama', status: 'iyi', moisturePercent: 65 },
                      boundary: {
                        type: 'Polygon',
                        coordinates: [[
                          [37.015, 39.745],
                          [37.018, 39.745],
                          [37.018, 39.748],
                          [37.015, 39.748],
                          [37.015, 39.745]
                        ]]
                      }
                    })
                  });
                  alert(`${newFieldName} (${newFieldCrop}) tarlası eklendi.`);
                  setShowAddFieldModal(false);
                  setNewFieldName('');
                  fetchData();
                } catch (err) {
                  alert('Tarla eklenirken hata oluştu.');
                }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Tarla Adı *</label>
                  <input
                    required
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Örn: Dere Boyu Mısır Tarlası"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Ekilen Ürün / Mahsul *</label>
                  <select
                    value={newFieldCrop}
                    onChange={(e) => setNewFieldCrop(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '13px', fontWeight: 700 }}
                  >
                    <option value="Ryegrass">Ryegrass</option>
                    <option value="Buğday">Buğday</option>
                    <option value="Arpa">Arpa</option>
                    <option value="Yulaf">Yulaf</option>
                    <option value="Silajlık Mısır">Silajlık Mısır</option>
                    <option value="Yonca">Yonca</option>
                    <option value="Ayçiçeği">Ayçiçeği</option>
                    <option value="Şeker Pancarı">Şeker Pancarı</option>
                    <option value="Fiğ">Fiğ</option>
                    <option value="Soya">Soya</option>
                    <option value="Karpuz">Karpuz</option>
                    <option value="Biber">Biber</option>
                    <option value="Domates">Domates</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Alan (Dönüm) *</label>
                  <input
                    required
                    type="number"
                    value={newFieldArea}
                    onChange={(e) => setNewFieldArea(e.target.value)}
                    placeholder="35"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '13px' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{ marginTop: '10px', padding: '12px', borderRadius: '8px', background: '#10b981', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Tarlayı Kaydet
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Tarla Detayı */}
        {selectedField && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>Tarla Detayı</h3>
                <button onClick={() => setSelectedField(null)} style={styles.closeBtn}><X size={18} /></button>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', marginBottom: '4px' }}>{selectedField.name}</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>{selectedField.crop || 'Silajlık Mısır'} • {selectedField.areaDonum || 45} Dönüm</div>
              
              <div style={styles.modalGrid}>
                <div style={styles.modalCell}><span>Toprak Tipi</span><strong>{selectedField.soilType || 'Tınlı'}</strong></div>
                <div style={styles.modalCell}><span>Sulama</span><strong>{selectedField.irrigationMethod || 'Damla'}</strong></div>
                <div style={styles.modalCell}><span>Toprak Nemi</span><strong>%{selectedField.moisture || 68}</strong></div>
                <div style={styles.modalCell}><span>Rakım</span><strong>450 m</strong></div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation Bar */}
        <div style={styles.bottomNav}>
          <button 
            onClick={() => setActiveTab('home')} 
            style={activeTab === 'home' ? styles.navItemActive : styles.navItem}
          >
            <Home size={20} />
            <span>Ana Sayfa</span>
          </button>
          <button 
            onClick={() => setActiveTab('herd')} 
            style={activeTab === 'herd' ? styles.navItemActive : styles.navItem}
          >
            <Activity size={20} />
            <span>Sürü</span>
          </button>
          <button 
            onClick={() => setActiveTab('fields')} 
            style={activeTab === 'fields' ? styles.navItemActive : styles.navItem}
          >
            <Leaf size={20} />
            <span>Tarlalar</span>
          </button>
          <button 
            onClick={() => setActiveTab('integrations')} 
            style={activeTab === 'integrations' ? styles.navItemActive : styles.navItem}
          >
            <Camera size={20} />
            <span>Kamera/Tasma</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            style={activeTab === 'settings' ? styles.navItemActive : styles.navItem}
          >
            <Settings size={20} />
            <span>Ayarlar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  fullWrapper: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#090d16',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  frameWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100vh',
    padding: '12px',
    backgroundColor: '#090d16'
  },
  topControlBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: '400px',
    marginBottom: '10px'
  },
  frameToggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#1e293b',
    color: '#10b981',
    border: '1px solid #334155',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 700
  },
  phoneFrame: {
    width: '390px',
    height: '780px',
    backgroundColor: '#0f172a',
    borderRadius: '44px',
    border: '10px solid #1e293b',
    boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(16,185,129,0.15)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative'
  },
  fullPhone: {
    width: '100%',
    maxWidth: '500px',
    height: '100vh',
    backgroundColor: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 24px 4px 24px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#cbd5e1'
  },
  notch: {
    width: '110px',
    height: '22px',
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    marginTop: '-4px'
  },
  appHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    borderBottom: '1px solid #1e293b'
  },
  headerSubtitle: {
    fontSize: '11px',
    color: '#10b981',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#f8fafc'
  },
  iconBtn: {
    background: '#1e293b',
    border: '1px solid #334155',
    color: '#cbd5e1',
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  appBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px'
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  weatherCard: {
    backgroundColor: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '16px'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  metricCard: {
    backgroundColor: '#1e293b',
    padding: '14px',
    borderRadius: '16px',
    border: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer'
  },
  metricLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: 600
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#38bdf8',
    margin: '4px 0'
  },
  metricSub: {
    fontSize: '10px',
    color: '#64748b'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '6px'
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#f8fafc'
  },
  seeAll: {
    fontSize: '12px',
    color: '#10b981',
    fontWeight: 700,
    cursor: 'pointer'
  },
  listStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  alertCard: {
    backgroundColor: '#1e293b',
    border: '1px solid #f43f5e30',
    borderRadius: '14px',
    padding: '12px',
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  alertIconBg: {
    backgroundColor: '#f43f5e20',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  alertTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#f8fafc'
  },
  alertDesc: {
    fontSize: '11px',
    color: '#94a3b8',
    marginTop: '2px'
  },
  alertBadge: {
    backgroundColor: '#f43f5e',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '10px'
  },
  animalRow: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '14px',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer'
  },
  animalAvatar: {
    fontSize: '20px',
    backgroundColor: '#0f172a',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  animalTag: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#f8fafc'
  },
  animalSub: {
    fontSize: '11px',
    color: '#64748b'
  },
  locationChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#10b98115',
    color: '#10b981',
    padding: '4px 8px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: 600
  },
  subTabBar: {
    display: 'flex',
    backgroundColor: '#1e293b',
    padding: '4px',
    borderRadius: '14px',
    gap: '4px'
  },
  subTab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: '#64748b',
    padding: '8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  subTabActive: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    background: '#10b981',
    border: 'none',
    color: '#fff',
    padding: '8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  fieldCard: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    cursor: 'pointer'
  },
  fieldBadgeIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#10b98120',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px'
  },
  fieldTitle: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#fff'
  },
  fieldSub: {
    fontSize: '11px',
    color: '#94a3b8'
  },
  moistureBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#0f172a',
    color: '#38bdf8',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 700
  },
  fieldStatsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: '10px 12px',
    borderRadius: '10px'
  },
  fieldStatCol: {
    display: 'flex',
    flexDirection: 'column'
  },
  fieldStatLabel: {
    fontSize: '10px',
    color: '#64748b'
  },
  fieldStatVal: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#cbd5e1'
  },
  harvestCard: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  harvestTitle: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#fff'
  },
  harvestSub: {
    fontSize: '11px',
    color: '#94a3b8'
  },
  daysBadge: {
    backgroundColor: '#10b98120',
    color: '#10b981',
    fontSize: '11px',
    fontWeight: 800,
    padding: '4px 10px',
    borderRadius: '12px'
  },
  harvestDateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: '10px 12px',
    borderRadius: '10px'
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '10px 14px'
  },
  searchInput: {
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#fff',
    fontSize: '13px',
    width: '100%'
  },
  filterChipActive: {
    backgroundColor: '#10b981',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 700,
    padding: '6px 12px',
    borderRadius: '20px',
    whiteSpace: 'nowrap'
  },
  filterChip: {
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    fontSize: '11px',
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: '20px',
    whiteSpace: 'nowrap'
  },
  animalDetailCard: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    cursor: 'pointer'
  },
  cardFooterInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: '10px 14px',
    borderRadius: '10px'
  },
  infoCol: {
    display: 'flex',
    flexDirection: 'column'
  },
  infoLabel: {
    fontSize: '10px',
    color: '#64748b'
  },
  infoValue: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#cbd5e1'
  },
  alertDetailCard: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '14px',
    padding: '14px'
  },
  alertTime: {
    fontSize: '10px',
    color: '#64748b',
    marginTop: '6px'
  },
  cameraCard: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    overflow: 'hidden'
  },
  cameraViewPlaceholder: {
    height: '140px',
    backgroundColor: '#090d16',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  liveIndicator: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 800,
    padding: '2px 8px',
    borderRadius: '6px'
  },
  cameraMeta: {
    padding: '12px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cameraName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#f8fafc'
  },
  cameraZone: {
    fontSize: '11px',
    color: '#10b981',
    fontWeight: 600
  },
  gatewayBox: {
    backgroundColor: '#1e293b',
    border: '1px solid #10b98140',
    borderRadius: '14px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  deviceRow: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  deviceIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    backgroundColor: '#38bdf815',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  deviceTag: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#fff'
  },
  deviceSub: {
    fontSize: '11px',
    color: '#64748b'
  },
  profileBox: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },
  profileAvatar: {
    width: '48px',
    height: '48px',
    backgroundColor: '#10b981',
    color: '#fff',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '18px'
  },
  profileName: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#fff'
  },
  profileEmail: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  packageCard: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '16px',
    padding: '14px'
  },
  usageRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#cbd5e1',
    padding: '6px 0',
    borderBottom: '1px solid #0f172a'
  },
  settingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  settingItem: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '13px',
    color: '#cbd5e1',
    fontWeight: 600
  },
  logoutBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#f43f5e20',
    color: '#f43f5e',
    border: '1px solid #f43f5e40',
    borderRadius: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '10px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(9,13,22,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    zIndex: 9999,
    backdropFilter: 'blur(4px)'
  },
  modalContent: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '20px',
    padding: '20px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
  },
  closeBtn: {
    background: '#0f172a',
    border: 'none',
    color: '#cbd5e1',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  modalCell: {
    backgroundColor: '#0f172a',
    padding: '10px',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    fontSize: '11px',
    color: '#94a3b8'
  },
  bottomNav: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderTop: '1px solid #1e293b',
    padding: '10px 0 14px 0'
  },
  navItem: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  navItemActive: {
    background: 'none',
    border: 'none',
    color: '#10b981',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  loginContainer: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#090d16',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  loginCard: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '24px',
    padding: '32px 24px',
    width: '100%',
    maxWidth: '360px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
  },
  logoBadge: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    backgroundColor: '#10b98115',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px'
  },
  loginTitle: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#fff'
  },
  loginSub: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '4px',
    marginBottom: '24px'
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '12px 14px'
  },
  input: {
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#fff',
    fontSize: '14px',
    width: '100%'
  },
  button: {
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '14px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '8px'
  },
  errorBox: {
    backgroundColor: '#f43f5e20',
    color: '#f43f5e',
    border: '1px solid #f43f5e40',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '12px',
    width: '100%',
    marginBottom: '14px'
  }
};
