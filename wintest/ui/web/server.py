"""Uvicorn server launcher."""

import logging

import uvicorn

from ...config.settings import Settings
from .app import create_app

logger = logging.getLogger(__name__)


def start_server(settings: Settings, host: str = "127.0.0.1", port: int = 8080):
    """Start the uvicorn server with the FastAPI app."""
    app = create_app(settings)
    logger.info("Starting wintest web on http://%s:%d", host, port)
    uvicorn.run(app, host=host, port=port, log_level="info")
