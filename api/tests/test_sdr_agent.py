import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.agents import sdr


def test_anthropic_error_is_propagated_without_real_call(monkeypatch):
    fake_messages = SimpleNamespace(create=AsyncMock(side_effect=RuntimeError("anthropic_down")))
    monkeypatch.setattr(sdr, "AsyncAnthropic", lambda **_: SimpleNamespace(messages=fake_messages))
    monkeypatch.setattr(sdr, "get_settings", lambda: SimpleNamespace(anthropic_api_key="fake", sdr_model="fake", sdr_max_tool_cycles=2, sdr_max_output_tokens=100))
    with pytest.raises(RuntimeError, match="anthropic_down"):
        asyncio.run(sdr.run_sdr_chat(AsyncMock(), user_message="teste"))
    fake_messages.create.assert_awaited_once()
