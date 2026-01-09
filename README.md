# 💻 matcHire Frontend

**matcHire** ekosisteminin kullanıcı arayüzüdür. İşverenlerin ilan oluşturup CV analizlerini yönettiği, adayların ise profillerini düzenleyip eksik yetkinlik tavsiyelerini görüntülediği modern web uygulamasıdır.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-blue)
![Tailwind CSS](https://img.shields.io/badge/Style-Tailwind_CSS-38bdf8)
![TypeScript](https://img.shields.io/badge/Lang-TypeScript-blue)

## 🎨 Temel Özellikler

- **⚡ Modern Mimari:** Next.js 14 **App Router** yapısı ile hızlı ve SEO dostu sayfalar.
- **📱 Responsive & Glassmorphism Tasarım:** Mobil uyumlu, arka plan bulanıklık efektleri (backdrop-blur) ile zenginleştirilmiş modern UI.
- **📊 Görsel Analizler:**
  - CV uyumluluk oranlarını gösteren renk kodlu dairesel grafikler.
  - "Kritik Eksik" ve "Geliştirilmeli" uyarıları için özelleştirilmiş bilgi kartları.
- **🔄 Dinamik Etkileşim:**
  - Anlık dosya yükleme (Upload) durumları.
  - İş ilanı oluşturma ve anında listeleme.
- **🔒 Güvenlik:**
  - Token tabanlı (JWT) korumalı rotalar ve oturum yönetimi.
  - Hatalı girişlerde kullanıcı dostu bildirimler.

## 📂 Proje Yapısı

```text
matcHire_frontend/
├── app/
│   ├── login/       # Giriş Sayfası
│   ├── register/    # Kayıt Sayfası
│   ├── dashboard/   # Ana Panel (İşveren/Aday)
|   ├── components/  # # Sayfa içi bileşenler
│   ├── account/     # Profil Ayarları
│   ├── global.css   # Global stiller
│   └── layout.tsx   # Ana iskelet ve font ayarları
├── components/      # Navbar, Footer, Spinner vb.
├── public/          # Görseller (icon, wallpaper)
├── .env             # Çevre değişkenleri
└──
```

## 🛠️ Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin.

### 1️⃣ Repoyu Klonlayın

```bash
git clone https://github.com/Jessitoii/matcHire_frontend.git
cd matcHire_frontend
```

### 2️⃣ Bağımlılıkları Yükleyin

```bash
npm install
```

### 3️⃣ Çevre Değişkenlerini Ayarlayın (.env.local)

Frontend'in Backend ile konuşabilmesi için ana dizinde .env adında bir dosya oluşturun ve şu satırı ekleyin:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4️⃣ Uygulamayı Başlatın

```bash
npm run dev
```

#### 🔗 İlgili Repolar

Tam çalışan bir sistem için aşağıdaki servislerin de ayakta olması gerekir:

💻 Backend: [matchire_backend](https://github.com/tolgadirek/matcHire_backend)

🧠 AI Service: [matchire_ai](https://github.com/tolgadirek/matcHire_ai)

## 👥 Ekip Üyeleri

| İsim Soyisim       | GitHub Profili                                 |
| :----------------- | :--------------------------------------------- |
| **Tolga Direk**    | [@tolgadirek](https://github.com/tolgadirek)   |
| **Alper Can Özer** | [@Jessitoii](https://github.com/Jessitoii) |
