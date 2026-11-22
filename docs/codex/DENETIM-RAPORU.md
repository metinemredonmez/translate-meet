# Translate-meet backend denetim raporu

**Denetim tarihi:** 23 Kasım 2026  
**İncelenen commit:** `7aae2b7343d221309e760c459060094c63a6569f` (`main`)  
**Kapsam:** `apps/api`, `apps/gateway` ve `scripts/anahtar_ekle.py`. README, paylaşılan API/WS sözleşmesi, analiz §6, ADR'ler, ölçüm notları ve CI tanımı inceleme girdisi olarak okundu.

## 1. Özet

**Yayın için P0 düzeltmeleri gerekiyor.** İki yüksek, on orta ve üç düşük önem dereceli bulgu var. İlk sırada güvensiz üretim yapılandırmasıyla başlangıç, OIDC giriş denemesinin tek kullanıma bağlanmaması ve çıkış/kapatma sonrası kimlik bilgilerinin iptali geliyor. Eşzamanlı çalışmada tekil ücretlendirme, kaynak tüketimi ve görev temizliği için ek kontroller gerekiyor.

Komutlar, ilgili commit'in izlenen dosyalarından çıkarılan, gerçek `.env` içermeyen geçici kopyada çalıştı. Testler yerel SQLite, sahte JWKS, sahte kotalar ve loopback sağlayıcıları kullandı. Var olan Python ortamları tekrar kullanıldı. Gerçek sağlayıcı çağrısı, kullanıcı verisi ve üretim testi yapılmadı. Uygulama bulgularının kanıtı kaynak kod ve mevcut test kapsamı. Düzeltme sonrasına ait yeniden test henüz yok.

| Kontrol | Çalıştırılan araç | Sonuç |
|---|---|---|
| API testleri | API ortamında `python -m pytest -p no:cacheprovider` | **64 geçti, 0 kaldı**, 2,99 sn |
| Gateway testleri | Gateway ortamında `python -m pytest -p no:cacheprovider` | **41 geçti, 0 kaldı**, 1,32 sn. TestClient için 1 deprecation uyarısı |
| API ve gateway lint | Her uygulamanın Ruff ortamında `ruff check --no-cache .` | **2 geçti**, 0 ihlal |
| Yerel SAST | Semgrep 1.183.0, `scan --metrics=off --config /Users/emre/Code/red-team/rules/semgrep apps/api apps/gateway scripts` | **6 kural, 40 dosya**, 0 eşleşme, 0 tarayıcı hatası |
| Registry SAST | Semgrep 1.183.0, `scan --metrics=off --config p/python --config p/secrets apps/api apps/gateway scripts` | **187 kural, 50 dosya**, 0 eşleşme, 0 tarayıcı hatası |
| API bağımlılık taraması | API ortamında `python -m pip_audit --strict`, PyPI kaynağı | **74 paket**, 0 atlanan, 0 bilinen açık |
| Gateway bağımlılık taraması | Gateway ortamında `python -m pip_audit --strict`, PyPI kaynağı | **55 paket**, 0 atlanan, 0 bilinen açık |
| Yerel kontrol kataloğu | `uv run --project /Users/emre/Code/red-team --offline --no-sync redteam controls --priority P0` | Kod 0. Matris için kontrol kimlikleri ve eşlemeler ayrıca katalogdan karşılaştırıldı |

İlk `uv run --no-project` denemeleri macOS sistem yapılandırma hatasıyla durdu. Aynı virtualenv araçları doğrudan çağrıldı. Gateway'in ilk denemesinde sandbox loopback erişimini engelledi ve 9 adaptör testi kaldı. Kontrollü yerel tekrar tamamlandı. İlk bağımlılık sorgusunu DNS engelledi ve PyPI erişimiyle tekrarlandı. Semgrep iki çalışmada da sürüm kontrolü ve Git ignore devre dışıyken tarandı. Her iki Semgrep çalışmasında 9 yol varsayılan ignore kurallarına takıldı ve her iki tarama anahtar betiğini kapsadı. Taranan kurulu paketlerin ad ve sürümleri ilgili `uv.lock` içinde yer alıyor. Üretim platformuna özgü çözümleme, dağıtım ağı, canlı sağlayıcı davranışı ve PostgreSQL eşzamanlılığı kontrol edilmedi.

