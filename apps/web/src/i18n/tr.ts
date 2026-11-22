/**
 * Türkçe sözlük — sitedeki görünen her metnin kaynağı.
 * en.ts aynı anahtar kümesini taşımak zorunda (tip + tests/dictionaries.test.ts).
 *
 * Ürün iddiaları yalnız docs/ altındaki belgelerden: ölçülmemiş hız/kalite iddiası yok,
 * henüz olmayan özellikler "Yakında" etiketli. Hukuki metinler TASLAK; köşeli parantezli
 * alanlar hukuk/şirket bilgisiyle doldurulacak.
 */
export const tr = {
  meta: {
    siteName: "Translate Meet",
    ogLocale: "tr_TR",
    defaultDescription:
      "Translate Meet: Türkçe öncelikli canlı konuşma ve metin çevirisi. Telefonu aranıza koyun, herkes kendi dilinde konuşsun.",
  },
  common: {
    skipToContent: "İçeriğe geç",
    primaryNav: "Ana menü",
    homeLink: "Translate Meet ana sayfa",
    switchLanguage: "English",
    switchLanguageLabel: "Bu sayfanın İngilizcesi",
    comingSoon: "Yakında",
    firstRelease: "İlk sürüm",
    backHome: "Ana sayfaya dön",
  },
  nav: {
    features: "Özellikler",
    how: "Nasıl çalışır",
    data: "Veriniz",
    faq: "SSS",
  },
  home: {
    metaTitle: "Translate Meet — Türkçe öncelikli canlı çeviri",
    metaDescription:
      "İki kişi, iki dil, tek telefon. Translate Meet konuşmanızı karşı tarafın dilinde altyazı ve sesle iletir; metin çevirisi önce Türkiye'de işlenir.",
    hero: {
      eyebrow: "Türkçe öncelikli çeviri uygulaması",
      title: "Telefonu aranıza koyun, herkes kendi dilinde konuşsun.",
      lead: "Translate Meet konuştuğunuzu karşı tarafın dilinde altyazı ve sesle iletir. Ekran ikiye bölünür: alt yarı sizin, üst yarı karşınızdakinin.",
      ctaPrimary: "Nasıl çalışır?",
      ctaSecondary: "Verinize ne oluyor?",
      storeNote: "App Store ve Google Play'de yakında.",
    },
    mockup: {
      ariaLabel:
        "Translate Meet sohbet ekranı örneği: ekranın üst yarısı karşıdaki kişiye dönük ve İngilizce, alt yarısı size dönük ve Türkçe.",
      topLang: "English",
      topTranslatedLabel: "Translation",
      topTranslatedText: "Could we move the meeting to Tuesday at three?",
      topHeardLabel: "You said",
      topHeardText: "Yes, Tuesday at three works for me.",
      bottomLang: "Türkçe",
      bottomHeardLabel: "Siz",
      bottomHeardText: "Toplantıyı salı saat üçe alabilir miyiz?",
      bottomTranslatedLabel: "Çeviri",
      bottomTranslatedText: "Evet, salı saat üç benim için uygun.",
      pair: "TR ⇄ EN",
      listening: "Dinleniyor…",
    },
    features: {
      title: "Neler yapabilirsiniz?",
      lead: "İlk sürüm iki temel iş üzerine kurulu: yüz yüze konuşma ve metin çevirisi. Diğerleri yol haritasında.",
      items: [
        {
          id: "converse",
          status: "live",
          title: "Canlı sohbet çevirisi",
          body: "İki kişi tek telefonla konuşur. Uygulama konuşulan dili algılar, çeviriyi karşı tarafın yarısında altyazı olarak gösterir ve seslendirir.",
        },
        {
          id: "translate",
          status: "live",
          title: "Metin çevirisi",
          body: "Yazın ya da yapıştırın, çeviriyi kopyalayın. Metin çevirisi önce Türkiye'de çalışan bir sağlayıcıda işlenir.",
        },
        {
          id: "turkish",
          status: "live",
          title: "Türkçe öncelikli",
          body: "Arayüz ve kalite çalışması Türkçeden başlıyor; ilk dil çifti Türkçe ⇄ İngilizce, diğer diller kademeli olarak ekleniyor.",
        },
        {
          id: "rooms",
          status: "soon",
          title: "Toplantı odaları",
          body: "QR kodla odaya katılın; herkes kendi dilinde konuşsun, herkes kendi dilinde altyazı görsün.",
        },
        {
          id: "camera",
          status: "soon",
          title: "Kamera ile çeviri",
          body: "Tabela, menü ya da belgeyi kameraya gösterin, metni kendi dilinizde okuyun.",
        },
        {
          id: "voice",
          status: "soon",
          title: "Kendi sesinizle",
          body: "Çeviriyi kendi sesinize benzeyen bir sesle duyurun. Yalnız ayrı ve açık rızanızla açılabilecek isteğe bağlı bir özellik olacak.",
        },
        {
          id: "offline",
          status: "soon",
          title: "Çevrimdışı",
          body: "İnternet olmadığında da temel metin çevirisi için indirilebilir dil paketi.",
        },
      ],
    },
    how: {
      title: "Nasıl çalışır?",
      lead: "Kurulumdan ilk cümleye üç adım.",
      steps: [
        {
          title: "Dilleri seçin",
          body: "Uygulamayı açın, kendi dilinizi ve karşınızdakinin dilini seçin.",
        },
        {
          title: "Telefonu aranıza koyun",
          body: "Ekran ikiye bölünür. Alt yarı size, üst yarı karşınızdakine dönüktür.",
        },
        {
          title: "Sırayla konuşun",
          body: "Söylediğiniz, karşı tarafın yarısında onun dilinde altyazı ve ses olarak belirir. Önemli konularda, özellikle sayı ve tarihlerde, altyazıdan teyit edin.",
        },
      ],
    },
    data: {
      title: "Veriniz",
      lead: "Bir çeviri uygulamasına sesinizi ve sözlerinizi emanet ediyorsunuz. Neyin nereye gittiğini açıkça yazıyoruz.",
      points: [
        {
          title: "Metin çevirisi önce Türkiye'de",
          body: "Metin çevirisi ilk olarak İşNet'in Gao Kaptan hizmetinde, Türkiye'de işlenir. Kaptan yanıt veremezse yedek sağlayıcılara (Google Gemini, OpenAI, Anthropic Claude, Moonshot Kimi) geçilir; bunlar Türkiye dışındadır.",
        },
        {
          title: "Ham ses varsayılan olarak saklanmaz",
          body: "Canlı sohbette sesiniz yalnız çeviri için sağlayıcıya (Google Gemini Live Translate ya da ElevenLabs) akıtılır; sunucularımızda ham ses kaydı tutulmaz.",
        },
        {
          title: "Geçmiş sizindir",
          body: "Metin çevirisi geçmişiniz yalnız sizin hesabınıza bağlı tutulur. Hesabınızı sildiğinizde geçmiş de silinir.",
        },
        {
          title: "Yöneticiler içerik görmez",
          body: "Yönetim panelinde kullanım sayıları görünür; çevirdiğiniz metinler ve konuşmalarınız görünmez.",
        },
      ],
      cta: "Gizlilik politikasının taslağını okuyun",
    },
    download: {
      title: "Mağazalarda yakında",
      lead: "Uygulama henüz yayında değil. Mağaza bağlantıları yayın günü burada olacak.",
      appStore: "App Store",
      googlePlay: "Google Play",
      listLabel: "Uygulama mağazaları",
    },
    faqPreview: {
      title: "Sık sorulanlar",
      more: "Tüm soruları görün",
    },
  },
  faq: {
    metaTitle: "Sık sorulan sorular",
    metaDescription:
      "Translate Meet hakkında sık sorulan sorular: diller, ses kaydı, verinin işlendiği yer, toplantı odaları ve hesap silme.",
    title: "Sık sorulan sorular",
    lead: "Bulamadığınız bir soru olursa iletişim adresimiz yayın öncesi bu sayfaya eklenecek.",
    relatedLink: "İlgili sayfa",
    items: [
      {
        id: "what",
        q: "Translate Meet nedir?",
        a: "Yüz yüze konuşmayı ve metni çeviren, Türkçe öncelikli bir mobil uygulamadır. Telefonu iki kişinin arasına koyarsınız; ekranın her yarısı bir kişiye dönüktür ve söylenenler karşı tarafın dilinde altyazı ve sesle görünür.",
      },
      {
        id: "languages",
        q: "Hangi dilleri destekliyor?",
        a: "İlk dil çifti Türkçe ⇄ İngilizce. Arapça, Almanca ve diğer diller kalite testlerinden geçtikçe kademeli olarak eklenecek.",
      },
      {
        id: "audio",
        q: "Konuşmalarım kaydediliyor mu?",
        a: "Varsayılan olarak hayır. Canlı sohbette ses yalnız çeviri için sağlayıcıya akıtılır, sunucularımızda ham ses saklanmaz. İleride kayıt veya tutanak özelliği gelirse yalnız siz açtığınızda ve ekranda açıkça görünerek çalışacak.",
      },
      {
        id: "where",
        q: "Çevirilerim nerede işleniyor?",
        a: "Metin çevirisi önce İşNet'in Gao Kaptan hizmetinde, Türkiye'de işlenir; erişilemezse sırayla Google Gemini, OpenAI, Anthropic Claude ve Moonshot Kimi yedek olarak kullanılır. Canlı konuşma çevirisi Google Gemini Live Translate ve ElevenLabs (konuşmayı yazıya ve yazıyı sese çevirme) üzerinden yapılır. Türkiye dışındaki sağlayıcılara aktarım KVKK aydınlatma metninde açıklanır.",
      },
      {
        id: "admins",
        q: "Çevirilerimi başkası görebilir mi?",
        a: "Metin çevirisi geçmişiniz yalnız sizin hesabınıza bağlıdır. Yöneticiler yalnız kullanım sayılarını görür, içerikleri görmez.",
      },
      {
        id: "interpreter",
        q: "Profesyonel tercümanın yerine geçer mi?",
        a: "Hayır. Makine çevirisi hata yapabilir; özellikle sayı, tarih ve olumsuzluklarda altyazıdan teyit edin. Sağlık, hukuk ve resmî işlemlerde profesyonel tercüman kullanın.",
      },
      {
        id: "rooms",
        q: "Toplantı odası ne zaman geliyor?",
        a: "Yakında. Odaya QR kod veya bağlantıyla katılacaksınız; her katılımcı kendi dilini seçecek ve altyazıyı kendi dilinde görecek.",
      },
      {
        id: "voice",
        q: "Kendi sesimle konuşma özelliği ne olacak?",
        a: "Yakında gelecek isteğe bağlı bir özellik. Ses örneğiniz ayrı bir açık rıza alınmadan işlenmeyecek ve bu özellik için ayrı bir aydınlatma metni yayımlanacak.",
      },
      {
        id: "download",
        q: "Uygulamayı nereden indirebilirim?",
        a: "Uygulama henüz yayında değil. App Store ve Google Play bağlantıları yayın günü bu sitede paylaşılacak.",
      },
      {
        id: "delete",
        q: "Hesabımı nasıl silerim?",
        a: "Uygulamada Ayarlar → Hesabı sil adımını izleyin. Hesabınızla birlikte metin çevirisi geçmişiniz de silinir. Ayrıntılar hesap silme sayfasındadır.",
      },
    ],
  },
  footer: {
    tagline: "Türkçe öncelikli canlı çeviri.",
    productHeading: "Ürün",
    legalHeading: "Hukuki",
    noTracking: "Bu sitede çerez, analiz ya da izleme aracı kullanılmaz.",
    rights: "© {year} Translate Meet",
  },
  legal: {
    eyebrow: "Hukuki metin",
    draftBanner: "TASLAK — hukuk onayı bekliyor",
    draftNote:
      "Bu metin yayın öncesi taslaktır ve hukuki inceleme bekliyor. Köşeli parantez içindeki alanlar ([Şirket unvanı] gibi) henüz doldurulmadı.",
    draftDate: "Taslak tarihi: {date}",
    toc: "Bu sayfada",
    otherDocs: "Diğer hukuki metinler",
    docs: {
      privacy: {
        navLabel: "Gizlilik",
        metaTitle: "Gizlilik politikası (taslak)",
        metaDescription:
          "Translate Meet gizlilik politikası taslağı: hangi verilerin hangi sağlayıcıda işlendiği, saklama, yurt dışı aktarım ve haklarınız.",
        title: "Gizlilik politikası",
        intro:
          "Bu politika Translate Meet mobil uygulamasının ve bu web sitesinin kişisel verilerinizi nasıl işlediğini açıklar.",
        sections: [
          {
            heading: "Veri sorumlusu",
            paragraphs: [
              "Veri sorumlusu [Şirket unvanı] ([Adres], MERSİS: [MERSİS]) şirketidir. Gizlilikle ilgili her soru için [İletişim e-postası] adresine yazabilirsiniz.",
            ],
          },
          {
            heading: "İşlediğimiz veriler",
            paragraphs: ["Uygulamayı kullandığınızda yalnız hizmet için gereken verileri işleriz:"],
            items: [
              "Hesap: Apple veya Google ile girişte bu sağlayıcının verdiği kullanıcı kimliği, paylaşmayı seçerseniz e-posta adresiniz ve uygulama dili tercihiniz.",
              "Oturum: oturumunuzu yenilemek için kullanılan belirteçlerin özetleri (belirtecin kendisi değil).",
              "Kullanım: kota için gün bazında kullanım miktarları (ör. kaç saniye konuşma, kaç karakter çeviri).",
              "Metin çevirisi: çevirdiğiniz metin, çeviri sonucu, dil çifti ve çeviriyi yapan sağlayıcının adı. Bu kayıt sizin geçmişinizdir.",
              "Canlı sohbet: mikrofon sesi çeviri için gerçek zamanlı olarak sağlayıcıya akıtılır. Ham ses ve altyazılar varsayılan olarak sunucularımızda saklanmaz.",
              "Teknik kayıtlar: hata ve güvenlik kayıtlarında yalnız kimlik ve hata kodu tutulur; ses, altyazı, çeviri metni ve oturum belirteci kayıtlara yazılmaz.",
            ],
          },
          {
            heading: "İşleme amaçları",
            items: [
              "Çeviri hizmetini sunmak (canlı sohbet ve metin çevirisi).",
              "Hesabınızı ve oturumunuzu güvenli biçimde yönetmek.",
              "Kullanım kotasını uygulamak ve kötüye kullanımı önlemek.",
              "Size kendi çeviri geçmişinizi göstermek.",
              "Yasal yükümlülükleri yerine getirmek.",
            ],
          },
          {
            heading: "Hizmet sağlayıcılar ve aktarım",
            paragraphs: ["Çeviri için içeriğiniz aşağıdaki sağlayıcılara iletilir:"],
            items: [
              "Gao Kaptan (İşNet) — metin çevirisinin birincil sağlayıcısı. Veri Türkiye'de işlenir.",
              "Google Gemini — metin çevirisinde ilk yedek; canlı sohbette Gemini Live Translate ile konuşma çevirisi. Türkiye dışı, işleme yeri: [doğrulanacak].",
              "OpenAI — metin çevirisinde yedek. Türkiye dışı, işleme yeri: [doğrulanacak].",
              "Anthropic (Claude) — metin çevirisinde yedek. Türkiye dışı, işleme yeri: [doğrulanacak].",
              "Moonshot AI (Kimi) — metin çevirisinde son yedek. Türkiye dışı, işleme yeri: [doğrulanacak].",
              "ElevenLabs — canlı sohbette konuşmayı yazıya çevirme ve çeviriyi seslendirme. Türkiye dışı, işleme yeri: [doğrulanacak].",
              "Apple ve Google — yalnız giriş (kimlik doğrulama) için.",
              "Barındırma: [Barındırma sağlayıcısı ve konumu].",
            ],
          },
          {
            heading: "Yurt dışına aktarım",
            paragraphs: [
              "Yedek metin çevirisi sağlayıcıları ve canlı sohbet sağlayıcıları Türkiye dışındadır. Bu sağlayıcılara gönderilen içerik, 6698 sayılı KVKK'nın 9. maddesi kapsamında yurt dışına aktarılmış olur. Aktarımın hukuki dayanağı: [hukuk ekibi belirleyecek — ör. standart sözleşme]. Sağlayıcı seçiminde mümkün olduğunda AB bölgesi ve sıfır saklama (zero data retention) seçenekleri tercih edilir.",
            ],
          },
          {
            heading: "Saklama süreleri",
            items: [
              "Hesap bilgileri: hesabınız açık olduğu sürece; hesap silindiğinde silinir.",
              "Metin çevirisi geçmişi: hesabınız açık olduğu sürece; hesap silindiğinde silinir.",
              "Ham ses ve canlı altyazılar: varsayılan olarak saklanmaz.",
              "Kullanım kayıtları: hesap silindiğinde silinir; yasal saklama yükümlülüğü olan kayıtlar için süre: [Saklama süresi].",
              "Teknik ve güvenlik kayıtları: [Saklama süresi].",
              "Sağlayıcıların kendi tarafındaki saklama: sağlayıcı sözleşmelerine göre [doğrulanacak].",
            ],
          },
          {
            heading: "Yönetici erişimi",
            paragraphs: [
              "Yönetim panelinde kullanıcı başına kullanım sayıları görünür. Çevirdiğiniz metinler, konuşmalarınız ve altyazılarınız panelde gösterilmez.",
            ],
          },
          {
            heading: "Haklarınız",
            paragraphs: [
              "KVKK'nın 11. maddesindeki haklarınızı (bilgi alma, düzeltme, silme, itiraz ve diğerleri) KVKK aydınlatma metninde ayrıntılı olarak bulabilirsiniz. Hesabınızı uygulama içinden istediğiniz an silebilirsiniz.",
            ],
          },
          {
            heading: "Çerezler ve analiz",
            paragraphs: [
              "Bu web sitesi zorunlu olmayan çerez, analiz aracı, reklam ya da izleme kodu kullanmaz ve üçüncü taraf betik, yazı tipi veya görsel yüklemez. Bu nedenle sitede çerez onay bandı yoktur. İleride ölçüm eklenirse önce bu politika güncellenecek ve onayınız istenecektir.",
            ],
          },
          {
            heading: "Ses verisi ve gelecekteki özellikler",
            paragraphs: [
              "Ham ses bugün yalnız anlık çeviri için kullanılır ve saklanmaz. İleride gelecek \"kendi sesinizle\" (ses klonu) özelliği isteğe bağlı olacak; ses örneğiniz ayrı ve açık rızanız alınmadan işlenmeyecek, bu özellik için ayrı bir aydınlatma metni ve ayrı silme denetimi sunulacaktır.",
            ],
          },
          {
            heading: "Yaş sınırı",
            paragraphs: ["Uygulama [Yaş sınırı] yaşından küçükler için tasarlanmamıştır."],
          },
          {
            heading: "Değişiklikler ve iletişim",
            paragraphs: [
              "Bu politikayı güncellediğimizde tarihini değiştirir, önemli değişiklikleri uygulama içinde duyururuz. Sorularınız için: [İletişim e-postası].",
            ],
          },
        ],
      },
      terms: {
        navLabel: "Kullanım şartları",
        metaTitle: "Kullanım şartları (taslak)",
        metaDescription:
          "Translate Meet kullanım şartları taslağı: hizmetin kapsamı, hesap, kabul edilebilir kullanım ve çeviri doğruluğuna ilişkin sınırlar.",
        title: "Kullanım şartları",
        intro:
          "Bu şartlar Translate Meet mobil uygulamasını ve bu web sitesini kullanımınızı düzenler. Uygulamayı kullanarak bu şartları kabul etmiş olursunuz.",
        sections: [
          {
            heading: "Taraflar",
            paragraphs: [
              "Hizmet [Şirket unvanı] ([Adres], MERSİS: [MERSİS]) tarafından sunulur. İletişim: [İletişim e-postası].",
            ],
          },
          {
            heading: "Hizmetin kapsamı",
            paragraphs: [
              "Translate Meet canlı sohbet çevirisi ve metin çevirisi sunar. Toplantı odaları, kamera ile çeviri, kendi sesinizle konuşma ve çevrimdışı kullanım henüz sunulmamaktadır; geldiklerinde bu şartlar güncellenecektir.",
            ],
          },
          {
            heading: "Hesap",
            paragraphs: [
              "Uygulamaya Apple veya Google hesabınızla giriş yaparsınız. Hesabınızın güvenliğinden ve hesabınız üzerinden yapılan kullanımdan siz sorumlusunuz.",
            ],
          },
          {
            heading: "Kabul edilebilir kullanım",
            items: [
              "Karşınızdaki kişiye çeviri uygulaması kullandığınızı söyleyin; konuşmanın bir uygulama üzerinden çevrildiğini bilmesi gerekir.",
              "Hizmeti başkalarının haklarını ihlal etmek, yasa dışı içerik üretmek veya yaymak için kullanmayın.",
              "Kotayı aşmaya, hizmeti tersine mühendislikle çözmeye veya sistemleri zorlamaya çalışmayın.",
            ],
          },
          {
            heading: "Çeviri doğruluğu",
            paragraphs: [
              "Çeviriler makine tarafından üretilir ve hata içerebilir; özellikle isim, sayı, tarih ve olumsuzluklarda anlam kayabilir. Translate Meet profesyonel tercümanın yerine geçmez. Sağlık, hukuk, finans ve resmî işlemlerde çeviriye dayanarak karar vermeden önce profesyonel destek alın.",
            ],
          },
          {
            heading: "Kota ve ücretlendirme",
            paragraphs: [
              "Hizmet günlük kullanım kotalarıyla sunulur. Ücretli planlar ve fiyatlar: [Ücretlendirme koşulları — belirlenecek]. Mağaza üzerinden yapılan satın almalarda ilgili mağazanın koşulları da geçerlidir.",
            ],
          },
          {
            heading: "Fikri mülkiyet",
            paragraphs: [
              "Uygulama, marka ve site içeriği [Şirket unvanı]'na aittir. Çevirdiğiniz metinler ve çeviri sonuçları üzerindeki haklarınız sizde kalır.",
            ],
          },
          {
            heading: "Sorumluluğun sınırlandırılması",
            paragraphs: [
              "Yürürlükteki hukukun izin verdiği ölçüde, çeviri hatalarından veya hizmetin kesintisinden doğan dolaylı zararlardan sorumlu değiliz. [Sorumluluk sınırları hukuk ekibince netleştirilecek.]",
            ],
          },
          {
            heading: "Fesih ve hesap silme",
            paragraphs: [
              "Hesabınızı istediğiniz an uygulamada Ayarlar → Hesabı sil adımıyla silebilirsiniz. Bu şartların ağır ihlalinde hesabı askıya alabilir veya kapatabiliriz.",
            ],
          },
          {
            heading: "Değişiklikler ve uygulanacak hukuk",
            paragraphs: [
              "Şartları güncellediğimizde önemli değişiklikleri uygulama içinde duyururuz. Bu şartlara Türkiye Cumhuriyeti hukuku uygulanır; uyuşmazlıklarda [Yetkili mahkeme ve icra daireleri] yetkilidir. Tüketici olarak yasal haklarınız saklıdır.",
            ],
          },
        ],
      },
      kvkk: {
        navLabel: "KVKK aydınlatma",
        metaTitle: "KVKK aydınlatma metni (taslak)",
        metaDescription:
          "6698 sayılı KVKK kapsamında Translate Meet aydınlatma metni taslağı: işlenen veriler, amaçlar, hukuki sebepler, aktarım ve 11. madde hakları.",
        title: "KVKK aydınlatma metni",
        intro:
          "6698 sayılı Kişisel Verilerin Korunması Kanunu'nun (KVKK) 10. maddesi uyarınca, kişisel verilerinizin işlenmesine ilişkin sizi bilgilendiriyoruz.",
        sections: [
          {
            heading: "Veri sorumlusu",
            paragraphs: [
              "[Şirket unvanı], [Adres], MERSİS: [MERSİS], e-posta: [İletişim e-postası].",
            ],
          },
          {
            heading: "İşlenen kişisel veri kategorileri",
            items: [
              "Kimlik ve iletişim: Apple/Google kullanıcı kimliği, paylaşırsanız e-posta adresi.",
              "Müşteri işlem: metin çevirisi geçmişi (kaynak metin, çeviri, dil çifti, sağlayıcı), dil tercihi, kullanım miktarları.",
              "İşlem güvenliği: oturum belirteci özetleri, hata ve güvenlik kayıtlarında kimlik ve kod.",
              "Ses: canlı sohbette mikrofon sesi — yalnız anlık çeviri için işlenir, varsayılan olarak saklanmaz.",
            ],
          },
          {
            heading: "İşleme amaçları",
            items: [
              "Çeviri hizmetinin sunulması ve sözleşmenin ifası.",
              "Hesap ve oturum güvenliğinin sağlanması.",
              "Kullanım kotasının uygulanması ve kötüye kullanımın önlenmesi.",
              "Hukuki yükümlülüklerin yerine getirilmesi ve yetkili mercilere bilgi verilmesi.",
            ],
          },
          {
            heading: "Hukuki sebepler",
            paragraphs: [
              "Kişisel verileriniz KVKK md. 5/2-c (sözleşmenin kurulması ve ifası), md. 5/2-ç (hukuki yükümlülük) ve md. 5/2-f (meşru menfaat) hukuki sebeplerine dayanılarak işlenir. Yurt dışı aktarım dayanağı aşağıda ayrıca belirtilmiştir.",
              "İleride sunulacak ses klonu özelliğinde ses örneği, kişiyi tanımlamaya yönelik işlendiği ölçüde biyometrik (özel nitelikli) veri sayılabilir; bu özellik yalnız KVKK md. 6 kapsamında ayrı açık rızanızla ve ayrı bir aydınlatma metniyle çalışacaktır.",
            ],
          },
          {
            heading: "Toplama yöntemi",
            paragraphs: [
              "Veriler mobil uygulama üzerinden elektronik ortamda, otomatik yollarla toplanır: giriş sırasında Apple/Google'dan, kullanım sırasında doğrudan sizden.",
            ],
          },
          {
            heading: "Aktarım",
            items: [
              "Yurt içi: metin çevirisi için Gao Kaptan (İşNet).",
              "Yurt dışı: yedek metin çevirisi için Google Gemini, OpenAI, Anthropic Claude ve Moonshot Kimi; canlı konuşma çevirisi için Google Gemini Live Translate ve ElevenLabs; giriş için Apple ve Google. Barındırma: [Barındırma sağlayıcısı ve konumu].",
              "Yurt dışı aktarım KVKK md. 9 kapsamında yapılır. Dayanak: [hukuk ekibi belirleyecek — ör. standart sözleşme ve Kurul'a bildirim].",
              "Kanunen yetkili kamu kurum ve kuruluşlarına, talep hâlinde ve mevzuatın gerektirdiği ölçüde.",
            ],
          },
          {
            heading: "KVKK md. 11 kapsamındaki haklarınız",
            paragraphs: ["Veri sorumlusuna başvurarak şu haklarınızı kullanabilirsiniz:"],
            items: [
              "Kişisel verilerinizin işlenip işlenmediğini öğrenme,",
              "İşlenmişse buna ilişkin bilgi talep etme,",
              "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,",
              "Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,",
              "Eksik veya yanlış işlenmişse düzeltilmesini isteme,",
              "KVKK md. 7 şartları çerçevesinde silinmesini veya yok edilmesini isteme,",
              "Düzeltme, silme veya yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme,",
              "Münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonuç çıkmasına itiraz etme,",
              "Kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme.",
            ],
          },
          {
            heading: "Başvuru yolu",
            paragraphs: [
              "Başvurunuzu, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ'e uygun olarak [İletişim e-postası] adresine veya [Adres] adresine yazılı olarak iletebilirsiniz. Başvurunuz en geç 30 gün içinde ücretsiz olarak sonuçlandırılır; işlem ayrıca bir maliyet gerektirirse Kurul'un belirlediği tarife uygulanabilir.",
            ],
          },
        ],
      },
      deletion: {
        navLabel: "Hesap silme",
        metaTitle: "Hesap silme",
        metaDescription:
          "Translate Meet hesabınızı uygulama içinden veya e-postayla nasıl silebileceğiniz ve silme sonrası hangi verilerin kaldırıldığı.",
        title: "Hesap silme",
        intro:
          "Translate Meet hesabınızı ve hesabınıza bağlı verileri istediğiniz an silebilirsiniz. Uygulamayı telefondan kaldırmak hesabı silmez.",
        sections: [
          {
            heading: "Uygulama içinden",
            ordered: true,
            items: [
              "Translate Meet uygulamasını açın ve giriş yapın.",
              "Ayarlar sekmesine gidin.",
              "Hesabı sil seçeneğine dokunun ve onaylayın.",
            ],
          },
          {
            heading: "E-postayla",
            paragraphs: [
              "Uygulamaya erişemiyorsanız, hesabınıza bağlı e-posta adresinden [İletişim e-postası] adresine \"Hesap silme talebi\" konulu bir e-posta gönderin. Hesabın size ait olduğunu doğrulamak için ek bilgi isteyebiliriz. Talebiniz en geç [X gün] içinde sonuçlandırılır.",
            ],
          },
          {
            heading: "Silinen veriler",
            items: [
              "Hesap bilgileriniz (giriş sağlayıcısı kimliği, e-posta, dil tercihi).",
              "Oturum belirteçleri; tüm cihazlardaki oturumlarınız kapanır.",
              "Metin çevirisi geçmişiniz.",
              "Kullanım kayıtlarınız.",
            ],
          },
          {
            heading: "Kalabilecek veriler",
            paragraphs: [
              "Ham ses zaten saklanmadığı için silinecek ses kaydı yoktur. Yasal yükümlülük gereği tutulması gereken kayıtlar (varsa) [Saklama süresi] boyunca saklanır ve sonra silinir. Sağlayıcıların kendi tarafındaki saklama süreleri gizlilik politikasında açıklanır.",
            ],
          },
          {
            heading: "Apple veya Google bağlantısı",
            paragraphs: [
              "Apple veya Google ile giriş yaptıysanız, hesabı sildikten sonra bu hesabın ayarlarından Translate Meet bağlantısını da kaldırabilirsiniz.",
            ],
          },
        ],
      },
    },
  },
  notFound: {
    metaTitle: "Sayfa bulunamadı",
    title: "Bu sayfa bulunamadı",
    body: "Aradığınız adres taşınmış ya da hiç var olmamış olabilir.",
    home: "Ana sayfaya dön",
  },
};

/** Hukuki metin bölümü: paragraflar ve/veya madde listesi (ordered: numaralı adımlar). */
export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  items?: string[];
  ordered?: boolean;
}

/** Sözlüğün şekli: en.ts bu tipe uymak zorunda. */
export type Dictionary = typeof tr;
