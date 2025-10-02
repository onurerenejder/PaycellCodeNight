#!/bin/bash

# Digital Payment System Startup Script

echo "🚀 Dijital Ödeme Sistemi Başlatılıyor..."

# Install dependencies
echo "📦 Bağımlılıklar yükleniyor..."
npm install

# Initialize database
echo "🗄️ Veritabanı başlatılıyor..."
npm run init-db

# Start the application
echo "▶️ Uygulama başlatılıyor..."
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 API: http://localhost:3000/api"
echo ""
echo "Demo kullanıcıları:"
echo "- U1 (Ayşe) - 250 TL"
echo "- U2 (Ali) - 90 TL"  
echo "- U3 (Deniz) - 30 TL"
echo ""

npm start
