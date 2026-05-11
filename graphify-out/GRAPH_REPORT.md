# Graph Report - sefaRoute  (2026-05-10)

## Corpus Check
- 18 files · ~3,772 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 156 nodes · 206 edges · 31 communities (22 shown, 9 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dc4451ca`
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
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]

## God Nodes (most connected - your core abstractions)
1. `User` - 12 edges
2. `AI Ad Match — System Workflow` - 7 edges
3. `Base` - 6 edges
4. `get_current_user()` - 5 edges
5. `get_virtual_key()` - 5 edges
6. `get_client()` - 5 edges
7. `create_virtual_key()` - 5 edges
8. `VirtualKey` - 5 edges
9. `RequestLog` - 5 edges
10. `_log` - 5 edges

## Surprising Connections (you probably didn't know these)
- `_log` --calls--> `log_request`  [EXTRACTED]
  api/v1/chat.py → db/crud.py
- `_log` --calls--> `touch_key`  [EXTRACTED]
  api/v1/chat.py → db/crud.py
- `_log` --calls--> `capture_request`  [EXTRACTED]
  api/v1/chat.py → services/telemetry.py
- `RegisterRequest` --uses--> `User`  [INFERRED]
  /home/nirmit/Desktop/SafeRoute/sefaRoute/api/v1/auth.py → /home/nirmit/Desktop/SafeRoute/sefaRoute/db/models.py
- `LoginRequest` --uses--> `User`  [INFERRED]
  /home/nirmit/Desktop/SafeRoute/sefaRoute/api/v1/auth.py → /home/nirmit/Desktop/SafeRoute/sefaRoute/db/models.py

## Hyperedges (group relationships)
- **Authentication Flow** — auth_register, auth_login, auth_me, dependencies_get_current_user, jwt_handler_create_token, jwt_handler_decode_token [INFERRED 0.80]

## Communities (31 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.24
Nodes (16): create_user(), create_virtual_key(), decrypt(), delete_key(), encrypt(), get_fernet(), get_key_by_hash(), get_request_logs() (+8 more)

### Community 1 - "Community 1"
Cohesion: 0.24
Nodes (11): create_token(), decode_token(), BaseModel, AuthResponse, login(), LoginRequest, me(), register() (+3 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (14): _estimate_cost, _log, chat_completions, decrypt, log_request, touch_key, dispatch_stream, dispatch_sync (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (12): AI Ad Match — System Workflow, AI Model Details, code:mermaid (graph TD), code:mermaid (flowchart TD), code:mermaid (flowchart LR), Data Structures, Detailed Step-by-Step Pipeline, Error Handling Paths (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.23
Nodes (6): extract_features(), get_feature_vector(), load_models(), route_prompt(), health(), lifespan()

### Community 5 - "Community 5"
Cohesion: 0.31
Nodes (7): Base, Base, get_db(), RequestLog, User, VirtualKey, DeclarativeBase

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (5): capture_error(), capture_request(), chat_completions(), _estimate_cost(), _log()

### Community 7 - "Community 7"
Cohesion: 0.43
Nodes (6): create_key(), delete_key(), KeyCreateResponse, KeyRevokeRequest, list_keys(), revoke_key()

### Community 8 - "Community 8"
Cohesion: 0.4
Nodes (4): get_current_user(), get_virtual_key(), Extracts the Bearer token natively from the Authorization header,     validates, Validates API requests using the lmr-xxx format.     Used ONLY for the /v1/chat/

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (6): create_virtual_key, encrypt, get_key_by_hash, hash_key, get_virtual_key, create_key

### Community 10 - "Community 10"
Cohesion: 0.6
Nodes (3): daily(), requests(), summary()

### Community 11 - "Community 11"
Cohesion: 0.8
Nodes (3): dispatch_stream(), dispatch_sync(), get_client()

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (5): login, register, create_user, get_user_by_email, create_token

### Community 13 - "Community 13"
Cohesion: 0.5
Nodes (4): summary, Mock cost-saved calculation, get_stats, Python-side stats aggregation

### Community 14 - "Community 14"
Cohesion: 0.67
Nodes (3): get_user_by_id, get_current_user, decode_token

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (3): RequestLog, User, VirtualKey

## Knowledge Gaps
- **37 isolated node(s):** `Extracts the Bearer token natively from the Authorization header,     validates`, `Validates API requests using the lmr-xxx format.     Used ONLY for the /v1/chat/`, `code:mermaid (graph TD)`, `code:mermaid (flowchart TD)`, `Request Payload (`POST /api/personalize`)` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `decrypt()` connect `Community 0` to `Community 11`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `get_client()` connect `Community 11` to `Community 0`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `chat_completions()` connect `Community 6` to `Community 11`, `Community 4`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `User` (e.g. with `create_user()` and `RegisterRequest`) actually correct?**
  _`User` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `Base` (e.g. with `User` and `VirtualKey`) actually correct?**
  _`Base` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `get_current_user()` (e.g. with `decode_token()` and `get_user_by_id()`) actually correct?**
  _`get_current_user()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Extracts the Bearer token natively from the Authorization header,     validates`, `Validates API requests using the lmr-xxx format.     Used ONLY for the /v1/chat/`, `code:mermaid (graph TD)` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._