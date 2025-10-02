@echo off
echo 🚀 Dijital Ödeme Sistemi Başlatılıyor...
echo.

echo 📦 Bağımlılıklar yükleniyor...
call npm install

echo.
echo 🗄️ Veritabanı başlatılıyor...
call npm run init-db

echo.
echo ▶️ Uygulama başlatılıyor...
echo 🌐 Frontend: http://localhost:3000
echo 🔌 API: http://localhost:3000/api
echo.
echo Demo kullanıcıları:
echo - U1 (Ayşe) - 250 TL
echo - U2 (Ali) - 90 TL
echo - U3 (Deniz) - 30 TL
echo.

call npm start
