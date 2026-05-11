# Plan: Automated API Testing Framework

## TL;DR
> Build complete automated API testing framework for SafeRoute with pytest, requests, JSON reports, and comprehensive endpoint coverage.

**Deliverables**:
- `tests/conftest.py` - Shared pytest fixtures
- `tests/config.py` - Environment configuration
- `tests/helpers.py` - Reusable utilities (logger, reporter, assertions)
- `tests/auth/test_auth.py` - Auth endpoint tests
- `tests/keys/test_keys.py` - Keys endpoint tests  
- `tests/chat/test_chat.py` - Chat endpoint tests
- `tests/analytics/test_analytics.py` - Analytics tests
- `tests/edge_cases/test_edge_cases.py` - Edge cases & negative tests
- `pytest.ini` - Pytest configuration
- `requirements-test.txt` - Test dependencies

**Estimated Effort**: Medium
**Parallel Execution**: N/A - files created sequentially, tests run after
**Runtime**: Single command: `pytest tests/ -v --json-report`

---

## Context

### Original Request
Build automated API testing framework for SafeRoute (LLM Router) with:
- Organized test files by API category
- Full endpoint coverage (success, failure, edge cases, validation)
- JSON report generation per run
- Reusable fixtures, utilities, logging

### API Endpoints to Test
| Endpoint | Method | Auth Type |
|----------|--------|-----------|
| `/auth/register` | POST | None |
| `/auth/login` | POST | None |
| `/auth/me` | GET | JWT |
| `/keys/create` | POST | JWT |
| `/keys/list` | GET | JWT |
| `/keys/revoke` | POST | JWT |
| `/keys/{key_id}` | DELETE | JWT |
| `/v1/chat/completions` | POST | Virtual Key (lmr-xxx) |
| `/analytics/stats` | GET | JWT |

---

## Work Objectives

### Must Have
- pytest as test runner
- requests for HTTP calls
- pytest-json-report for JSON output
- python-dotenv for env vars
- JSON schema validation
- Logging to file + console
- Reports saved to `reports/` with timestamp: `test_run_YYYYMMDD_HHMMSS.json`

### Must NOT Have
- Hardcoded values (use env vars)
- Print-based debugging
- Incomplete implementations or pseudo-code

---

## Execution Strategy

### Wave 1: Foundation (Files 1-4)
Create base infrastructure before any tests:
- `config.py` - Environment variables
- `helpers.py` - Logger, JsonReporter, request wrapper
- `conftest.py` - Fixtures (api_client, auth_token, virtual_key, cleanup)
- `pytest.ini` - Configuration

### Wave 2: Endpoint Tests (Files 5-9)
Test all endpoints with success + failure cases:
- `test_auth.py` - Register, login, /me
- `test_keys.py` - Create, list, revoke, delete
- `test_chat.py` - Sync, stream, auth failures, malformed bodies
- `test_analytics.py` - Stats endpoint
- `test_edge_cases.py` - Boundary, large payload, invalid methods, malformed JSON

### Wave 3: Integration
- Run all tests with single command
- Verify JSON reports generated correctly

---

## Dependency Matrix
- config.py → none (foundation)
- helpers.py → config.py, logging
- conftest.py → config.py, helpers.py
- test files → conftest.py (fixtures), helpers.py (utils), config.py (BASE_URL)

---

## Verification Strategy
- Run `pytest tests/ -v --tb=short --json-report`
- Verify all tests pass
- Check `reports/` contains timestamped JSON file
- Validate JSON structure has: endpoint, request_payload, response_body, status_code, execution_time, result, error_details