from __future__ import annotations

from geosector_api.sources.base import SourceConnector


class SourceRegistry:
    def __init__(self, connectors: list[SourceConnector]) -> None:
        self._connectors = {connector.name: connector for connector in connectors}

    def get(self, name: str) -> SourceConnector:
        if name not in self._connectors:
            raise KeyError(f"Source connector not registered: {name}")
        return self._connectors[name]

    def names(self) -> list[str]:
        return sorted(self._connectors)
