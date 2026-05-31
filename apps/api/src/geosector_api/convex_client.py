from __future__ import annotations

from typing import Any

import httpx


class ConvexClient:
    def __init__(self, base_url: str, admin_key: str, timeout_seconds: float = 8.0) -> None:
        self._base_url = base_url.rstrip("/")
        self._admin_key = admin_key
        self._timeout = timeout_seconds

    @property
    def configured(self) -> bool:
        return bool(self._base_url and self._admin_key)

    async def mutation(self, path: str, args: dict[str, Any]) -> Any:
        return await self._call("mutation", path, args)

    async def query(self, path: str, args: dict[str, Any]) -> Any:
        return await self._call("query", path, args)

    async def _call(self, kind: str, path: str, args: dict[str, Any]) -> Any:
        if not self.configured:
            return None

        headers = {"Authorization": f"Bearer {self._admin_key}"}
        payload = {"path": path, "args": args, "format": "json"}

        async with httpx.AsyncClient(timeout=self._timeout, headers=headers) as client:
            response = await client.post(f"{self._base_url}/api/{kind}", json=payload)
            response.raise_for_status()
            data = response.json()

        return data.get("value", data)
