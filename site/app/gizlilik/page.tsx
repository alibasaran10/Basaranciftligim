import { LegalPage } from "@/components/shared/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage title="Gizlilik Politikası">
      <h2>Verilerinize saygı duyuyoruz</h2>
      <p>
        SÜRÜM, kişisel ve işletme verilerini yalnızca hizmetin sunulması,
        güvenliği ve iyileştirilmesi amacıyla işler. Veriler yetkisiz üçüncü
        kişilerle paylaşılmaz.
      </p>
      <h2>Güvenlik ve saklama</h2>
      <p>
        Tüm bağlantılar şifrelenir, veriler düzenli olarak yedeklenir ve yalnızca
        yetkilendirilmiş kullanıcıların erişimine açılır.
      </p>
    </LegalPage>
  );
}