**Derecelendirme.** CVSS v3.1 baz puanı teknik etkiyi, önem sırası ürün ve yayın önceliğini de dikkate alır. V4.0 için baz vektör verildi. Vektörler yazılı ön koşullarla sınırlı. Birleşik etkiye ilişkin kanıt olmadığından zincir puanı atanmadı. ASVS kimliklerindeki `V` öneki yerel katalog yazımıdır. Kaynaklar [OWASP ASVS 5.0.0](https://asvs.owasp.org/downloads/), [OWASP Top 10:2025](https://top10.owasp.org/2025/), [FIRST CVSS 3.1](https://www.first.org/cvss/v3.1/specification-document), [FIRST CVSS 4.0](https://www.first.org/cvss/v4.0/specification-document).

## 2. Bulgu tablosu

| Kimlik | Başlık | Önem | İlgili kontroller | Durum |
|---|---|---|---|---|
| TM-01 | Üretim başlangıcı açıkça güvenli profili zorunlu tutmuyor | Yüksek | KEY-01, OPS-01, NET-01 | Kaldı |
| TM-02 | OIDC giriş denemesi sunucuda bağlanıp tek kullanıma alınmıyor | Yüksek | TOK-03 | Kaldı |
| TM-03 | Oturum iptali access token ve açık gateway bağlantısını kapsamıyor | Orta | SES-04, BUS-05, API-04, TOK-05 | Kaldı |
| TM-04 | Gateway bağlantı, giriş ve çıkış tamponlarına ortak kaynak sınırı yok | Orta | RES-01, API-04, INP-04, AI-03 | Kaldı |
| TM-05 | Eşzamanlı metin çevirisi sağlayıcı işini tekilleştirmiyor | Orta | BUS-02, BUS-03, AI-03 | Kaldı |
| TM-06 | Canlı kota, upstream'e gönderilen ses süresini sınırlandırmıyor | Orta | RES-01, AI-03, API-04 | Kaldı |
| TM-07 | Refresh rotasyonu ve aile iptali atomik değil | Orta | SES-05, BUS-02 | Kaldı |
| TM-08 | Yönetici TOTP adımı ve başarısız denemeler atomik tüketilmiyor | Orta | AUT-01, AUT-02, BUS-02 | Kaldı |
| TM-09 | Kota kapanışında atomik geçiş ve kayıp rezervasyon kurtarma yok | Orta | BUS-01, BUS-02, RES-01, ARC-05 | Kaldı |
| TM-10 | Sağlayıcı yanıtları ve hata etiketleri güven sınırında tam doğrulanmıyor | Orta | INP-01, LOG-02, EXT-03, EXC-01 | Kaldı |
| TM-11 | Sağlayıcı görevinin sonlanması tüm oturum kaynaklarını güvenilir biçimde kapatmıyor | Orta | ARC-05, EXC-01, RES-04 | Kaldı |
| TM-12 | Anahtar betiği güvenli dosya oluşturmayı ve tamamen maskeli çıktıyı garanti etmiyor | Orta | KEY-02, LOG-02 | Kaldı |
| TM-13 | Beklenmeyen veritabanı hataları SQL parametrelerini sunucu loguna taşıyabilir | Düşük | LOG-02, EXC-01 | Kaldı |
| TM-14 | Internal kota kapanış yetkisi realtime defteriyle sınırlı değil | Düşük | ARC-04, AZ-04, NET-04 | Kaldı |
| TM-15 | Realtime token yön ve mod seçimini tam bağlamıyor | Düşük | API-04, TOK-02, INP-01 | Kaldı |

## 3. Bulgu ayrıntıları

Tüm olumlu ve olumsuz yeniden testler için hedef ortam düzeltme commit'i, sentetik kayıtlar ve izole test altyapısıdır. Her yeniden testte build hash'i, tarih ve maskeli test sonucu kaydedilmeli. Kalan risk sahipleri önerilen rollerdir. Risk kabulüne dair kayıt görülmedi.

### TM-01 — Güvensiz profil ile başlangıç

| Alan | Değer |
|---|---|
| Önem, durum | Yüksek, Kaldı |
| CWE, ASVS 5.0.0, OWASP Top 10:2025 | CWE-1188, CWE-798. V13.3.1, V13.4.2, V12.1.1. A02, A04 |
| CVSS 3.1 | 7.4, `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N` |
| CVSS 4.0 | `CVSS:4.0/AV:N/AC:L/AT:P/PR:N/UI:N/VC:H/VI:H/VA:N/SC:N/SI:N/SA:N` |
| CVE / KEV / EPSS | Uygulanmaz, birinci taraf kodu |
| Etkilenen kapsam ve ön koşullar | İncelenen API ve gateway sürümü. Yüksek etki, üretimde profil eksik ve servis dışarıya açık olduğunda geçerli. Yönetici CLI için işletmen erişimi gerekir. |
| İlgili kontroller | KEY-01, OPS-01, NET-01 |

**Açıklama.** Her iki servis de belirtilmeyen profili `dev` seçip güvenlik denetiminden erken dönüyor. Açıkça `prod` seçilince bilinen varsayılanlar ve mock engelleniyor. API'nin üretim kontrolü dış gateway URL'sinin `wss` olmasını ve yönetici veri anahtarının geçerli biçimini doğrulamıyor. Yönetici komutları da başlangıç kontrolüne uğramıyor. Kanıt `apps/api/app/config.py:13–21,39,65–67,82–104`, `apps/gateway/app/config.py:17–25,64–77`, `apps/api/app/cli.py:28–30,55–60,84–86`.

**Sömürü senaryosu.** Güvensiz varsayılanlarla yayına açılan dağıtım, kimlik bilgilerinin güvenilirliğini ve iç servis sınırını kaybeder. İncelenen üretim dağıtımında böyle bir durumun bulunduğu doğrulanmadı.

**Etki.** Yanlış dağıtım halinde kimlik, kişisel veriye erişim, iç servis isteklerinin bütünlüğü ve taşıma gizliliği risk altında.

**Düzeltme.** Her servis ile yönetici CLI giriş noktasında dağıtım profilini ve sırları doğrula. Güvensiz profil, şifreleme anahtarı, dış WS taşıması ve servis rolü için çalıştırmayı durdur. Sağlayıcı hedeflerine HTTPS/WSS politikası koy ve kasıtlı yerel servis bağlantılarını ayrı doğrula. Tüm API, gateway, yönetici ve migration giriş noktalarını aynı başlangıç politikasıyla gözden geçir.

**Yeniden test.** Olumlu: geçerli üretim ayarıyla iki servis ve yönetici işlemi başlasın. Olumsuz: eksik profil, varsayılan sır veya güvensiz dış taşıma başlangıçtan önce reddedilsin. Mevcut kanıt `apps/api/tests/test_translate.py:194–207` ve `apps/gateway/tests/test_converse.py:204,251`. Üretim topolojisi ayrıca doğrulanacak.

**Kalan risk.** Proxy yönlendirmesi, sır yöneticisi ve rotasyon dağıtımda kanıt ister. Sahip platform.

### TM-02 — OIDC giriş denemesi tek kullanıma bağlanmıyor

| Alan | Değer |
|---|---|
| Önem, durum | Yüksek, Kaldı |
| CWE, ASVS 5.0.0, OWASP Top 10:2025 | CWE-294. V10.1.2, V10.4.1, V10.4.2, V10.4.6. A07 |
| CVSS 3.1 | 4.8, `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N` |
| CVSS 4.0 | `CVSS:4.0/AV:N/AC:L/AT:P/PR:N/UI:N/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N` |
| CVE / KEV / EPSS | Uygulanmaz, birinci taraf kodu |
| Etkilenen kapsam ve ön koşullar | Apple/Google mobil giriş ucu, geçerliliğini koruyan kimlik kanıtı ve eşleşen nonce üzerinde üçüncü kişinin kontrolü varsayılır. |
| İlgili kontroller | TOK-03 |

**Açıklama.** Sağlayıcı imzası, issuer, audience, süre ve nonce eşleşmesi doğrulanıyor. Ancak nonce aynı istek gövdesinden alınarak karşılaştırılıyor ve tamamlanmış giriş denemesi sunucuda tüketilmiyor. Her başarılı doğrulama yeni refresh ailesi başlatıyor. E-posta üzerinden otomatik hesap bağlama yok. Kanıt `apps/api/app/oidc.py:35–76`, `apps/api/app/routes/auth.py:21–24,69–103`, `apps/api/app/models.py:27–33`.

**Sömürü senaryosu.** Geçerli kimlik kanıtı yetkisiz bir tarafa geçerse, sunucu daha önce tamamlanmış giriş denemesiyle yeni bir deneme arasında ayrım yapamaz.

**Etki.** Uygulamadaki hesaba ve çeviri geçmişine yetkisiz erişim ile hesap adına işlem riski. Sağlayıcı anahtarı veya yönetici yetkisi kapsam dışı.

**Düzeltme.** Giriş denemesini süreli, aktöre/istemci oturumuna ve sağlayıcıya bağlı sunucu challenge'ıyla başlat. Başarılı değişimde atomik tek kullanım sağla. Alternatif olarak aynı özellikleri sağlayan yetkilendirme kodu akışını kullan. Apple/Google nonce sözleşmeleri ile yerel hesap yaşam döngüsünü ayrı denetle.

**Yeniden test.** Olumlu: iki sağlayıcıda bağlanmış meşru giriş tamamlanır. Olumsuz: kullanılmış, süresi dolmuş veya denemeyle uyuşmayan doğrulama yeni aile üretmez. Mevcut `apps/api/tests/test_auth.py:34–70`, sahte JWKS üzerinde claim ve imza retlerini kapsıyor.

**Kalan risk.** IdP anahtar rotasyonu, upstream oturum kesilmesi ve istemci korumaları ayrıca kanıt gerektirir. Sahip API kimlik ekibi.

### TM-03 — Oturum iptali API ve gateway'de eksik

| Alan | Değer |
|---|---|
| Önem, durum | Orta, Kaldı |
| CWE, ASVS 5.0.0, OWASP Top 10:2025 | CWE-613. V7.4.1, V7.4.2, V8.3.2. A07 |
| CVSS 3.1 | 5.4, `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:N` |
| CVSS 4.0 | `CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:N/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N` |
| CVE / KEV / EPSS | Uygulanmaz, birinci taraf kodu |
| Etkilenen kapsam ve ön koşullar | İptal öncesinde düzenlenmiş geçerli uygulama kimlik bilgisi veya açık realtime bağlantı. |
| İlgili kontroller | SES-04, BUS-05, API-04, TOK-05 |

**Açıklama.** Logout refresh ailesini iptal ediyor. Access token aileye veya iptal sürümüne bağlı değil. HTTP bağımlılığı güncel hesap devre dışı durumuna bakıyor. Gateway imzayı bağlantı girişinde doğruluyor ve iç rezervasyon uç noktası sonraki tick'lerde yalnız kullanıcı kaydının varlığına bakıyor. `jti` varlığı yaşam döngüsü kaydı sağlamıyor. Kanıt `apps/api/app/routes/auth.py:130–137`, `apps/api/app/security.py:26–38,56–70`, `apps/api/app/deps.py:25–42`, `apps/api/app/routes/admin.py:399–432`, `apps/api/app/routes/realtime.py:77–90`, `apps/gateway/app/main.py:112–135,216–228`.

**Sömürü senaryosu.** İptalden önce açılmış veya düzenlenmiş geçerli kimlik bilgisine dayanan işlemler, beklenen iptal sınırından sonra izinli kalabilir.

**Etki.** Logout sonrası access ömrü boyunca hesap erişimi. Hesap kapatıldığında açık ses oturumunun sürmesi ve kota tüketmesi. Yeniden etkinleştirme sonrası süresi dolmamış eski access token'ın tekrar kullanılabilir olması.

**Düzeltme.** Access/realtime kimlik bilgilerini oturum ailesi ve hesap iptal sürümüne bağla. Gateway girişinde ve süren oturumun yetki yenilemesinde durum denetle. Kapalı hesap için yeni rezervasyonu durdur, temizlik yetkisini koru. Logout, yönetici kapatma ve yeniden etkinleştirmeyi aynı iptal mekanizmasına bağla.

**Yeniden test.** Olumlu: geçerli yeni oturum HTTP ve realtime üzerinden çalışır. Olumsuz: iptal sonrası eski HTTP erişimi ve açık yükseltilmiş bağlantı tanımlanan süre içinde sona erer, eski kimlik bilgisi hesap açıldığında geri gelmez. Mevcut `apps/api/tests/test_auth.py:115–119` ve `apps/api/tests/test_admin.py:141–164` refresh ve devre dışı HTTP davranışını kapsar.

**Kalan risk.** İptal olaylarının çok süreçli yayılımı ve tick zamanında DB/API kesintisi. Sahip API ve gateway ekipleri.

### TM-04 — Gateway kapasite ve tampon sınırları eksik

| Alan | Değer |
|---|---|
| Önem, durum | Orta, Kaldı |
| CWE, ASVS 5.0.0, OWASP Top 10:2025 | CWE-770, CWE-400. V2.1.3, V2.4.1, V4.4.2, V15.2.2. A06 |
| CVSS 3.1 | 5.3, `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L` |
| CVSS 4.0 | `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:N/VA:L/SC:N/SI:N/SA:N` |
| CVE / KEV / EPSS | Uygulanmaz, birinci taraf kodu |
| Etkilenen kapsam ve ön koşullar | Gateway girişinin ağdan erişilebilir olduğu varsayılır. Sağlayıcı kuyrukları için açılmış bir realtime oturum gerekir. |
| İlgili kontroller | RES-01, API-04, INP-04, AI-03 |

**Açıklama.** Yükseltme `ws.accept()` ile Origin kararından önce gerçekleşiyor. Uygulama ilk mesaj için timeout ve akışta soket başına hız sınırı koyuyor. Kaynak/IP, hesap ve servis için eşzamanlı bağlantı kapasitesi görünmüyor. Uygulama çerçeve boyutunu veri tesliminden sonra ölçüyor. Sağlayıcı olay ve iş kuyruklarında kapasite yok. Bir Gemini altyazı tamponu, süregelen kaynak metin ve çeviri yokluğunda birikiyor. Kanıt `apps/gateway/app/main.py:88–112,192–214`, `apps/gateway/app/protocol.py:62–68`, `apps/gateway/app/adapters/common.py:14–32`, `apps/gateway/app/adapters/gemini.py:103–143`, `apps/gateway/app/adapters/soniox.py:100,148–149`, `apps/gateway/app/adapters/elevenlabs.py:86–87,183–185`.

**Sömürü senaryosu.** Kaynak ayırma denetimi uygulanmadan biriken bağlantılar veya tüketici yavaşlığı gateway belleği ve işlem kapasitesini zorlayabilir.

**Etki.** Başka kullanıcılar için gecikme veya kısmi hizmet kaybı. Üretim proxy sınırları ve yük altında gerçek etki doğrulanacak.

**Düzeltme.** Yükseltme öncesi izin ve bağlantı kabul kontrolü koy. Dağıtık hesap/global bütçeleri ve güvenilir proxy kaynak sınırı uygula. Taşıma ve uygulama çerçeve sınırını uyumlu yap. Kuyruk, altyazı tamponu ve çıkış yazım süresini sınırla. Dolulukta kontrollü basınç azaltma ve kapatma uygula.

**Yeniden test.** Olumlu: izinli tarayıcı ve native istemci normal akışı tamamlar. Olumsuz: kapasite doyduğunda kabul ve kuyruk boyutu tanımlı sınırda kalır, sağlıklı bağlantılar hizmet alır. Mevcut `apps/gateway/tests/test_converse.py:71–146` temel kontrolleri kapsıyor.

**Kalan risk.** Sınır değerleri, NAT paylaşımı ve platform kapasitesi yük ölçümüne bağlı. Sahip gateway ve platform.

### TM-05 — İşlem içi metin çevirisi tekilleştirilmiyor

| Alan | Değer |
|---|---|
| Önem, durum | Orta, Kaldı |
| CWE, ASVS 5.0.0, OWASP Top 10:2025 | CWE-362. V2.3.3, V2.3.4, V15.4.2. A06 |
| CVSS 3.1 | 4.2, `CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:N/I:L/A:L` |
| CVSS 4.0 | `CVSS:4.0/AV:N/AC:L/AT:P/PR:L/UI:N/VC:N/VI:L/VA:L/SC:N/SI:N/SA:N` |
| CVE / KEV / EPSS | Uygulanmaz, birinci taraf kodu |
| Etkilenen kapsam ve ön koşullar | Kimliği doğrulanmış metin çeviri trafiği ve aynı işlem anahtarındaki eşzamanlılık. |
| İlgili kontroller | BUS-02, BUS-03, AI-03 |

**Açıklama.** Uç tamamlanmış Translation satırını kontrol ediyor. Kota rezervasyonu mevcut satırı döndürebiliyor. Rezervasyon commit edildiğinde dış çağrının tek sahibini gösteren işlem kaydı yok. Sonuç benzersizliği ancak sağlayıcı işinden sonra devreye giriyor. Kanıt `apps/api/app/routes/translate.py:92–134`, `apps/api/app/quota.py:66–86`, `apps/api/app/models.py:66–79`.

**Sömürü senaryosu.** Aynı mantıksal iş için birden çok yürütücü sağlayıcıya ulaşabilir. İşin tekil sonucu, tekil dış etkiyi garanti etmez.

**Etki.** Yinelenen sağlayıcı maliyeti, yarışan hata/kapanış işlemlerinde hatalı kota durumu ve kaynak tüketimi.

**Düzeltme.** Kullanıcı, anahtar ve istek özetiyle kalıcı bir iş kaydı oluştur. Kota ayırma ile yürütme sahipliğini atomik al. Tamamlanmış yanıtı yeniden kullan, farklı içerikteki çakışmayı tutarlı reddet. Süresi geçen sahipliği güvenli devret ve destekleyen sağlayıcılarda idempotency kullan. Internal çeviri ve gateway geri dönüşlerinde aynı ilkeyi değerlendir.

**Yeniden test.** Olumlu: tamamlanmış işin yeniden teslimi aynı sonucu ve tek ücretlendirmeyi verir. Olumsuz: eşzamanlı çalışmada sahte sağlayıcı yalnız bir işlem kaydeder ve çakışan içerik yan etki üretmez. Mevcut `apps/api/tests/test_translate.py:45–61` sıralı davranışı kapsıyor. PostgreSQL üzerinde doğrulanacak.

**Kalan risk.** Sağlayıcı yanıtı kaybolursa dış işin durumu belirsiz kalabilir ve mutabakat gerektirir. Sahip API.

### TM-06 — Ses girdisinin bütçesi gerçek zaman kotasına bağlanmıyor

| Alan | Değer |
|---|---|
| Önem, durum | Orta, Kaldı |
| CWE, ASVS 5.0.0, OWASP Top 10:2025 | CWE-770. V2.1.3, V2.4.1, V15.2.2. A06 |
| CVSS 3.1 | 4.3, `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:L` |
| CVSS 4.0 | `CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:N/VC:N/VI:N/VA:L/SC:N/SI:N/SA:N` |
| CVE / KEV / EPSS | Uygulanmaz, birinci taraf kodu |
| Etkilenen kapsam ve ön koşullar | Geçerli realtime oturumu. Dış maliyet, seçilen sağlayıcının kabul ve ücretlendirmesine bağlı. |
| İlgili kontroller | RES-01, AI-03, API-04 |

**Açıklama.** Kota duvar süresi ve periyodik rezervasyonla tutuluyor. Mesaj ve tek PCM çerçevesi sınırlı. İşlenen toplam PCM süresi ve yön bazında çoğaltma aynı bütçeyi tüketmiyor. Gemini iki yönlü modda birden çok upstream akışına ses geçiriyor. Kanıt `apps/gateway/app/main.py:192–228`, `apps/gateway/app/protocol.py:11,34–46`, `apps/gateway/app/quota_client.py:78–101`, `apps/gateway/app/adapters/gemini.py:92–101,177–188`.

**Sömürü senaryosu.** Kabul edilen medya işi, gateway'in ayırdığı süre ve sağlayıcı bütçesiyle uyumsuz kalabilir.

**Etki.** Çağrı maliyetleri ile kullanıcı kotasının ayrışması ve paylaşılan sağlayıcı kapasitesinde kısmi kayıp. Ücret etkisi ölçülmedi.

**Düzeltme.** Doğrulanmış PCM biçiminden ses süresini hesapla. Monotonik zamana bağlı küçük jitter bütçesi uygula ve upstream'e iletmeden önce kalanı denetle. Çoklu upstream maliyetini hesap, sağlayıcı ve servis bütçesine dahil et.

**Yeniden test.** Olumlu: çağrı sırasında olağan aralık ve küçük jitter korunur. Olumsuz: ses bütçesi aşıldığında sahte sağlayıcının aldığı iş artmaz ve kota sayacı tutarlı kalır. Mevcut `apps/gateway/tests/test_converse.py:148–173` süre kotasını kapsıyor.

**Kalan risk.** Provider paketleme ve fatura birimleri ayrı ölçümle doğrulanacak. Sahip gateway ve finans operasyonu.

### TM-07 — Refresh ailesi rotasyonu atomik değil

| Alan | Değer |
|---|---|
| Önem, durum | Orta, Kaldı |
| CWE, ASVS 5.0.0, OWASP Top 10:2025 | CWE-362. V10.4.5, V2.3.3. A07 |
| CVSS 3.1 | 4.2, `CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:L/A:N` |
| CVSS 4.0 | `CVSS:4.0/AV:N/AC:L/AT:P/PR:L/UI:N/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N` |
| CVE / KEV / EPSS | Uygulanmaz, birinci taraf kodu |
| Etkilenen kapsam ve ön koşullar | Geçerli refresh kimlik bilgisi ve eşzamanlı yenileme/kapatma. |
| İlgili kontroller | SES-05, BUS-02 |

**Açıklama.** Kullanım ve iptal alanları önce okunuyor. Tüketim ve yeni token ekleme daha sonra aynı işlemin sonuna kadar bekliyor. Tek ardıl veya kilitlenen aile kaydı yok. Sıralı tekrar aileyi iptal ediyor. Kanıt `apps/api/app/routes/auth.py:44–66,106–137`, `apps/api/app/models.py:37–45`.

**Sömürü senaryosu.** Aynı ailede çakışan işlemler, tek kullanım ve kesin iptal beklentisiyle uyuşmayan sonuç üretebilir.

**Etki.** Birden fazla geçerli refresh dalı ve çıkış sonrası süren yenileme olasılığı. PostgreSQL üzerinde yarış sonucu çalıştırılmadı.

**Düzeltme.** Kararı aile satırı ve monotonic iptal durumuyla serileştir. Yenileme sahipliğini koşullu tüketimle al. Tek ardıl, yenileme ve iptal sonucu aynı işlemde korunmalı.

**Yeniden test.** Olumlu: meşru yenileme aileyi korur ve önceki değer tüketilir. Olumsuz: eşzamanlı yenileme ve logout tek ardıl invariantını ve aile iptalini korur. Mevcut `apps/api/tests/test_auth.py:96–119` sıralı örnekleri kapsıyor.

**Kalan risk.** Aynı cihazdan meşru paralel yenilemeler için UI/istemci koordinasyonu gerekir. Sahip API kimlik ekibi.

### TM-08 — Yönetici MFA ve deneme sayaçları yarışa açık

| Alan | Değer |
|---|---|
| Önem, durum | Orta, Kaldı |
| CWE, ASVS 5.0.0, OWASP Top 10:2025 | CWE-362, CWE-307. V6.3.1, V6.3.3, V6.3.4, V6.3.8. A07 |
| CVSS 3.1 | 4.8, `CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N` |
| CVSS 4.0 | `CVSS:4.0/AV:N/AC:L/AT:P/PR:N/UI:N/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N` |
| CVE / KEV / EPSS | Uygulanmaz, birinci taraf kodu |
| Etkilenen kapsam ve ön koşullar | Yönetici giriş ucu. Oturum etkisi için geçerli ilk faktör ve geçerli MFA adımı gerekir. |
| İlgili kontroller | AUT-01, AUT-02, BUS-02 |

**Açıklama.** Parola ve TOTP zorunlu. Sayaç ve TOTP son-adım kararı ORM nesnesinden okunup yazılıyor. Atomik artış veya atomik TOTP tüketimi, uygulama ortak kaynak limiti ve kilitli hesap için pahalı parola işi öncesi kapı görünmüyor. Kanıt `apps/api/app/routes/admin.py:125–153,179–199` ve `apps/api/app/admin_security.py:101–113`.

**Sömürü senaryosu.** Birbirine yakın yönetici giriş kararları son TOTP adımı veya deneme bütçesi için aynı eski durumu değerlendirebilir.

**Etki.** Tek kullanım ve hız denetimi zayıflar. Etki MFA tüketimi ve deneme bütçesiyle sınırlı.

**Düzeltme.** TOTP adımını koşullu, monotonik güncellemeyle tüket. Deneme sayaçlarını ve kilitlemeyi paylaşılan atomik bir depoda tut. Kaynak/hesap bütçesini parola doğrulama maliyetiyle birlikte sınırla.

**Yeniden test.** Olumlu: meşru yönetici girişi parola ve TOTP sonrasında oturum kurar. Olumsuz: aynı TOTP adımı için iki başarı olmaz ve yarışta deneme sayısı kaybolmaz. Mevcut `apps/api/tests/test_admin.py:69–106` sıralı koruma kanıtı.

**Kalan risk.** Kilitleme kötüye kullanımı ve IP dağılımı için adaptif geri çekilme ve alarm. Sahip API kimlik ekibi.

### TM-09 — Rezervasyon kapanışı ve kurtarma kırılgan

| Alan | Değer |
|---|---|
| Önem, durum | Orta, Kaldı |
| CWE, ASVS 5.0.0, OWASP Top 10:2025 | CWE-362, CWE-404. V2.3.1, V2.3.3, V2.3.5, V16.5.2. A06, A10 |
| CVSS 3.1 | 4.2, `CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:N/I:L/A:L` |
| CVSS 4.0 | `CVSS:4.0/AV:N/AC:L/AT:P/PR:L/UI:N/VC:N/VI:L/VA:L/SC:N/SI:N/SA:N` |
| CVE / KEV / EPSS | Uygulanmaz, birinci taraf kodu |
| Etkilenen kapsam ve ön koşullar | Çeviri veya gateway rezervasyonu. Eşzamanlı sonlandırma, servis/yanıt kaybı veya zaman sınırı geçişi. |
| İlgili kontroller | BUS-01, BUS-02, RES-01, ARC-05 |

**Açıklama.** PostgreSQL'de rezervasyon için kullanıcı satırı kilidi var. Commit ve release ayrı okunup koşulsuz ORM yazısıyla tamamlanıyor. Rezervasyonun TTL veya mutabakat durumu yok. Gateway kapanışta yerel referansı ağ isteği yanıtlanmadan bırakıyor. Kota günü, uygunluk kontrolü ve kayıt için ayrı hesaplanıyor. Kanıt `apps/api/app/quota.py:39–47,64–95,100–121`, `apps/api/app/models.py:49–63`, `apps/gateway/app/quota_client.py:78–101`, `apps/gateway/app/main.py:133–158,181–189`.

**Sömürü senaryosu.** Çakışan kapanışların veya yarıda kalan bir ağ işleminin ardından defterde tek ve doğrulanabilir terminal durum oluşmayabilir.

**Etki.** Gereksiz kota blokajı, yanlış tüketim kaydı, başlatılamayan sağlayıcı oturumu için yuvarlanmış ücret ve güvenilmez kullanım ölçümü.

**Düzeltme.** Atomik, idempotent terminal geçiş, tek işlem dönemi, süreli rezervasyon ve mutabakat uygula. Ağ sonucuyla belirsiz kalan kapanışı sakla. Başarılı medya kabulünü çağrı açılışından ayır ve ücretsiz geri dönüş koşullarını sözleşmeye yaz.

**Yeniden test.** Olumlu: normal aç/kullan/kapat akışı doğru miktarı kesinleştirir. Olumsuz: eşzamanlı kapanış, kesinti ve gün geçişi sonunda çift durum veya terk edilmiş rezervasyon kalmaz. Mevcut testler `apps/api/tests/test_translate.py:72–82,125–176` ve `apps/gateway/tests/test_converse.py:236–248`. PostgreSQL ve kesinti senaryoları doğrulanacak.

**Kalan risk.** Arızadan sonra müşteri ve sağlayıcı faturası mutabakatı gerekir. Sahip API ve gateway.

### TM-10 — Sağlayıcı yanıtı ve hata metni yeterince doğrulanmıyor

| Alan | Değer |
|---|---|
| Önem, durum | Orta, Kaldı |
| CWE, ASVS 5.0.0, OWASP Top 10:2025 | CWE-20, CWE-209, CWE-117. V2.2.1, V15.3.2, V16.2.5, V16.5.1. A05, A09, A10 |
| CVSS 3.1 | 4.2, `CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:N/I:L/A:L` |
| CVSS 4.0 | `CVSS:4.0/AV:N/AC:L/AT:P/PR:L/UI:N/VC:N/VI:L/VA:L/SC:N/SI:N/SA:N` |
| CVE / KEV / EPSS | Uygulanmaz, birinci taraf kodu |
| Etkilenen kapsam ve ön koşullar | API metin zinciri ve gateway adaptörleri. Beklenmeyen/bozuk upstream yanıtı veya hata etiketi. |
| İlgili kontroller | INP-01, LOG-02, EXT-03, EXC-01 |

**Açıklama.** Metin zinciri bazı cevaplardaki alan varlığını doğruluyor. İçerik türü yanlışsa hata dış çağrı kategorisine dönüştürülmeden yedeği atlayabiliyor. Gemini, Soniox ve ElevenLabs bazı olay alanlarını tür/boyut denetimi olmadan kullanıyor. Sağlayıcıdan türeyen hata etiketi istemci yanıtı ve loga geçebiliyor. Çıktı kesilmesi için metin zincirinde temel kontroller mevcut. Kanıt `apps/api/app/translators.py:56–61,102–110,138–143,166–182`, `apps/gateway/app/adapters/gemini.py:127–175`, `apps/gateway/app/adapters/soniox.py:64–72,152–210`, `apps/gateway/app/adapters/elevenlabs.py:169–198,228–250`, `apps/gateway/app/main.py:147–150,170–174`.

**Sömürü senaryosu.** Sağlayıcı beklenen veri sözleşmesinden saparsa, geçerli biçimde işlenemeyen veri yerel hata akışını, çıktıyı veya istemciye iletilen altyazıyı etkileyebilir.

**Etki.** Yedek zincirinin devre dışı kalması, kesik/yanlış çıktı, gereksiz hata ve yetersiz redaksiyon. Fiilî sır sızıntısı gözlenmedi.

**Düzeltme.** Gelen olaylar için tip, uzunluk, izinli tamamlanma durumu ve medya biçimi tanımla. Sağlayıcı etiketlerini kontrollü yerel enum'a çevir. İstemciye sabit hata kodu ve loga maskeli metaveri ver. Metin zincirinde geçerli olmayan yanıtı kontrollü yedeklemeye gönder.

**Yeniden test.** Olumlu: geçerli altyazı/ses ve tamamlanmış çeviri iletilir. Olumsuz: sözleşme dışı upstream yanıtı tutarlı hata veya yedek üretir, içerik loga/istemci hata metnine düşmez. Kanıt `apps/gateway/tests/test_adapters.py:104–111,250,347,395` ve `apps/api/tests/test_translators.py:77–89,222–241`.

**Kalan risk.** Sağlayıcı protokolü ve model davranışı değişebilir. Sahip adaptör ve API ekipleri.

### TM-11 — Asenkron görevlerin hata ve EOF temizliği eksik

| Alan | Değer |
|---|---|
| Önem, durum | Orta, Kaldı |
| CWE, ASVS 5.0.0, OWASP Top 10:2025 | CWE-772, CWE-703. V16.5.2, V16.5.3, V13.1.3. A10 |
| CVSS 3.1 | 4.3, `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:L` |
| CVSS 4.0 | `CVSS:4.0/AV:N/AC:L/AT:P/PR:L/UI:N/VC:N/VI:N/VA:L/SC:N/SI:N/SA:N` |
| CVE / KEV / EPSS | Uygulanmaz, birinci taraf kodu |
| Etkilenen kapsam ve ön koşullar | Açık realtime oturum veya sağlayıcı başlangıcı. Upstream hata, temiz EOF, timeout veya iptal ile karşılaşılır. |
| İlgili kontroller | ARC-05, EXC-01, RES-04 |

**Açıklama.** Ana görev grubu `FIRST_EXCEPTION` bekliyor. Tek başına temiz sonlanma kalan görevleri kapatmıyor. Soniox temiz upstream kapanışında olay tüketicisini sona erdirmiyor. Adaptörler iptal edilen işleri her yerde beklemiyor. Gemini paralel açılışında bir koldaki hata diğer açılışın bitmesini engellemiyor. Soniox TTS timeout yolunda soket referansı kapatılmadan kaybolabiliyor. Stop'ta pompa kapanıştan önce iptal edildiği için final olaylarının iletimi de risk altında. Kanıt `apps/gateway/app/main.py:181–189,207–208,230–239`, `apps/gateway/app/adapters/gemini.py:79–101,196–203`, `apps/gateway/app/adapters/soniox.py:64–75,198–210,244–251`, `apps/gateway/app/adapters/elevenlabs.py:114`.

**Sömürü senaryosu.** Rutin ağ arızası veya temiz sağlayıcı kapanışı, iç görevlerin ya da dış bağlantıların kendiliğinden sona ermesi için yeterli olmayabilir.

**Etki.** Askıda oturumlar, soket/görev kaynak kaybı, kayıp son altyazı ve artan çağrı maliyeti. API zinciri tüm devreler açıkken yine bütün sağlayıcıları deniyor (`apps/api/app/translators.py:166–182`). Gateway'deki OpenAI stub'ının hata tipi normal yedekleme yolunun dışına düşüyor (`apps/gateway/app/providers.py:88–97,168–172`).

**Düzeltme.** Görevleri ortak yaşam döngüsünde gözet. Akış sonunu açıkça bildir, iptal edilen görevleri bekle ve son olayları süre sınırı içinde ilet. Tüm açık adaptörlerde kaynak iadesi ve kota kapatmayı doğrula. Toplam sağlayıcı kesintisinde global deneme bütçesi ve sınırlı half-open probe uygula. Üretimde tamamlanmamış adaptör kaydını engelle.

**Yeniden test.** Olumlu: düzenli kapanış sonuçları boşaltır, tüm kaynakları kapatır. Olumsuz: sahte upstream EOF ve timeout sonrasında açık görev/tampon/rezervasyon kalmaz ve tüm açık devreler tekrar yüklenmez. Kanıt `apps/gateway/tests/test_converse.py:221–248` ve `apps/api/tests/test_translators.py:160–175`.

**Kalan risk.** Gecikmeli dış bağlantı kapanışının sağlayıcı tarafı ayrıca izlenmeli. Sahip gateway.

### TM-12 — Sır kaydetme ve terminal çıktısı yetersiz korunuyor

| Alan | Değer |
|---|---|
| Önem, durum | Orta, Kaldı |
| CWE, ASVS 5.0.0, OWASP Top 10:2025 | CWE-276, CWE-532. V13.3.1, V13.3.2, V16.2.5. A04, A09 |
| CVSS 3.1 | 4.7, `CVSS:3.1/AV:L/AC:H/PR:L/UI:N/S:U/C:H/I:N/A:N` |
| CVSS 4.0 | `CVSS:4.0/AV:L/AC:L/AT:P/PR:L/UI:N/VC:H/VI:N/VA:N/SC:N/SI:N/SA:N` |
| CVE / KEV / EPSS | Uygulanmaz, birinci taraf kodu |
| Etkilenen kapsam ve ön koşullar | Yerel anahtar kurulum betiği. Yerel hedefe veya terminal kaydına erişim ve uygun dosya/terminal koşulları. |
| İlgili kontroller | KEY-02, LOG-02 |

**Açıklama.** Betik normal dosya yazımından sonra izinleri `0600` yapıyor. Bu sıra oluşturma anında korumayı ve kesinti durumunda bütünlüğü garanti etmiyor. Mevcut ve yeni sırların önek/uzunluğu terminale yazılıyor. Gizli giriş sağlanamayan terminali reddeden kontrol yok. Sağlayıcı anahtarı birden çok servis dosyasına kopyalanabiliyor. Kanıt `scripts/anahtar_ekle.py:27–36,48–66,159–178`. Yönetici kurulum CLI'ı da TOTP kurulum materyalini güvenilir terminal kontrolü olmadan çıktı olarak veriyor (`apps/api/app/cli.py:33–37`).

**Sömürü senaryosu.** Fazla geniş yerel dosya/terminal erişimi veya kesinti, işletmenin sır saklama ve maskeleme beklentisini bozabilir.

**Etki.** Sağlayıcı anahtarının yerel ifşası, kurulum dosyasının bozulması veya kullanılmayan serviste gereksiz sır kopyası. Gerçek dosya izinleri veya terminal kayıtları incelenmedi.

**Düzeltme.** Güvenli izinle oluşturulmuş aynı dizin geçici dosyasına yaz ve atomik değiştir. Hedef sahipliği ve güvenli yol politikasını denetle. Sırdan türetilmiş çıktı üretme ve güvensiz terminalde işlemi durdur. Her servise yalnız gereken anahtarı ver. Anahtar doğrulamasını ayrı, açıkça seçilen işlem olarak tut.

**Yeniden test.** Olumlu: sentetik anahtar güvenli izinle kaydedilir ve çıktı sadece durum içerir. Olumsuz: kesilen yazma eski dosyayı korur, güvensiz terminal sır kabul etmez, kayıtlar anahtar parçası içermez. Betik çalıştırılmadı.

**Kalan risk.** Operatör makinesi, terminal kayıt politikası ve anahtar rotasyonu. Sahip platform.

### TM-13 — Veritabanı hata zinciri kişisel veriyi loga taşıyabilir

| Alan | Değer |
|---|---|
| Önem, durum | Düşük, Kaldı |
| CWE, ASVS 5.0.0, OWASP Top 10:2025 | CWE-532. V16.2.5, V16.5.1. A09, A10 |
| CVSS 3.1 | 2.5, `CVSS:3.1/AV:L/AC:H/PR:L/UI:N/S:U/C:L/I:N/A:N` |
| CVSS 4.0 | `CVSS:4.0/AV:L/AC:L/AT:P/PR:L/UI:N/VC:L/VI:N/VA:N/SC:N/SI:N/SA:N` |
| CVE / KEV / EPSS | Uygulanmaz, birinci taraf kodu |
| Etkilenen kapsam ve ön koşullar | API SQL yazımı. Parametre içeren DB istisnası ve sunucu hata kayıtlarına erişim. |
| İlgili kontroller | LOG-02, EXC-01 |

**Açıklama.** API genel hata işleyicisi sadece istisna tipini logluyor. SQLAlchemy engine parametre maskelemesi istemiyor ve özel ele alınmayan commit hatası ASGI hata zincirine çıkabiliyor. Kurulu Starlette hata middleware'i istisnayı tekrar yükseltiyor ve Uvicorn traceback kaydediyor. Serbest biçimli yönetici işlem gerekçeleri de denetim kayıtlarına aktarılıyor. Kanıt `apps/api/app/db.py:9–12`, `apps/api/app/errors.py:38–42`, `apps/api/app/routes/translate.py:115–134`, `apps/api/app/routes/admin.py:395–416,513–559`, kurulu `starlette/middleware/errors.py:163–186` ve `uvicorn/protocols/http/h11_impl.py:414–416`.

**Sömürü senaryosu.** Beklenmeyen veritabanı hatası ve ayrıntılı sunucu logu birleştiğinde, çeviri/kimlik verisi uygulama kayıt politikasının dışına çıkabilir.

**Etki.** Hata koşulunda çeviri metni veya kişisel verinin daha geniş log erişim alanına taşınması. Gerçek kayıt açığa çıkması doğrulanmadı. Gateway'in Gemini query anahtarının debug/egress loglarında görünmemesi de operasyonel doğrulama gerektiriyor (`apps/gateway/app/adapters/gemini.py:79–90`).

**Düzeltme.** SQL parametrelerini maskele. ASGI sunucu dahil tüm hata kayıt zincirinde kontrollü olay alanları kullan. Serbest biçimli yönetici detayı yerine asgari, izinli alan sakla. Log erişimi, saklama ve dışa aktarımı sınırlı tut.

**Yeniden test.** Olumlu: kayıt politikası meşru olayı tanılamaya yeterli metaveriyle yazar. Olumsuz: sentetik hata yolunda sunucu logu ve hata yanıtı metin, e-posta, token veya SQL parametresi içermez. Üretim log toplayıcısı da doğrulanacak.

**Kalan risk.** Üçüncü taraf SDK, traceback ve toplayıcı yapılandırmaları süreç dışında değişebilir. Sahip platform ve veri güvenliği.

### TM-14 — İç kota kapanışı realtime defteriyle sınırlı değil

| Alan | Değer |
|---|---|
| Önem, durum | Düşük, Kaldı |
| CWE, ASVS 5.0.0, OWASP Top 10:2025 | CWE-863. V8.2.2, V13.2.1, V13.2.2. A01 |
| CVSS 3.1 | 2.7, `CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:N/I:L/A:N` |
| CVSS 4.0 | `CVSS:4.0/AV:N/AC:L/AT:N/PR:H/UI:N/VC:N/VI:L/VA:N/SC:N/SI:N/SA:N` |
| CVE / KEV / EPSS | Uygulanmaz, birinci taraf kodu |
| Etkilenen kapsam ve ön koşullar | İç rezervasyon commit/release sınıfı. Yetkili servis bağlamı ve ilgili sahip/kayıt bilgisi gerekir. |
| İlgili kontroller | ARC-04, AZ-04, NET-04 |

**Açıklama.** Oluşturma realtime türüyle sınırlı. Kapanış ortak defter fonksiyonunda yalnız kayıt/sahip eşleşmesini kontrol ediyor. Internal router uygulamaya bağlı ve sabit zamanlı bir token kontrolü var. Haricî ingress'in bu yolları engellediğine ilişkin dağıtım kanıtı yok. Kanıt `apps/api/app/quota.py:100–121`, `apps/api/app/routes/realtime.py:48–62,77–124` ve `apps/api/app/main.py:44–47`.

**Sömürü senaryosu.** Gateway servis yetkisi dışına çıkan bir kapanış kararı aynı kullanıcının başka amaçla tutulan kota satırını etkileyebilir.

**Etki.** Metin defteri bütünlüğü ve en az yetki sınırı zayıflıyor. Uygulama katmanında doğrudan genel erişim veya başka kullanıcıya ait metin çevirisi BOLA'sı görülmedi.

**Düzeltme.** Kota kapatma sorgusunu sahip, realtime türü ve izinli servis kapsamında sınırla. API/web ingress ve hizmet ağına deny-by-default politika uygula. İç hizmet kimliğini tek gizli değer yerine yönü ve yetki alanı olan kimlikle modelle.

**Yeniden test.** Olumlu: izinli servis doğru realtime rezervasyonu kapatır. Olumsuz: farklı sahip/tür, yanlış servis kapsamı veya haricî ingress DB etkisi üretmez. `apps/api/tests/test_translate.py:115–122,179–191,211–218` bazı uygulama retlerini kapsıyor.

**Kalan risk.** Servis kimliği rotasyonu ve ağ sınırı dağıtımda doğrulanacak. Sahip platform ve API.

### TM-15 — Gateway yön ve mod yetkisi eksik

| Alan | Değer |
|---|---|
| Önem, durum | Düşük, Kaldı |
| CWE, ASVS 5.0.0, OWASP Top 10:2025 | CWE-863, CWE-20. V4.4.2, V8.2.2, V9.2.2. A01 |
| CVSS 3.1 | 3.1, `CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:N/I:L/A:N` |
| CVSS 4.0 | `CVSS:4.0/AV:N/AC:L/AT:P/PR:L/UI:N/VC:N/VI:L/VA:N/SC:N/SI:N/SA:N` |
| CVE / KEV / EPSS | Uygulanmaz, birinci taraf kodu |
| Etkilenen kapsam ve ön koşullar | Geçerli bir realtime token ve yetki veya maliyet yaklaşımı farklı olan yön/mod. |
| İlgili kontroller | API-04, TOK-02, INP-01 |

**Açıklama.** Token kaynak ve hedefi imzalıyor. Gateway dil çiftini sırasız küme olarak karşılaştırıyor. Ardından yön ve istemcinin seçtiği mod sağlayıcı rotasına giriyor. Token mod içermiyor. Doğrulayıcı kaynak/hedef claim'lerini zorunlu listeye almamış. Kanıt `apps/api/app/security.py:56–70`, `apps/gateway/app/main.py:36–47,121–129`, `apps/gateway/app/routing.py:8–30`.

**Sömürü senaryosu.** Token geçerli olsa da gateway, sağlayıcıyı etkileyen yön/mod seçiminin düzenlenen izinle aynı olduğunu kanıtlayamıyor.

**Etki.** Ürün yönü veya modu ayrı fiyat/izin olarak ele alıyorsa farklı rota ve maliyet oluşabilir. Çiftin her iki yönde serbest bırakıldığı bir ürün kararında vektörün etki varsayımı yeniden değerlendirilir.

**Düzeltme.** Tek yön ve çift yön için açık claim sözleşmesi tanımla. Tek yönde sıralı dil çifti, çift yönde izinli mod ve normalleştirilmiş dil kümesi kontrol et. Claim'leri tip ve değer açısından doğrula. Sözleşmeyi rota ve kota politikasıyla eşleştir.

**Yeniden test.** Olumlu: izinli tek ve çift yön çalışır. Olumsuz: izin verilmeyen kapsam yönlendirme ve rezervasyon üretmez. Mevcut `apps/gateway/tests/test_converse.py:97–101` farklı dil çiftini kapsıyor.

**Kalan risk.** Sağlayıcı tarifeleri ve destek yönleri değişirse claim ve rota politikası birlikte güncellenmeli. Sahip gateway ve ürün.

## 4. P0 kontrol matrisi

Matris, yerel katalogdaki istenen ailelerin P0 kartlarını ve yönetici parola akışındaki PWD kartlarını kapsar. `Geçti` ilgili kod veya mevcut sentetik test kanıtını ifade eder. `Kaldı` kaynakta görülen sapmayı, `Doğrulanacak` eksik kanıtı, `Uygulanmaz` kapsamda bulunmayan işlevi gösterir. API’de 64, gateway’de 41 sentetik test geçti. PostgreSQL eşzamanlılığı, gerçek sağlayıcı davranışı, ters vekil ve üretim ağ politikaları ayrıca doğrulanmalıdır.

61 kontrolün 8’i Geçti, 30’u Kaldı, 15’i Doğrulanacak ve 8’i Uygulanmaz. Yerel katalogda PKY-01, P1 olarak sınıflandırılmıştır.

| Kontrol | Durum | Kanıt veya gerekçe |
|---|---|---|
| ARC-01 · Sistem envanteri | Doğrulanacak | `README.md:19–27`, `packages/shared/CONTRACT.md:5–45` ve router tanımları kaynak envanteri sağlar. Çalışan servis, sahip, ağ ve eski uç envanteri için dağıtım kanıtı eksik. |
| ARC-02 · Güvenilir kimlik bağlamı | Geçti | Public API kimliği doğrulanmış JWT’den, gateway kimliği doğrulanmış realtime token’dan, yönetici rolü DB’den alınır. `apps/api/app/deps.py:25–42`, `apps/gateway/app/main.py:112–126`, `apps/api/app/routes/admin.py:68–92`. |
| ARC-04 · Servisler arası en az yetki | Kaldı | Ortak servis kimliği kota ve çeviri uçlarına erişir. Kota kapanışında kayıt türü servis kapsamına bağlanmaz. `apps/api/app/routes/realtime.py:51–55,77–129`, `apps/api/app/quota.py:100–121`. |
| ARC-05 · Arızada kontrollü davranış | Kaldı | Kota servisi yokken bağlantı reddedilir. Tüm sağlayıcı devreleri açıkken metin zinciri yeniden bütün üyeleri dener, gateway olay kuyruğunda üst sınır yoktur. `test_quota_service_down_fails_closed`, `apps/api/app/translators.py:166–182`, `apps/gateway/app/adapters/common.py:11–24`. |
| INP-01 · Sunucu şeması | Kaldı | Girdi alanı ve WS çerçevesi sınırları var. Sağlayıcının yanıt alan türü ve gateway çıkış şeması uçtan uca doğrulanmaz. `apps/api/app/routes/translate.py:25–28`, `apps/gateway/app/protocol.py:18–68`, `apps/api/app/translators.py:102–110`, `apps/gateway/app/main.py:212–214`. |
| INP-02 · SQL ve komut sınırları | Geçti | İncelenen kullanıcı sorguları ORM üzerinden parametreli. `apps/api/app/routes/auth.py:80–94`, `apps/api/app/routes/translate.py:138–148`, `apps/api/app/routes/admin.py:329–346`. Kullanıcı girdisinden üretilen SQL veya shell komutu saptanmadı. |
| INP-03 · Çıktı bağlamı | Geçti | Backend çeviri, yönetim ve hata alanlarını JSON veri olarak serileştirir. `apps/api/app/routes/translate.py:31–56`, `apps/api/app/errors.py:18–42`, `apps/gateway/app/main.py:212–214`. İstemci render’ı denetim kapsamı dışındadır. |
| INP-04 · Ayrıştırıcı bütçesi | Kaldı | WS’de uygulama mesaj sınırı var. HTTP gövdesi için toplam ayrıştırma bütçesi ve sağlayıcı çıktısında kümülatif sınır kaynakta yok. `apps/api/app/main.py:22–47`, `apps/gateway/app/protocol.py:62–68`, `apps/gateway/app/adapters/soniox.py:152–203`. |
| BUS-01 · Durum makinesi | Kaldı | Kota kapanışları önceden okunan duruma göre yazılır. Birbiriyle çelişen terminal geçişler atomik olarak ayrıştırılmaz. `apps/api/app/quota.py:100–121`. |
| BUS-02 · Atomik karar | Kaldı | PostgreSQL rezervasyon kilidi var. İstek sahipliği, kota kapanışı, refresh rotasyonu ve MFA tüketimi aynı korumayı kullanmıyor. `apps/api/app/quota.py:64–86,100–121`, `apps/api/app/routes/translate.py:92–134`, `apps/api/app/routes/auth.py:106–126`, `apps/api/app/routes/admin.py:179–197`. |
| BUS-04 · Toplu işlem | Uygulanmaz | Kota ve çeviri işlemleri tek nesneye uygulanır. Realtime kısmi saniye tahsisi açık iş kuralıdır. `apps/api/app/routes/realtime.py:58–95`. |
| BUS-05 · Yürütmede güncel yetki | Kaldı | Gateway dönemsel rezervasyon ister. Internal API hesap varlığını denetler, devre dışı hesabı ayırmaz. `apps/gateway/app/main.py:216–228`, `apps/api/app/routes/realtime.py:77–90`. |
| API-01 · Uç ve sürüm envanteri | Doğrulanacak | OpenAPI tutarlılık denetimi CI’a bağlı ve WS sözleşmesi belgeli. Üretim route/origin haritası ile anonim ve rol bazlı tam uç matrisi eksik. `.github/workflows/ci.yml:72–91`, `packages/shared/CONTRACT.md:5–45`. |
| API-02 · Alan düzeyinde izin | Doğrulanacak | Ayrı yanıt modelleri ve anahtar/çeviri içeriği sızıntısı için mevcut testler var. Viewer’ın audit içeriği için alan bazlı ihtiyaç kanıtı eksik. `apps/api/app/routes/admin.py:439–470,513–559`, `test_stats_users_and_no_translation_text`, `test_providers_never_expose_keys`. |
| API-04 · WebSocket kimliği ve kapsamı | Kaldı | İlk mesaj doğrulaması, Origin ve boyut/hız denetimi var. Bağlantı düzeyinde bütçe ve aktif iptal eksik, yön karşılaştırması sırasız. `apps/gateway/app/main.py:102–139,192–228`, `test_requires_auth_first`, `test_disallowed_origin`, `test_oversized_message`, `test_rate_limit`. |
| AUT-01 · Yönetici MFA kapısı | Geçti | Parola aşaması yönetici oturum çerezi oluşturmaz. Oturumu MFA akışı verir. `apps/api/app/routes/admin.py:125–163,166–199`, `test_mfa_token_cannot_be_used_as_session_or_app_token`. Tüketim atomikliği BUS-02’de değerlendirilmiştir. |
| AUT-02 · Dağıtık deneme bütçesi | Kaldı | Hesap başına sıralı kilit var. Parola/MFA sayaçları atomik değil ve kaynak/global deneme bütçesi kaynakta yok. `apps/api/app/routes/admin.py:125–156,179–197`, `test_wrong_password_is_generic_and_locks_after_limit`. |
| AUT-03 · Reset ve davet token’ı | Uygulanmaz | İncelenen API’de öz servis parola reset/davet tokenı akışı yok. Yönetici TOTP sıfırlaması yerel operatör işlemidir. `apps/api/app/cli.py:78–94`. |
| AUT-04 · MFA kurtarma | Doğrulanacak | Operatör CLI sıfırlamayı denetim kaydına geçirir ve mevcut yönetici oturumlarını iptal eder. Operatör erişim sınırı, bildirimi ve önceden verilmiş MFA bekleme tokenlarının iptal davranışı eksik. `apps/api/app/cli.py:78–94`, `apps/api/app/admin_security.py:120–145`. |
| AUT-05 · CAPTCHA tek kullanımı | Uygulanmaz | Kapsamdaki federasyon, yönetici ve gateway giriş akışlarında CAPTCHA yok. OIDC nonce TOK-03’te, TOTP tüketimi BUS-02’de değerlendirilmiştir. |
| SES-01 · Oturum taşıma | Geçti | Public API Bearer, gateway ilk mesaj ve yönetici çerezi ayrı. Üretim yönetici çerezi Secure, HttpOnly ve SameSite=Strict. `apps/api/app/deps.py:25–35`, `apps/gateway/app/main.py:112–118`, `apps/api/app/routes/admin.py:159–163`, `apps/api/app/config.py:65–67`. Dış TLS NET-01’dedir. |
| SES-02 · Yetki değişiminde yenileme | Kaldı | Başarılı giriş yeni token/oturum üretir. Account kapatma ve sonraki açma arasında önceki access token’ı ayıran yetki sürümü yoktur. `apps/api/app/routes/auth.py:44–57`, `apps/api/app/admin_security.py:155–168`, `apps/api/app/deps.py:32–42`, `apps/api/app/routes/admin.py:399–433`. |
| SES-04 · İptal ve açık bağlantılar | Kaldı | Logout refresh ailesini iptal eder, access doğrulaması aileyi sorgulamaz. Açık gateway oturumu güncel hesap durumuna bağlanmaz. `apps/api/app/routes/auth.py:130–137`, `apps/api/app/deps.py:25–42`, `apps/api/app/routes/realtime.py:77–90`, `test_logout_revokes_refresh`. |
| SES-05 · Refresh ardıllığı | Kaldı | Sıralı rotasyon ve reuse testleri var. Okuma, tüketim ve yeni token verme tek atomik hak talebi değildir. `apps/api/app/routes/auth.py:106–126`, `test_refresh_rotation`, `test_refresh_replay_revokes_family`. |
| AZ-01 · Nesne ve duruma göre izin | Kaldı | Public çeviride sahiplik sorgusu ve 404 doğrulandı. Delegasyon sırasında hesap durumu ve internal işlem kapsamı eksik. `apps/api/app/routes/translate.py:138–148`, `apps/api/app/routes/realtime.py:77–113`, `test_other_users_translation_is_404`. |
| AZ-02 · Veri düzeyi ikinci bariyer | Doğrulanacak | Sahiplik sorgusu ve yabancı anahtarlar var. Üretim DB rolü, yetki ve satır politikası kanıtı yok. `apps/api/app/routes/translate.py:138–148`, `apps/api/app/models.py:49–79`. |
| AZ-03 · Arama ve dashboard | Doğrulanacak | Yönetim araması/sayaçları yönetici oturumuna bağlı ve çeviri içeriği testte dışarıda. Proxy cache ve audit alan izin politikası bilinmiyor. `apps/api/app/routes/admin.py:246–295,329–358,532–559`, `test_stats_users_and_no_translation_text`. |
| AZ-04 · İç içe referans kapsamı | Kaldı | Kota nesnesinde sahip kontrolü var, ledger türü yetkilendirilmez. `apps/api/app/quota.py:100–121`, `apps/api/app/routes/realtime.py:98–113`, `test_internal_commit_other_users_reservation_is_404`. |
| AZ-05 · Yönetici sınırı ve rol | Kaldı | Admin/viewer ayrımı ve değişiklik kısıtı testte mevcut. Operatör CLI son etkin yöneticiyi korumadan kapatabiliyor. `apps/api/app/routes/admin.py:68–92`, `apps/api/app/cli.py:97–111`, `test_viewer_can_read_but_not_change`. |
| TOK-01 · JWT doğrulaması | Geçti | Algoritma, audience, issuer, süre/kimlik alanları ve amaç doğrulaması mevcut, IdP imza anahtarı sabit kaynaktan. `apps/api/app/security.py:41–53`, `apps/api/app/oidc.py:35–66`, `apps/gateway/app/main.py:36–47`, `test_alg_none_rejected`, `test_rejects_bad_tokens`. |
| TOK-02 · Token amaçları ve anahtar kaynağı | Geçti | Access/realtime/MFA doğrulayıcıları ayrı audience/tür bekler. API prod’da access ve realtime imzalama sırlarının eşitliğini reddeder. Internal servis başlığı ayrı doğrulanır. `apps/api/app/security.py:41–70`, `apps/api/app/config.py:87–92`, `apps/api/app/admin_security.py:134–145`, `apps/api/app/routes/realtime.py:51–55`. Canlı anahtar geçişi KEY-03’te açık. |
| TOK-03 · OIDC giriş bağlama | Kaldı | Nonce imzalı claim ile karşılaştırılır. Backend’de giriş girişimine bağlı, tek kullanımlık challenge tüketimi yok. `apps/api/app/oidc.py:67–73`, `apps/api/app/routes/auth.py:69–103`. İstemci PKCE/redirect uygulaması kapsam dışı. |
| TOK-04 · SAML | Uygulanmaz | Kimlik sağlayıcı akışı Apple/Google OIDC ve yerel yönetici MFA ile sınırlı. `apps/api/app/routes/auth.py:21–24`, `apps/api/app/routes/admin.py:125–199`. |
| TOK-05 · Federasyondan sonra yerel oturum | Kaldı | Kimlik `(provider, subject)` ile eşlenir ve e-postaya göre otomatik bağlama yok. Yerel refresh akışında IdP kapatma/oturum sinyalini işleyen mekanizma bulunmadı. `apps/api/app/routes/auth.py:80–102,106–126`, `apps/api/app/models.py:23–33`. |
| KEY-01 · Üretim başlangıç kapısı | Kaldı | İki servisin üretime özel kontrolleri var. Profil varsayılanı dev ve yönetici CLI aynı kontrolü çağırmıyor. `apps/api/app/config.py:13–21,82–104`, `apps/gateway/app/config.py:18–25,64–77`, `apps/api/app/cli.py:28–30`, `test_prod_refuses_insecure_defaults`. |
| KEY-02 · Sır dağıtımı ve erişim | Kaldı | Yardımcı betik dosya modunu yazımdan sonra değiştirir, sır ön eki/uzunluğu gösterir ve bazı anahtarları iki servise yazar. `scripts/anahtar_ekle.py:27–36,48–66,159–178`. |
| KEY-03 · Anahtar rotasyonu | Doğrulanacak | Uygulama yapılandırması tek imzalama anahtarı/değeriyle çalışır. Planlı geçiş, acil iptal ve replica’larda eski anahtar reddi kanıtı yok. `apps/api/app/security.py:27–70`, `apps/api/app/routes/realtime.py:51–55`. |
| NET-01 · TLS ve sertifika | Kaldı | Üretim kapısında public gateway adresi için `wss` ve sağlayıcı hedefleri için TLS zorunlu tutulmaz. Canlı dağıtımın TLS davranışı için kanıt yok. `apps/api/app/config.py:39,49–63,82–104`, `apps/api/app/routes/realtime.py:41–44`, `apps/gateway/app/config.py:24,64–77`. |
| NET-02 · Origin ağ erişimi | Doğrulanacak | Public ve internal router aynı API uygulamasında. Uygulama portuna doğrudan erişim ve proxy/host politikası için dağıtım kanıtı yok. `apps/api/app/main.py:40–47`, `apps/api/app/routes/realtime.py:48–55`. |
| NET-03 · Forwarded başlık zinciri | Doğrulanacak | Admin audit uygulamanın çözdüğü peer’i kullanıyor ve doğrudan istemci başlığını okumuyor. Bu değeri belirleyen Uvicorn/proxy güven zinciri doğrulanmadı. `apps/api/app/routes/admin.py:51–53`. |
| NET-04 · Servis bazlı ağ erişimi | Doğrulanacak | Internal uçta uygulama tokenı ve proxy kısıtı beklentisi var. Ağ izolasyonu, internal route yayını ve egress matrisi kanıtı yok. `apps/api/app/routes/realtime.py:48–55,77–129`. |
| OPS-01 · Üretim profili | Kaldı | API’de üretim şema uçları kapanır ve health minimaldir. Profilin dev varsayılanına düşmesi veya CLI başlangıcı güvenlik kapısını atlayabiliyor. `apps/api/app/main.py:18–42`, `apps/api/app/config.py:13–21,82–104`, `apps/api/app/cli.py:28–30`, `test_guard_refuses_prod_and_non_sqlite`. |
| OPS-02 · Host yönetim erişimi | Doğrulanacak | Ayrı servis kullanıcısı, dosya izinleri, SSH/yönetim ağı ve kurtarma prosedürü için host kanıtı yok. |
| OPS-03 · Container yetki sınırı | Uygulanmaz | Üretim tasarımı pm2 + nginx, container runtime kapsamda yok. CI PostgreSQL servisi üretim dağıtımı değildir. `docs/adr/0001-monorepo-ve-yigin.md:6`, `.github/workflows/ci.yml:32–56`. |
| OPS-04 · Build bütünlüğü | Doğrulanacak | Her iki Python lock dosyası ve CI’da locked sync, test, pip-audit, gitleaks ve Semgrep var. Semgrep CI kapsamı `apps` ile sınırlı. SBOM, imzalı artefakt ve doğrulama kaydı yok. `.github/workflows/ci.yml:11–30,110–120`. |
| DAT-02 · Export ve geçici dosyalar | Uygulanmaz | İncelenen kullanıcı API’si JSON çeviri kaydı döndürür. Hassas export, kullanıcı dosya yükleme veya geçici indirme akışı bu backend kapsamında yok. `apps/api/app/main.py:44–47`, `apps/api/app/routes/translate.py:138–148`. |
| DAT-04 · Veri deposu ayrıcalıkları | Doğrulanacak | Runtime ve migration rollerinin ayrılığı, DB grant’leri ve yedek erişimi için işletim kanıtı yok. `apps/api/app/db.py:9–16`, `apps/api/migrations/env.py`. |
| LOG-01 · Yapılandırılmış güvenlik olayları | Kaldı | API/gateway olayları ve yönetici audit kayıtları var. Katmanlar arası ortak correlation ID ve bütün ret kararları için olay üretimi kaynakta eksik. `apps/api/app/security.py:18–20`, `apps/api/app/admin_security.py:195–215`, `apps/gateway/app/main.py:26–28,162–189`. |
| LOG-02 · Sır ve kişisel veri redaksiyonu | Kaldı | SQL parametrelerinin ASGI yığın izine düşme yolu, serbest metin admin audit kaydı ve sağlayıcı etiketlerinin log/yanıta aktarımı var. `apps/api/app/db.py:9–12`, `apps/api/app/errors.py:38–42`, `apps/api/app/routes/admin.py:395–416`, `apps/gateway/app/main.py:147–174`. |
| EXT-01 · Dış hedef politikası | Kaldı | Sağlayıcı hedefleri yapılandırmadan gelir. Ortak şema, host ve port allowlist’i yoktur. Kullanıcı kontrollü genel URL girişi görülmedi. `apps/api/app/config.py:49–63`, `apps/api/app/translators.py:80–85,200–227`, `apps/gateway/app/config.py:39–50`. |
| EXT-02 · DNS ve bağlantı sürekliliği | Doğrulanacak | İzinli dış hedef ve egress politikasıyla DNS/bağlantı kararının tutarlılığı için dağıtım kanıtı yok. `apps/api/app/translators.py:80–97`, `apps/gateway/app/adapters/soniox.py:34–43,124–136`. |
| EXT-04 · Webhook imzası ve replay | Uygulanmaz | İncelenen uygulamalarda gelen sağlayıcı/webhook rotası yok. `apps/api/app/main.py:44–47`, `apps/gateway/app/main.py:77–85`. |
| EXT-05 · LDAP/SMTP/SIEM bağlayıcıları | Uygulanmaz | Bu bağlayıcılar incelenen servislerde yok. API ve gateway servis kimliği ARC-04, KEY-03 ve NET-04’te izleniyor. |
| RES-01 · Çok boyutlu kota | Kaldı | Günlük kullanıcı kotası ve bağlantı başına mesaj sayacı var. Hesap/IP/global eşzamanlı bütçe, ses pacing’i ve atomik maliyet kontrolü eksik. `apps/api/app/quota.py:39–52,64–86`, `apps/gateway/app/main.py:50–59,99–133,192–228`. |
| PWD-01 · Yönetici parola alt sınırı | Geçti | Tek yönetici parola oluşturma yolunda 15–128 sınırı uygulanır, mevcut test sınır politikasını kapsar. `apps/api/app/cli.py:40–60`, `apps/api/app/admin_security.py:53–61`, `test_password_policy`. |
| PWD-03 · Sızmış parola kontrolü | Kaldı | Kısa sabit yerel liste, tekrar ve e-posta parçası kontrolleri var. Güncellenebilir sızmış parola kontrolü yok. `apps/api/app/admin_security.py:35–61`. |
| PWD-04 · Hash maliyeti ve geçişi | Kaldı | Argon2id kullanılıyor. Maliyet sürümlemesi, başarılı girişte gerektiğinde rehash ve kapasite ölçümü kanıtı eksik. `apps/api/app/admin_security.py:32,64–72`, `apps/api/app/routes/admin.py:125–156`. |
| EXC-01 · Hata halinde kapalı kalma | Kaldı | Kota servisi hatasında bağlantı kapanır ve API gövdesi geneldir. Gateway bazı upstream hata etiketlerini doğrudan istemciye verir, temizleme/bütçe bütünlüğü tüm arızalarda korunmaz. `apps/gateway/app/main.py:133–154,162–189`, `apps/api/app/errors.py:38–42`, `test_quota_service_down_fails_closed`. |
| AI-01 · Dolaylı talimat ve araç yetkisi | Doğrulanacak | Sabit sistem talimatı ve ayrı kullanıcı verisi var, çeviri zinciri araç kullanmıyor. Talimat içeren çeviri verisine karşı model davranışı için test kanıtı eksik. `apps/api/app/translators.py:44–53,87–97,121–133`. |
| AI-02 · LLM çıktı işleme | Kaldı | RAG kapsamda yok. Backend çeviri yanıtının alan türünü ve gateway olay şemasını tam doğrulamıyor. `apps/api/app/translators.py:56–61,102–110`, `apps/gateway/app/main.py:212–214`. |
| AI-03 · LLM maliyet bütçesi | Kaldı | Karakter/saniye kotası, ücretli çağrı başına bağımsız maliyet defteri veya global bütçe yerini tutmuyor. Başarı ve iş hatasındaki çağrı gideri defterde ölçülmez. `apps/api/app/routes/translate.py:99–134`, `apps/api/app/translators.py:87–97,166–182`, `apps/api/app/models.py:49–63`. |

## 5. Geçmiş bulgularla karşılaştırma

Katalog girdileri `/Users/emre/Code/red-team/catalog/findings.yaml` dosyasındaki anonim A1–B4 kayıtları. Benzer kök neden değerlendirmesi yalnız bu commit için geçerli.

| Geçmiş bulgu | Bu backend'deki durum | Kanıt |
|---|---|---|
| A1 · Tek kullanımlık olmayan doğrulama | Benzer kök neden. OIDC denemesi tüketilmiyor, refresh ve yönetici MFA tüketimi atomik değil. | TM-02, TM-07, TM-08 |
| A2 · Yanıt farkından doğrulama çıkarımı | Aynı kök nedene dair kanıt yok. Hatalı yönetici parolası genel yanıtla reddediliyor. Zamanlama ve diğer hata sınıfları doğrulanacak. | `apps/api/app/routes/admin.py:125–153`, `test_wrong_password_is_generic_and_locks_after_limit` |
| A3 · Makineyle çözülebilen doğrulama sorusu | Uygulanmaz. İncelenen giriş akışlarında bu doğrulama mekanizması yok. | `apps/api/app/routes/auth.py:69–103`, `apps/api/app/routes/admin.py:125–199` |
| A4 · Savunma politikasının dışarı sızması | Aynı politika ifşası görülmedi. Upstream hata etiketlerinin aktarımı ayrı kanıtlı hata sınırı sorunu. Üretim hata/log ayarları doğrulanacak. | TM-01, TM-10, TM-13 |
| A5 · Hız sınırının tek kontrole dayanması | Benzer kaynak koruma açığı. Hesap ve bağlantı başına başlangıç korumaları çok katmanlı bütçe oluşturmuyor. | TM-04, TM-06, TM-08 |
| B1 · Forwarded IP güven zinciri | Doğrulanacak. Admin uygulamanın çözdüğü peer'i kullanıyor. Bu kimliğin hangi proxy'lerden kabul edildiği dağıtım kanıtı gerektiriyor. | `apps/api/app/routes/admin.py:51–53`, NET-03 |
| B2 · İkincil formda aynı doğrulama açığı | Aynı form akışı Uygulanmaz. Yetki sınırlarını tüm giriş noktalarında tutarlı uygulama ihtiyacı burada da var. | Yönetici CLI başlangıç kontrolü, TM-01 |
| B3 · Doğrulama üretim ucunun sınırsız olması | Benzer kaynak boyutu eksiği. Realtime token veren uç kalan kotayı kontrol ediyor. Düzenlemeyi hesap/servis bazında sayan uygulama kontrolü bulunmadı. | `apps/api/app/routes/realtime.py:31–45`, TM-04, TM-06 |
| B4 · Üretimde varsayılan imzalama sırrı | Aynı yapılandırma kök nedeni koşullu. Açık `prod` profilinde bilinen zayıf sırlar reddediliyor. Profil eksikken uygulama dev'e düşüyor. Fiilî yayın durumu doğrulanacak. | TM-01, KEY-01, KEY-03 |

### Teknik ve veri kapsamındaki tamamlayıcı sonuçlar

- **HTTP sahipliği ve amaç ayrımı — Geçti, test edilen yollar.** Metin geçmişi kullanıcıyla birlikte sorgulanıyor ve başka kullanıcı için 404 dönüyor. Access JWT, realtime JWT ve yönetici MFA aynı kabul yolundan geçmiyor. Internal başlık uygulamada ayrı doğrulanıyor. Kanıt `apps/api/app/routes/translate.py:138–148`, `apps/api/app/security.py:41–70`, `apps/api/tests/test_translate.py:85–92,115–122,179–191`, `apps/api/tests/test_auth.py:73–93`. Son kullanıcıya ait kayıt BOLA'sı için pozitif kanıt bulunmadı.
- **Kota giriş sınırları — Geçti, test edilen yollar.** Reserve/settle gövdesinde değer aralığı ve anahtar sınırı var. Kota defteri pozitif rezervasyonu istiyor ve kapanış miktarını tahsise sıkıştırıyor. Boş sağlayıcı anahtarı satırları yapılandırılmamış olarak yorumlanıyor. Kanıt `apps/api/app/routes/realtime.py:58–74`, `apps/api/app/quota.py:64–67,107–112`, `apps/api/app/config.py:69–80`, `apps/gateway/app/config.py:56–62`, `test_blank_key_lines_mean_not_configured`.
- **Hata sözleşmesi — Kaldı, INP-01/EXC-01.** Bazı nonce ve MFA metinleri API şemasını geçebildiği halde karşılaştırma rutinlerinin kabul ettiği karakter kümesi daha dar. Gateway bazı çerçeve türlerini uygulama şema hatası yerine genel kapanışa taşıyabiliyor. Beklenen ret ve kapanış kodlarını sınırda tekilleştir. Kanıt `apps/api/app/oidc.py:67–73`, `apps/api/app/admin_security.py:101–113`, `apps/gateway/app/main.py:88–96,177–180`. Kimlik doğrulamanın atlandığına dair kanıt yok.
- **AI-01 — Doğrulanacak.** Metin zinciri sabit sistem mesajı ve ayrı kullanıcı verisi kullanıyor. Kullanıcı metni sabit ayıraç içine doğrudan ekleniyor. İncelenen isteklerde araç çağırma veya RAG yetkisi yok. Bu nedenle açık soru çevirinin talimat içeren metne rağmen doğruluğu ve çıktının bütünlüğü. `docs/06-OLCUM.md` içindeki önceki kısa sağlayıcı ölçümü bu denetimde tekrarlanmadı. Sözleşme dışı model yanıtı için mevcut mock testlerin kapsamı artırılmalı. Kanıt `apps/api/app/translators.py:44–61,87–110,121–143`, `apps/gateway/app/adapters/elevenlabs.py:202–234`.
- **Veri minimizasyonu — Kaldı, DAT-01/DAT-05 P1.** Metin çevirisi kaynak ve hedef metni kalıcı olarak yazıyor. İncelenen backend'de süre sonu, silme veya yedek geri yükleme sonrası silme uygulaması görülmedi. Geçmiş özelliğini amaca bağlı saklama süresi ve silme ile tasarla. İstek tekilleştirme metaverisini kullanıcı geçmişinden ayır ve gerekli en az veriyi sakla. DB rolleri ve yedekler DAT-04 altında doğrulanacak. Kanıt `apps/api/app/routes/translate.py:115–148`, `apps/api/app/models.py:66–79`, `apps/api/migrations/versions/0001_initial.py:55–69`. Saklama ve silme değerlendirmesi [KVKK Kurulu, 6698 sayılı Kanun m. 4 ve 7 uygulaması](https://www.kvkk.gov.tr/Icerik/5424/2018-142).
- **Canlı ses, ölçüm çıktısı ve sağlayıcı saklaması — Doğrulanacak.** Ana gateway yolunda ham sesi diske yazan uygulama kodu görülmedi. Benchmark istenirse altyazıyı ve dosya adını düz metin sonuç dosyasına yazıyor. Sentetik veriyi varsayılan tut, sonuç izinlerini ve silme süresini belirle. Sağlayıcı veri bölgesi, saklama ve arıza kayıtları sözleşme ve dağıtım kanıtı gerektirir. Kanıt `apps/gateway/bench/run.py:67–69,135–137,151–152` ve `docs/adr/0004-veri-ve-kayit-varsayilani.md:5–9`.
- **Yönetici yardımcı kontrolleri — Kaldı, AZ-05/PWD-03/PWD-04.** CLI'da son etkin yönetici için koruma görülmedi. Argon2id hash var. Değişebilir sızmış parola kontrolü ve otomatik yeniden hash kapsamı eksik. Uygulama erişiminden ayrı olarak işletmen kimliği ve kurtarma yolunu doğrula. Kanıt `apps/api/app/cli.py:97–111`, `apps/api/app/admin_security.py:32–72`.
- **Kod kalitesi.** Döngü ve görev ömrü için birincil açıklıklar TM-09 ve TM-11'de. Geniş istisna bastırması temizliğin başarıyla bittiği sinyalini kaldırıyor (`apps/gateway/app/main.py:151–152,181–189`). OpenAI realtime kayıt dalının üretime açılması tamamlanmış adaptör gerektiriyor (`apps/gateway/app/providers.py:88–97,168–172`). İzole testler tamamlandı. Test kapsam yüzdesi ölçülmedi.

## 6. Önceliklendirilmiş düzeltme listesi

Süreler bir mühendis için kod, test ve inceleme tahminidir. Platform erişimi, ürün kararı ve dış sağlayıcı doğrulamaları ayrı bağımlılıklar.

| Öncelik | Düzeltme | Kontrol/bulgu | Tahmini iş |
|---|---|---|---|
| 1 · P0 | Üretimde güvenli başlangıç ve ingress kapısı. Açık profil, ayrı sırlar, güvenli dış URL, yönetici CLI doğrulaması ve internal yol izolasyonu. | KEY-01, OPS-01, NET-01/04. TM-01, TM-14 | 1–2 gün + platform doğrulaması |
| 2 · P0 | OIDC tek kullanımlık giriş denemesi ve refresh ailesi için atomik tüketim. PostgreSQL üzerinde yarış ve iptal testleri. | TOK-03, SES-05, BUS-02. TM-02, TM-07 | 3–5 gün |
| 3 · P0 | Hesap/oturum sürümüyle HTTP ve açık realtime yetkisinin iptali. İç kota yetkisini servis ve kayıt türüyle sınırla. | SES-02/04, TOK-05, AZ-01/04, BUS-05, ARC-04. TM-03, TM-14 | 2–4 gün |
| 4 · P0 | Ücretli çeviri isteğinde kalıcı işlem sahipliği. Atomik kota kapanışı, rezervasyon ömrü ve mutabakat. | BUS-01/02, RES-01, AI-03. TM-05, TM-09 | 4–6 gün |
| 5 · P0 | Gateway kapasite, taşıma ve kuyruk sınırı. Ses süresi/maliyet bütçeleri ve izinli yön/mod sözleşmesi. HTTP ayrıştırma ve token düzenleme bütçelerini de ekle. | API-04, INP-04, RES-01, AI-03. TM-04, TM-06, TM-15 | 3–5 gün |
| 6 · P0 | TOTP ve deneme sayaçlarının atomikliği. Son yönetici koruması, güncel parola listesi, yeniden hash ve kilit kapasitesi testi. | AUT-02, BUS-02, AZ-05, PWD-03/04. TM-08 | 2–4 gün |
| 7 · P0 | Sağlayıcı verisini katı doğrula. Arıza/EOF temizliği, sınırlı devre denemeleri, hedef/TLS politikası ve idempotent süreli kapanış. | ARC-05, INP-01, EXT-01, EXC-01, AI-02. TM-10, TM-11 | 3–5 gün |
| 8 · P0 | Betikte güvenli atomik dosya yazımı ve tamamen maskeli çıktı. SQL/ASGI/provider kayıt zincirinde redaksiyon ve ortak güvenlik olayı şeması. | KEY-02, LOG-01/02, EXC-01. TM-12, TM-13 | 2–3 gün |
| 9 · P0 kanıt | JWKS ve anahtar geçişi, ağ/host/DB rolleri, build bütünlüğü, kaynak ve üretim envanteri, model çıktısı, sentetik test ve güvenlik olayları için kanıt topla. Açık matris satırlarını kontrol sahibiyle kapat. | §4'teki Doğrulanacak satırlar | 3–5 gün + işletim erişimi |
| 10 · P1 | Çeviri geçmişi ve benchmark saklama politikası. TTL/silme/geri yükleme, cache, veri işleme sözleşmesi ve sağlayıcı ölçümü. | DAT-01/03/05, EXT-03, RES-04 | 2–4 gün + veri sahibi kararı |

Yayın kontrolü için uygulama düzeltmelerine ek olarak, açık P0 satırlarında kapsamı belli test veya dağıtım kanıtı ve varsa yetkili risk kabulü kaydedilmeli. **Yayın kararı için başlıca eksik kanıtlar**, gerçek PostgreSQL üzerinde eşzamanlı işlem doğrulaması, üretimde internal ingress/TLS/sır sınırları ve sağlayıcı kesintisinde canlı oturumun güvenilir kapanışıdır.
