"""Write the API's OpenAPI schema to packages/shared/openapi.json (source of truth for TS clients).

uv run python scripts/export_openapi.py          # write
uv run python scripts/export_openapi.py --check  # CI: fail if the committed schema is stale
"""

import json
import sys as _sys
from pathlib import Path as _Path

_sys.path.insert(0, str(_Path(__file__).resolve().parents[1]))
import sys
from pathlib import Path

from app.config import Settings
from app.main import create_app

OUT = Path(__file__).resolve().parents[3] / "packages" / "shared" / "openapi.json"


def main() -> int:
    app = create_app(Settings(_env_file=None, env="dev", database_url="sqlite://"))
    schema = json.dumps(app.openapi(), indent=2, ensure_ascii=False, sort_keys=True) + "\n"
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text() != schema:
            print("packages/shared/openapi.json is stale: run `uv run python scripts/export_openapi.py`")
            return 1
        print("openapi.json up to date")
        return 0
    OUT.write_text(schema)
    print(f"wrote {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
