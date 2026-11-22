"""API anahtarlarını sırayla sorar, doğru .env dosyalarına yazar ve her birini ücretsiz bir
"model listesi" çağrısıyla dener.

Çalıştırma (repo kökünden):
    uv run --project apps/api python scripts/anahtar_ekle.py

- Yazdığın/yapıştırdığın anahtar ekranda görünmez; Enter'a bas.
- Boş bırakıp Enter'a basarsan o anahtar atlanır (dosyadaki eski değer korunur).
- Anahtarlar yalnız apps/api/.env ve apps/gateway/.env dosyalarına yazılır (git'e girmez, izin 600).
- Ekrana hiçbir anahtar basılmaz; yalnız ilk 4 karakteri gösterilir.
"""

import getpass
import os
import sys
from pathlib import Path

import anthropic
import httpx

ROOT = Path(__file__).resolve().parent.parent
API_ENV = ROOT / "apps" / "api" / ".env"
GATEWAY_ENV = ROOT / "apps" / "gateway" / ".env"
TIMEOUT = 15.0

# (görünen ad, nereden alınır, env değişkeni, yazılacak dosyalar)
KEYS = [
    ("Kaptan", "https://kaptan.isnet.net.tr  →  LLM → Anahtarlar", "TM_KAPTAN_API_KEY", [API_ENV]),
    ("Gemini", "https://aistudio.google.com/apikey", "TM_GEMINI_API_KEY", [API_ENV, GATEWAY_ENV]),
    ("Soniox", "https://console.soniox.com", "TM_SONIOX_API_KEY", [GATEWAY_ENV]),
    ("OpenAI", "https://platform.openai.com/api-keys", "TM_OPENAI_API_KEY", [API_ENV]),
    ("Claude", "https://platform.claude.com/settings/keys", "TM_ANTHROPIC_API_KEY", [API_ENV]),
    ("Kimi", "https://platform.kimi.ai/console/api-keys", "TM_KIMI_API_KEY", [API_ENV]),
]

DEFAULTS = {
    API_ENV: {"TM_TRANSLATOR_PROVIDER": "chain"},
    GATEWAY_ENV: {"TM_SONIOX_TTS_VOICE": "Maya"},
}


def mask(value: str) -> str:
    return f"{value[:4]}…({len(value)} karakter)" if value else "—"


def read_env(path: Path) -> list[str]:
    return path.read_text().splitlines() if path.exists() else []


def set_env(path: Path, name: str, value: str) -> None:
    lines = read_env(path)
    for i, line in enumerate(lines):
        if line.split("=", 1)[0].strip() == name:
            lines[i] = f"{name}={value}"
            break
    else:
        lines.append(f"{name}={value}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n")
    os.chmod(path, 0o600)


def get_env(path: Path, name: str) -> str:
    for line in read_env(path):
        key, _, value = line.partition("=")
        if key.strip() == name:
            return value.strip()
    return ""


# ---------------------------------------------------------------- doğrulama (yalnız ücretsiz liste çağrıları)

def _ids(res: httpx.Response, field: str = "id") -> list[str]:
    data = res.json()
    items = data.get("data") or data.get("models") or []
    return [str(m.get(field) or m.get("name") or "") for m in items]


