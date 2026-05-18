# Gemini API Kurulum Rehberi

## Adım 1: API Key Alın (2 dakika)

1. **Google AI Studio'ya gidin**
   ```
   https://aistudio.google.com/app/apikey
   ```

2. **Google hesabınızla giriş yapın**
   - Gmail hesabınızı kullanın

3. **"Create API Key" butonuna tıklayın**
   - Eğer proje seçmeniz istenirse, "Create API key in new project" seçin

4. **API Key'i kopyalayın**
   - Uzun bir string olacak (örnek: AIzaSyD...)
   - Güvenli bir yere kaydedin

## Adım 2: .env.local Dosyasına Ekleyin

1. **Proje klasöründe `.env.local` dosyasını açın**
   ```
   d:\LeadHunter\.env.local
   ```

2. **Şu satırı ekleyin veya güncelleyin:**
   ```bash
   GEMINI_API_KEY="buraya-kopyaladiginiz-api-key"
   ```

3. **Dosyayı kaydedin**

## Adım 3: Dev Server'ı Yeniden Başlatın

1. **Terminal'de Ctrl+C ile mevcut server'ı durdurun**

2. **Yeniden başlatın:**
   ```bash
   npm run dev
   ```

## Adım 4: Test Edin

### Test 1: API Bağlantısını Test Edin
```
http://localhost:3000/api/test-gemini
```

**Başarılı yanıt:**
```json
{
  "success": true,
  "message": "Gemini API is working!",
  "apiKeyFound": true,
  "generatedMessage": "Hi Mr/Ms Test Owner, ..."
}
```

**Hata varsa:**
```json
{
  "success": false,
  "error": "GEMINI_API_KEY not found..."
}
```

### Test 2: Dashboard'da Test Edin

1. http://localhost:3000 adresine gidin
2. Facebook ile giriş yapın
3. Bir OWNER lead'e tıklayın
4. "Generate Message" butonuna basın
5. 2-3 saniye bekleyin
6. Kişiselleştirilmiş mesaj görmelisiniz

**Eğer hala template görüyorsanız:**
- Browser console'u açın (F12)
- Network tab'ına bakın
- `/api/messages/generate` isteğini bulun
- Response'a bakın - hata var mı?

## Sorun Giderme

### Sorun 1: "GEMINI_API_KEY not found"
**Çözüm:**
1. `.env.local` dosyasında `GEMINI_API_KEY` satırı var mı kontrol edin
2. Tırnak işaretleri doğru mu? (`"` kullanın)
3. Dev server'ı yeniden başlattınız mı?

### Sorun 2: "API key not valid"
**Çözüm:**
1. API key'i doğru kopyaladınız mı?
2. Başında/sonunda boşluk var mı?
3. Google AI Studio'da yeni bir key oluşturun

### Sorun 3: Hala template mesaj geliyor
**Çözüm:**
1. Browser console'da hata var mı bakın
2. `/api/test-gemini` endpoint'ini test edin
3. Server console'da log'lara bakın
4. API key'in doğru olduğundan emin olun

### Sorun 4: "Rate limit exceeded"
**Çözüm:**
- Gemini free tier: dakikada 15 istek
- Biraz bekleyin ve tekrar deneyin
- Çok fazla test yapıyorsanız, birkaç dakika ara verin

## API Limitleri (Free Tier)

- **Dakikada**: 15 istek
- **Günde**: 1,500 istek
- **Maliyet**: ÜCRETSIZ

Bu limitler normal kullanım için yeterlidir. Eğer aşarsanız:
- Birkaç dakika bekleyin
- Veya Google Cloud'da billing aktif edin (ücretli tier)

## Başarı Kontrolü

✅ `/api/test-gemini` endpoint'i başarılı yanıt veriyor
✅ OWNER lead'de kişiselleştirilmiş mesaj geliyor
✅ CLIENT lead'de kısa, dostça yorum geliyor
✅ Mesajlar doğal ve profesyonel
✅ WhatsApp/Messenger butonları görünüyor
✅ Butonlar tıklanınca doğru uygulama açılıyor

## Örnek .env.local

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# Facebook OAuth
FACEBOOK_CLIENT_ID="your-app-id"
FACEBOOK_CLIENT_SECRET="your-app-secret"

# Gemini AI (BURAYA EKLEYİN)
GEMINI_API_KEY="AIzaSyD-your-actual-api-key-here"
```

## Yardım

Sorun devam ederse:
1. `/api/test-gemini` yanıtını paylaşın
2. Browser console'daki hataları paylaşın
3. Server console'daki log'ları paylaşın

---

**Not**: API key'inizi asla Git'e commit etmeyin! `.env.local` dosyası `.gitignore`'da olmalı.
