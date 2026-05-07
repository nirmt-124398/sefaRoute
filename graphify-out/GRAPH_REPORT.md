# Graph Report - .  (2026-05-07)

## Corpus Check
- Corpus is ~2,868 words - fits in a single context window. You may not need a graph.

## Summary
- 122 nodes · 133 edges · 24 communities (15 shown, 9 thin omitted)
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Auth CRUD & Keys|Auth CRUD & Keys]]
- [[_COMMUNITY_AuthKeys API Schemas|Auth/Keys API Schemas]]
- [[_COMMUNITY_Routing & Dispatch|Routing & Dispatch]]
- [[_COMMUNITY_Chat Logging Flow|Chat Logging Flow]]
- [[_COMMUNITY_Database Models & Base|Database Models & Base]]
- [[_COMMUNITY_Chat API & Telemetry|Chat API & Telemetry]]
- [[_COMMUNITY_Virtual Key Validation|Virtual Key Validation]]
- [[_COMMUNITY_JWT Auth Endpoints|JWT Auth Endpoints]]
- [[_COMMUNITY_User Auth CRUD|User Auth CRUD]]
- [[_COMMUNITY_Stats Aggregation Rationale|Stats Aggregation Rationale]]
- [[_COMMUNITY_Current User Dependency|Current User Dependency]]
- [[_COMMUNITY_Core Models|Core Models]]
- [[_COMMUNITY_List Keys|List Keys]]
- [[_COMMUNITY_Revoke Keys|Revoke Keys]]
- [[_COMMUNITY_Startup Lifespan|Startup Lifespan]]
- [[_COMMUNITY_Request Logs|Request Logs]]
- [[_COMMUNITY_Health Endpoint|Health Endpoint]]
- [[_COMMUNITY_Daily Analytics|Daily Analytics]]
- [[_COMMUNITY_Auth Me Endpoint|Auth Me Endpoint]]
- [[_COMMUNITY_Telemetry Error Capture|Telemetry Error Capture]]
- [[_COMMUNITY_Render Deployment|Render Deployment]]

## God Nodes (most connected - your core abstractions)
1. `User` - 11 edges
2. `Base` - 5 edges
3. `_log` - 5 edges
4. `get_current_user()` - 4 edges
5. `get_virtual_key()` - 4 edges
6. `get_client()` - 4 edges
7. `create_virtual_key()` - 4 edges
8. `VirtualKey` - 4 edges
9. `RequestLog` - 4 edges
10. `chat_completions` - 4 edges

## Surprising Connections (you probably didn't know these)
- `lifespan()` --calls--> `load_models()`  [INFERRED]
  main.py → core/router.py
- `RegisterRequest` --uses--> `User`  [INFERRED]
  api/v1/auth.py → db/models.py
- `LoginRequest` --uses--> `User`  [INFERRED]
  api/v1/auth.py → db/models.py
- `UserPublic` --uses--> `User`  [INFERRED]
  api/v1/auth.py → db/models.py
- `AuthResponse` --uses--> `User`  [INFERRED]
  api/v1/auth.py → db/models.py

## Hyperedges (group relationships)
- **Authentication Flow** — auth_register, auth_login, auth_me, dependencies_get_current_user, jwt_handler_create_token, jwt_handler_decode_token [INFERRED 0.80]

## Communities (24 total, 9 thin omitted)

### Community 0 - "Auth CRUD & Keys"
Cohesion: 0.14
Nodes (10): get_current_user(), get_virtual_key(), Extracts the Bearer token natively from the Authorization header,     validates, Validates API requests using the lmr-xxx format.     Used ONLY for the /v1/chat/, create_user(), create_virtual_key(), encrypt(), get_key_by_hash() (+2 more)

### Community 1 - "Auth/Keys API Schemas"
Cohesion: 0.24
Nodes (9): BaseModel, User, AuthResponse, LoginRequest, RegisterRequest, UserPublic, KeyCreateRequest, KeyCreateResponse (+1 more)

### Community 2 - "Routing & Dispatch"
Cohesion: 0.16
Nodes (10): dispatch_stream(), dispatch_sync(), get_client(), extract_features(), get_feature_vector(), load_models(), route_prompt(), decrypt() (+2 more)

### Community 3 - "Chat Logging Flow"
Cohesion: 0.15
Nodes (14): _estimate_cost, _log, chat_completions, decrypt, log_request, touch_key, dispatch_stream, dispatch_sync (+6 more)

### Community 4 - "Database Models & Base"
Cohesion: 0.28
Nodes (6): Base, log_request(), Base, RequestLog, VirtualKey, DeclarativeBase

### Community 5 - "Chat API & Telemetry"
Cohesion: 0.4
Nodes (3): capture_request(), _estimate_cost(), _log()

### Community 6 - "Virtual Key Validation"
Cohesion: 0.33
Nodes (6): create_virtual_key, encrypt, get_key_by_hash, hash_key, get_virtual_key, create_key

### Community 7 - "JWT Auth Endpoints"
Cohesion: 0.4
Nodes (4): create_token(), decode_token(), login(), register()

### Community 8 - "User Auth CRUD"
Cohesion: 0.5
Nodes (5): login, register, create_user, get_user_by_email, create_token

### Community 10 - "Stats Aggregation Rationale"
Cohesion: 0.5
Nodes (4): summary, Mock cost-saved calculation, get_stats, Python-side stats aggregation

### Community 11 - "Current User Dependency"
Cohesion: 0.67
Nodes (3): get_user_by_id, get_current_user, decode_token

### Community 12 - "Core Models"
Cohesion: 1.0
Nodes (3): RequestLog, User, VirtualKey

## Knowledge Gaps
- **30 isolated node(s):** `Extracts the Bearer token natively from the Authorization header,     validates`, `Validates API requests using the lmr-xxx format.     Used ONLY for the /v1/chat/`, `lifespan`, `health`, `summary` (+25 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `decrypt()` connect `Routing & Dispatch` to `Auth CRUD & Keys`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `User` connect `Auth/Keys API Schemas` to `Auth CRUD & Keys`, `Database Models & Base`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `User` (e.g. with `RegisterRequest` and `LoginRequest`) actually correct?**
  _`User` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `Base` (e.g. with `User` and `VirtualKey`) actually correct?**
  _`Base` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `get_current_user()` (e.g. with `decode_token()` and `get_user_by_id()`) actually correct?**
  _`get_current_user()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Extracts the Bearer token natively from the Authorization header,     validates`, `Validates API requests using the lmr-xxx format.     Used ONLY for the /v1/chat/`, `lifespan` to the rest of the system?**
  _30 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth CRUD & Keys` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._