def check(name: str, key: str) -> str:
    try:
        if name == "Kaptan":
            r = httpx.get(
                "https://kaptan.isnet.net.tr/api/v1/inference/v1/models",
                headers={"Authorization": f"Bearer {key}"},
                timeout=TIMEOUT,
            )
            return _verdict(r, _ids(r) if r.status_code == 200 else [], "Qwen/Qwen3.6-35B-A3B-FP8")
        if name == "Gemini":
            r = httpx.get(
                "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000",
                headers={"x-goog-api-key": key},  # anahtar URL'de değil, başlıkta
                timeout=TIMEOUT,
            )
            if r.status_code == 400:  # Gemini answers an invalid key with 400 INVALID_ARGUMENT
                return "❌ anahtar geçersiz (400)"
            ids = [i.removeprefix("models/") for i in _ids(r, "name")] if r.status_code == 200 else []
            return _verdict(r, ids, "gemini-3.5-live-translate-preview", "gemini-3.8-flash")
        if name == "Soniox":
            r = httpx.get(
                "https://api.soniox.com/v1/models", headers={"Authorization": f"Bearer {key}"}, timeout=TIMEOUT
            )
            return _verdict(r, _ids(r) if r.status_code == 200 else [], "stt-rt-v6")
        if name == "OpenAI":
            r = httpx.get(
                "https://api.openai.com/v1/models", headers={"Authorization": f"Bearer {key}"}, timeout=TIMEOUT
            )
            return _verdict(r, _ids(r) if r.status_code == 200 else [], "gpt-5-mini")
        if name == "Kimi":
            r = httpx.get(
                "https://api.moonshot.ai/v1/models", headers={"Authorization": f"Bearer {key}"}, timeout=TIMEOUT
            )
            return _verdict(r, _ids(r) if r.status_code == 200 else [], "kimi-k3")
        if name == "Claude":
            client = anthropic.Anthropic(api_key=key, timeout=TIMEOUT, max_retries=0)
            try:
                ids = [m.id for m in client.models.list(limit=100)]
            except anthropic.AuthenticationError:
                return "❌ anahtar geçersiz (401)"
            except anthropic.PermissionDeniedError:
                return "❌ yetki yok (403)"
            except anthropic.APIStatusError as exc:
                return f"⚠️  doğrulanamadı (HTTP {exc.status_code})"
            return _expect(ids, "claude-opus-5-5")
    except httpx.HTTPError:
        return "⚠️  bağlanılamadı (ağ hatası)"
    return "?"


def _verdict(res: httpx.Response, ids: list[str], *expected: str) -> str:
    if res.status_code in (401, 403):
        return f"❌ anahtar geçersiz ya da yetkisiz ({res.status_code})"
    if res.status_code == 402:
        return "❌ bakiye/ödeme sorunu (402)"
    if res.status_code != 200:
        return f"⚠️  doğrulanamadı (HTTP {res.status_code})"
    return _expect(ids, *expected)


def _expect(ids: list[str], *expected: str) -> str:
    missing = [m for m in expected if m not in ids]
    if not missing:
        return f"✅ geçerli ({', '.join(expected)} erişilebilir)"
    return f"✅ geçerli, ⚠️  model listede yok: {', '.join(missing)} (ayardan değiştirilebilir)"


def main() -> None:
    print("\ntranslate-meet anahtar kurulumu")
    print("Yapıştırdığın anahtar ekranda GÖRÜNMEZ, sonra Enter'a bas. Boş Enter = atla.\n")
    for path, defaults in DEFAULTS.items():
        for name, value in defaults.items():
            if not get_env(path, name):
                set_env(path, name, value)

    for i, (name, where, env_name, files) in enumerate(KEYS, 1):
        current = get_env(files[0], env_name)
        print(f"[{i}/{len(KEYS)}] {name}")
        print(f"      Nereden: {where}")
        if current:
            print(f"      Kayıtlı: {mask(current)} (boş Enter = aynen kalsın)")
        try:
            value = getpass.getpass("      Anahtar: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nİptal edildi; o ana kadar girilenler kaydedildi.")
            sys.exit(1)
        if value:
            for path in files:
                set_env(path, env_name, value)
            rel = ", ".join(str(p.relative_to(ROOT)) for p in files)
            print(f"      Kaydedildi → {rel}  [{mask(value)}]")
        else:
            print("      Atlandı.")
        print()

    print("Doğrulama (yalnız ücretsiz model listesi çağrıları):")
    for name, _, env_name, files in KEYS:
        key = get_env(files[0], env_name)
        status = check(name, key) if key else "— girilmedi"
        print(f"  {name:<7} {status}")
    print("\nBitti. Anahtarlar git'e girmez. Claude'a 'ekledim' yazman yeterli.\n")


if __name__ == "__main__":
    main()
