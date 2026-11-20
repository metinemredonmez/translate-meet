"""uvicorn entrypoint: `uvicorn app.asgi:app --port 8001`."""

from app.main import create_app

app = create_app()
