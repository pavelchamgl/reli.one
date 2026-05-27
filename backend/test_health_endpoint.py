"""Tests for GET /health/ — liveness + database connectivity probe."""
from __future__ import annotations

import json
from unittest.mock import patch

import pytest
from django.db import OperationalError
from django.test import Client


@pytest.mark.django_db
def test_health_endpoint_ok_and_minimal_payload():
    client = Client()
    resp = client.get("/health/")
    assert resp.status_code == 200
    data = json.loads(resp.content.decode())
    assert data == {"status": "ok", "db": "ok"}
    # Contract: fixed keys only; no settings, tracebacks or env leakage
    assert set(data.keys()) == {"status", "db"}


@pytest.mark.django_db
@patch(
    "django.db.connection.ensure_connection",
    side_effect=OperationalError("simulated unreachable"),
)
def test_health_endpoint_db_unreachable_returns_503(_mock_ensure):
    client = Client()
    resp = client.get("/health/")
    assert resp.status_code == 503
    data = json.loads(resp.content.decode())
    assert data == {"status": "error", "db": "error"}
