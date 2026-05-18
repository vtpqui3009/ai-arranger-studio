from __future__ import annotations

import logging
import os
from collections.abc import Mapping
from typing import Any

logger = logging.getLogger("ai_arranger.monitoring")


def initialize_error_monitoring() -> None:
    dsn = os.getenv("ERROR_MONITORING_DSN", "").strip()
    if not dsn:
        return

    logger.info("Error monitoring placeholder initialized.")


def capture_exception(error: BaseException, context: Mapping[str, Any] | None = None) -> None:
    if not os.getenv("ERROR_MONITORING_DSN", "").strip():
        return

    logger.exception(
        "Captured exception for future monitoring integration: %s",
        error,
        extra={"monitoring_context": dict(context or {})},
    )
