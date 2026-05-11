from __future__ import annotations

import os
from pathlib import Path
import httpx
import pytest
from dotenv import load_dotenv

from tests.config import load_config
from tests.helpers import next_report_dir, should_run_integration


def pytest_configure(config: pytest.Config) -> None:
    load_dotenv(override=False)


def pytest_collection_modifyitems(config: pytest.Config, items: list[pytest.Item]) -> None:
    if should_run_integration():
        return

    skip = pytest.mark.skip(reason="Set RUN_INTEGRATION=1 to run integration tests")
    for item in items:
        if "integration" in item.keywords:
            item.add_marker(skip)


def pytest_addoption(parser: pytest.Parser) -> None:
    parser.addoption(
        "--report-dir",
        action="store",
        default=None,
        help="Directory to write reports into (default: reports/vN)",
    )


@pytest.fixture(scope="session")
def cfg():
    return load_config()


@pytest.fixture(scope="session")
def report_dir(request: pytest.FixtureRequest) -> Path:
    # If caller provided explicit report dir, use it as-is.
    # Otherwise allocate versioned directory reports/vN.
    opt = request.config.getoption("--report-dir")
    env_opt = os.getenv("PYTEST_REPORT_DIR")
    chosen = opt or env_opt
    if chosen:
        out = Path(chosen)
        out.mkdir(parents=True, exist_ok=True)
        return out

    root = Path("reports")
    return next_report_dir(root)


@pytest.fixture(scope="session")
def json_report_path(report_dir: Path) -> Path:
    return report_dir / "pytest-report.json"


@pytest.fixture(scope="session")
async def client(cfg):
    async with httpx.AsyncClient(base_url=cfg.base_url) as c:
        yield c


@pytest.fixture(autouse=True, scope="session")
def _wire_pytest_json_report(json_report_path: Path) -> None:
    # pytest-json-report reads its file path from CLI; we also set env var used by our helper tests.
    os.environ.setdefault("PYTEST_JSON_REPORT_FILE", str(json_report_path))


@pytest.fixture(scope="session")
def jwt_headers(cfg) -> dict[str, str]:
    if not cfg.jwt_token:
        pytest.skip("TEST_JWT not set")
    return {"Authorization": f"Bearer {cfg.jwt_token}"}


@pytest.fixture(scope="session")
def vkey_headers(cfg) -> dict[str, str]:
    if not cfg.virtual_key:
        pytest.skip("TEST_VIRTUAL_KEY not set")
    return {"Authorization": f"Bearer {cfg.virtual_key}"}


@pytest.fixture(scope="session")
def encryption_key(cfg) -> str:
    if not cfg.encryption_key:
        pytest.skip("ENCRYPTION_KEY not set")
    return cfg.encryption_key
