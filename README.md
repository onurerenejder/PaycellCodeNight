# Dijital Ödeme ve Fatura Bölme Sistemi

Bu proje, kullanıcıların dijital ödemeler yapabileceği ve faturalarını arkadaşlarıyla bölebileceği modern bir web uygulamasıdır.

## Özellikler

- 🔐 **ID Tabanlı Giriş**: Kayıt olmadan, sadece kullanıcı ID'si ile giriş
- 💸 **Para Transferi**: Kullanıcılar arası hızlı para transferi
- 💳 **Ödeme Sistemi**: İşyerlerine ödeme yapma
- 🧾 **Fatura Bölme**: İki farklı yöntemle fatura bölme
  - **Eşit Bölme**: Tutarı eşit olarak bölme
  - **Ağırlıklı Bölme**: Belirli oranlarda bölme
- 💰 **Cüzdan Yönetimi**: Bakiye görüntüleme ve yükleme
- 📊 **Özet Raporları**: Borç/alacak özetleri

## Teknoloji Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database
- **SOLID Principles** - Clean architecture

### Frontend
- **HTML5** - Markup
- **CSS3** - Modern styling with CSS Grid/Flexbox
- **Vanilla JavaScript** - No framework dependencies

### Güvenlik
- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API rate limiting

## Kurulum

### 1. Bağımlılıkları Yükleyin
```bash
npm install
```

### 2. Veritabanını Başlatın
```bash
npm run init-db
```

### 3. Uygulamayı Çalıştırın
```bash
# Geliştirme modu (nodemon ile)
npm run dev

# Üretim modu
npm start
```

### 4. Uygulamaya Erişin
Tarayıcınızda http://localhost:3000 adresine gidin.

## Demo Kullanıcıları

- **U1** - Ayşe (250 TL bakiye)
- **U2** - Ali (90 TL bakiye)  
- **U3** - Deniz (30 TL bakiye)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/profile` - Kullanıcı profili
- `GET /api/auth/users/search` - Kullanıcı arama
- `POST /api/auth/logout` - Çıkış

### Payments
- `POST /api/payments/transfer` - Para transferi
- `POST /api/payments/payment` - İşyerine ödeme
- `POST /api/payments/topup` - Bakiye yükleme
- `GET /api/payments/balance` - Bakiye sorgulama

### Bill Splits
- `POST /api/splits/equal` - Eşit fatura bölme
- `POST /api/splits/weighted` - Ağırlıklı fatura bölme
- `GET /api/splits/summary` - Fatura özeti
- `GET /api/splits` - Kullanıcının fatura bölmeleri
- `GET /api/splits/:splitId` - Fatura detayı
- `POST /api/splits/:splitId/settle` - Fatura ödeme
- `DELETE /api/splits/:splitId` - Fatura iptal

## Proje Yapısı

```
├── database/
│   └── schema.sql              # Veritabanı şeması
├── public/
│   ├── index.html             # Frontend HTML
│   ├── styles.css             # CSS stilleri
│   └── app.js                 # Frontend JavaScript
├── src/
│   ├── app.js                 # Ana uygulama
│   ├── container/
│   │   └── Container.js       # Dependency Injection
│   ├── controllers/
│   │   ├── AuthController.js  # Kimlik doğrulama kontrolcüsü
│   │   ├── PaymentController.js # Ödeme kontrolcüsü
│   │   └── BillSplitController.js # Fatura bölme kontrolcüsü
│   ├── database/
│   │   ├── Database.js        # Veritabanı bağlantısı
│   │   └── init.js           # Veritabanı başlatma
│   ├── domain/
│   │   ├── User.js           # Kullanıcı modeli
│   │   ├── Transaction.js    # İşlem modeli
│   │   ├── BillSplit.js     # Fatura bölme modeli
│   │   └── Wallet.js        # Cüzdan modeli
│   ├── middleware/
│   │   └── auth.js          # Kimlik doğrulama middleware
│   ├── repositories/
│   │   ├── BaseRepository.js     # Temel repository
│   │   ├── UserRepository.js     # Kullanıcı repository
│   │   ├── TransactionRepository.js # İşlem repository
│   │   ├── WalletRepository.js   # Cüzdan repository
│   │   └── BillSplitRepository.js # Fatura bölme repository
│   ├── routes/
│   │   ├── auth.js          # Kimlik doğrulama rotaları
│   │   ├── payments.js      # Ödeme rotaları
│   │   └── billSplits.js    # Fatura bölme rotaları
│   └── services/
│       ├── AuthService.js   # Kimlik doğrulama servisi
│       ├── PaymentService.js # Ödeme servisi
│       └── BillSplitService.js # Fatura bölme servisi
├── package.json
└── README.md
```

## SOLID Prensipleri

Bu proje SOLID prensiplerine uygun olarak geliştirilmiştir:

### Single Responsibility Principle (SRP)
- Her sınıf tek bir sorumluluğa sahiptir
- Controller'lar sadece HTTP isteklerini yönetir
- Service'ler sadece business logic içerir
- Repository'ler sadece veri erişimi yapar

### Open/Closed Principle (OCP)
- Yeni ödeme türleri kolayca eklenebilir
- Yeni split türleri extend edilebilir
- Middleware'ler genişletilebilir

### Liskov Substitution Principle (LSP)
- Tüm repository'ler BaseRepository'den türer
- Polymorphic davranış desteklenir

### Interface Segregation Principle (ISP)
- Küçük, odaklanmış interface'ler
- Her service sadece ihtiyacı olan metotları kullanır

### Dependency Inversion Principle (DIP)
- High-level modüller low-level modüllere bağımlı değil
- Dependency injection container kullanılır
- Abstraction'lara bağımlılık

## Kullanım Örnekleri

### Para Transferi
```javascript
// U1'den U2'ye 50 TL transfer
POST /api/payments/transfer
{
    "toUserId": "U2",
    "amount": 50.00
}
```

### Eşit Fatura Bölme
```javascript
// TX_PAY_123 işlemini U2 ve U3 ile eşit böl
POST /api/splits/equal
{
    "originalTxId": "TX_PAY_123",
    "debtorUserIds": ["U2", "U3"]
}
```

### Ağırlıklı Fatura Bölme
```javascript
// TX_PAY_123 işlemini ağırlıklı böl
POST /api/splits/weighted
{
    "originalTxId": "TX_PAY_123",
    "debtorWeights": [
        {"userId": "U2", "weight": 2.0},
        {"userId": "U3", "weight": 1.0}
    ]
}
```

## Güvenlik

- Rate limiting (15 dakikada 100 istek)
- Input validation
- SQL injection koruması
- XSS koruması
- Security headers

## Geliştirme

### Test Etmek İçin
1. Uygulamayı başlatın
2. U1, U2 veya U3 ile giriş yapın
3. Para transferi yapın
4. İşyerine ödeme yapın
5. Faturayı bölün
6. Borçları ödeyin

### Yeni Özellik Eklemek
1. Domain model oluşturun
2. Repository ekleyin
3. Service logic yazın
4. Controller oluşturun
5. Route tanımlayın
6. Frontend entegrasyonu yapın

## Lisans

MIT License
