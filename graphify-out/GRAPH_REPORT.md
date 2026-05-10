# Graph Report - sefaRoute  (2026-05-08)

## Corpus Check
- 17 files · ~3,006 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 126 nodes · 138 edges · 25 communities (16 shown, 9 thin omitted)
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1ac6e4f7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]

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
- `get_client()` --calls--> `decrypt()`  [INFERRED]
  core/dispatcher.py → db/crud.py
- `lifespan()` --calls--> `load_models()`  [INFERRED]
  main.py → core/router.py
- `RegisterRequest` --uses--> `User`  [INFERRED]
  api/v1/auth.py → db/models.py
- `LoginRequest` --uses--> `User`  [INFERRED]
  api/v1/auth.py → db/models.py
- `UserPublic` --uses--> `User`  [INFERRED]
  api/v1/auth.py → db/models.py

## Hyperedges (group relationships)
- **Authentication Flow** — auth_register, auth_login, auth_me, dependencies_get_current_user, jwt_handler_create_token, jwt_handler_decode_token [INFERRED 0.80]

## Communities (25 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.15
Nodes (9): get_virtual_key(), Validates API requests using the lmr-xxx format.     Used ONLY for the /v1/chat/, create_user(), create_virtual_key(), decrypt(), encrypt(), get_fernet(), get_key_by_hash() (+1 more)

### Community 1 - "Community 1"
Cohesion: 0.22
Nodes (9): BaseModel, User, AuthResponse, LoginRequest, RegisterRequest, UserPublic, KeyCreateRequest, KeyCreateResponse (+1 more)

### Community 2 - "Community 2"
Cohesion: 0.18
Nodes (9): dispatch_stream(), dispatch_sync(), get_client(), extract_features(), get_feature_vector(), load_models(), route_prompt(), lifespan() (+1 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (14): _estimate_cost, _log, chat_completions, decrypt, log_request, touch_key, dispatch_stream, dispatch_sync (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.22
Nodes (7): get_current_user(), Extracts the Bearer token natively from the Authorization header,     validates, create_token(), decode_token(), get_user_by_id(), login(), register()

### Community 5 - "Community 5"
Cohesion: 0.28
Nodes (6): Base, log_request(), Base, RequestLog, VirtualKey, DeclarativeBase

### Community 6 - "Community 6"
Cohesion: 0.4
Nodes (3): capture_request(), _estimate_cost(), _log()

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (6): create_virtual_key, encrypt, get_key_by_hash, hash_key, get_virtual_key, create_key

### Community 8 - "Community 8"
Cohesion: 0.5
Nodes (5): login, register, create_user, get_user_by_email, create_token

### Community 10 - "Community 10"
Cohesion: 0.5
Nodes (4): summary, Mock cost-saved calculation, get_stats, Python-side stats aggregation

### Community 11 - "Community 11"
Cohesion: 0.67
Nodes (3): get_user_by_id, get_current_user, decode_token

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (3): RequestLog, User, VirtualKey

## Knowledge Gaps
- **30 isolated node(s):** `Extracts the Bearer token natively from the Authorization header,     validates`, `Validates API requests using the lmr-xxx format.     Used ONLY for the /v1/chat/`, `lifespan`, `health`, `summary` (+25 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `decrypt()` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `User` connect `Community 1` to `Community 0`, `Community 5`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `get_client()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `User` (e.g. with `RegisterRequest` and `LoginRequest`) actually correct?**
  _`User` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `Base` (e.g. with `User` and `VirtualKey`) actually correct?**
  _`Base` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `get_current_user()` (e.g. with `decode_token()` and `get_user_by_id()`) actually correct?**
  _`get_current_user()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Extracts the Bearer token natively from the Authorization header,     validates`, `Validates API requests using the lmr-xxx format.     Used ONLY for the /v1/chat/`, `lifespan` to the rest of the system?**
  _30 weakly-connected nodes found - possible documentation gaps or missing edges._