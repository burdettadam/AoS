# BotC Digital – Architecture & Scoring Spec

> A platform-agnostic, AI-assisted implementation of _Blood on the Clocktower_ (BotC) with an authoritative rules engine, nightly fairness scoring, and LLM-driven character dialogue.

---

## 0) Goals & Principles

- **Authoritative fairness**: Server owns hidden info, timing, RNG. LLMs interact only through tools.
- **Playable anywhere**: Web-first PWA; wrap for iOS/Android (Capacitor/Flutter) and desktop (Tauri/Electron).
- **Great table talk**: Low-latency voice (WebRTC SFU) + optional AI Storyteller.
- **Replayable & auditable**: Event-sourced core; deterministic seeds.
- **Moddable**: Script DSL compiles into abilities, night order, visibility rules.
- **Nightly guidance**: Built-in metrics (Info–Control–Time) to help a Storyteller judge state each night.

---

## 1) High-Level Architecture

```
Clients (one UI codebase)
  Web PWA (React/Flutter) • Mobile wrappers (Capacitor/Flutter) • Desktop (Tauri/Electron)
   └── WebSocket (state) • WebRTC (voice)

Realtime Gateway (WS)  ⇆  Voice SFU/Mixer (WebRTC)
        │ Pub/Sub
        ▼
Core Backend
  1) Matchmaking/Lobby (Redis)
  2) Game Orchestrator (authoritative FSM)
  3) Rules Engine + Script DSL compiler
  4) Night/Day Scheduler (timed actions, precedence)
  5) Event Store (Kafka/NSQ) → Replays & analytics
  6) State DB (Postgres)

LLM Orchestrator Layer
  - Prompt Router & Budgeting
  - NPC Seat Agents (one per seat)
  - Optional AI Storyteller/Narrator
  - Content Guardrails/Redaction
  - Tool Gateways (strict schemas)

Supporting Data
  - S3-compatible storage (assets, replays, prompt packs)
  - Neo4j (script dependency & scoring graphs)
  - Vector DB (pgvector/Weaviate) for seat-local memory & lore

Scoring/Analytics Service
  - Nightly fairness metrics (Info/Control/Time)
  - Outcome odds (Monte Carlo)
  - Telemetry dashboards
```

**Core Tech Choices (suggested)**

- UI: React + Vite + Tailwind; or Flutter for single codebase including mobile.
- Realtime: WebSockets via Fastify/Node or Go; WebRTC SFU (mediasoup/janus).
- Backend: TypeScript (NestJS/Fastify) or Go; gRPC/HTTP for internal calls.
- DBs: Postgres + Redis; Kafka/NSQ; Neo4j; S3 (MinIO); Vector DB (pgvector).
- LLM: Provider-agnostic; tool calling via JSON schema; small local model for filler + larger model for reasoning.

---

## 2) Game Engine (Authoritative Core)

### 2.1 Finite State Machine (per match)

States: `Lobby → Night → Day → Nomination → Vote → Execution → End`.

- **Night**: iterate according to compiled `night_order`, invoking ability handlers.
- **Day**: table talk window; track nominations and votes; apply execution effects.
- **End**: victory check (parity, demon death with no backups, special win conditions).

### 2.2 Script DSL (declarative)

Minimal example (YAML/JSON):

```yaml
role: Poisoner
alignment: evil
when: night
ability:
  id: poison
  target: seat!=self & alive
  effect:
    - add_status: { seat: $target, status: poisoned, nights: 1 }
visibility:
  reveals:
    public: none
    private_to: []
precedence: 40 # lower = earlier in night
```

Compiler outputs:

- **Action graph**: ordered abilities with preconditions.
- **Handlers**: pure functions `effect(ctx, actor, targets) -> Patch[]`.
- **Visibility transforms**: how states affect registration (e.g., register-as, drunk/poison filters).

### 2.3 Data Model (authoritative)

- `Game`: id, seed, script_id, created_at.
- `Seat`: seat_id, player_id|NPC, alignment (hidden), role (hidden), statuses.
- `Ability`: ability_id, actor_seat, targets\[], timing, remaining_uses.
- `Patch`: atomic state modification with provenance (who/when/why).
- `Event`: append-only log (player_joined, ability_performed, vote_cast, etc.).

### 2.4 Randomness & Replays

- All stochastic choices use a **seeded RNG** (per game). Record RNG cursor in events → full determinism for replay.

---

## 3) LLM Agent Layer

### 3.1 Agent Types

- **NPC Seat Agent (per seat)**: bluffs, reasons, talks, picks targets _via tools_.
- **AI Storyteller** (optional): narrates, nudges pacing; has no secret reads.

### 3.2 Least-Privilege Tooling (schemas)

**All outputs are JSON**: `{ action, args, utterance }`.

- `GameState.read(mask)` → returns only information that this seat could legitimately know: public events, self state, whispers they participated in.
- `NightAction.perform(ability_id, targets[])` → server validates via Rules Engine; returns confirmations limited by visibility rules.
- `Vote.cast({nominee, vote})` → authoritative tallying.
- `Talk.send({channel, text|emotion})` → table/whisper output (moderated, redacted).
- `Lore.search(tags[])` → retrieve flavor/lore snippets for roleplay; never leaks state.

### 3.3 Guardrails & Policy

- **No secrets in prompts**; secrets are never surfaced by tools.
- **Redaction** on agent utterances (regex + semantic) to block hidden info leaks.
- **Heuristics** gate play (e.g., don’t hard-claim without X signals; prefer protecting confirmed info roles).
- **Budgeting**: per-turn token ceilings; cache stable persona context.

### 3.4 Seat Memory

- Short rolling context of public chat and personal actions.
- Nightly summarization to embeddings; retrieval for consistent characterization.

---

## 4) Platform & Networking

- **Web-first PWA** with offline assets, push notifications (where supported).
- **Mobile** via Capacitor (JS bridge to native WebRTC/Audio) or Flutter (single codebase).
- **Desktop** via Tauri (Rust shell, low footprint).
- **Voice**: WebRTC SFU; push-to-talk; NPC TTS; optional ASR to enrich NPC reactivity.

---

## 5) Scoring: Nightly Fairness & Difficulty

We score actual game state **each night** using the **ICT model**: Information, Control, Time. Metrics drive a small meter (–100 evil → +100 good) and help a Storyteller decide whether the game is balanced.

### 5.1 Definitions

- **Information Gain (IG, 0–100)**: expected reliability & independence of new truths acquired by Good this day.
- **Control Balance (CB, centered at 50)**: net influence of impactful actions (kills, poison, save, protect, register-as, madness), adjusted by who was hit and night order (preemption).
- **Time Cushion (TC, 0–100)**: safety margin before parity vs. days required to uniquely identify the demon/team.
- **Redundancy & Robustness (RR, 0–100)**: count of **disjoint** confirmation paths for Good minus disjoint persistence/misinfo paths for Evil.
- **Volatility (V, 0–100)**: swinginess; presence of keystone roles whose loss flips state.

### 5.2 Graph Substrate (Neo4j)

Nodes: `Role (R)`, `Ability (A)`, `Fact (F)`, `State (S)`, `Seat (P)`.
Edges: `R-HAS→A`, `A-PRODUCES→F`, `A-ALTERS→S`, `A-DISTORTS→F`, `A-TARGETS→(P|R|F|S)`, `S-SUPPRESSES→A`, `A-COUNTERS→A`, `P-HOLDS→R`.

- Weight edges by reliability given current statuses (poison/drunk), and by **night order**.

### 5.3 Nightly Computation (Algorithm)

**Inputs:** current state snapshot, event diff for the day/night, script graph.

1. **IG**
   - For each information-producing edge `A→F` actually triggered this cycle, compute `truth_prob` after modifiers (poison/drunk/register-as, precedence).
   - Compute independence: downweight results sharing failure modes (same target, same status vulnerability).
   - `IG = scale_0_100(sum(truth_prob * info_value))` where `info_value` per role is pre-tuned (e.g., Undertaker=3, Empath=2, FortuneTeller=1.5).

2. **CB**
   - Start `evil = nightly_kills + Σ(disruptors weighted)`.
   - Start `good = protections + revives + blocks + public-clears`.
   - Apply **impact**: +2 if a central info role dies; –1 if low-impact seat is hit.
   - Preemption: if disruptor acts **before** a sensor, ×1.2; if after, ×0.8.
   - `CB_raw = good - evil`; map to 0–100 with 50 as neutral: `CB = clamp(50 + k * CB_raw, 0, 100)`.

3. **TC**
   - `days_to_parity ≈ ceil((GoodAlive - EvilAlive) / max(0.1, net_kills_per_night))`.
   - `days_to_unique_id` via path search: shortest day index when ≥2 independent confirmations target the true demon/team with confidence ≥90%.
   - `TC = scale_0_100(days_to_parity - days_to_unique_id)` (each extra safe day ≈ +20).

4. **RR**
   - In Neo4j, count **vertex-disjoint** confirmation paths `Good` to `DemonIdentified` by Day 3/4 under current statuses; subtract scaled count of disjoint misinfo/persistence paths for Evil.
   - Map to 0–100 with ≥3 disjoint Good paths → \~100.

5. **V**
   - Count keystone nodes whose removal changes IG or CB by ≥20 points; penalize if no backups.

6. **Composite Nightly Momentum**

   ```
   momentum = 0.35*(IG-50) + 0.25*(CB-50) + 0.20*(TC-50) + 0.15*(RR-50) - 0.05*V
   # range roughly [-100, +100]
   ```

7. **Static Setup Difficulty (pre-game)**

   ```
   difficulty = 0.35*(100-IG₀) + 0.25*(50-CB₀) + 0.20*(100-TC₀) + 0.15*(100-RR₀) + 0.05*V₀
   # computed from script only (expected case, not live state)
   ```

### 5.4 Storyteller Dashboard

Show: momentum meter, TC days, top contributors (+/–): who died, which info stuck, where poison landed, which confirmations emerged. Include a tiny “why” list from edges with largest absolute contributions.

---

## 6) Outcome Odds Estimation

We estimate Good/Evil win odds **live** using lightweight Monte Carlo atop the authoritative simulator.

### 6.1 Agent Policies (non-LLM)

For simulation only, use simple heuristic bots:

- **Evil**: prioritize killing/poisoning info roles; avoid creating hard confirms; protect demon.
- **Good**: preserve info roles; nominate when posterior odds vs. demon exceed threshold; cross-check claims.

### 6.2 Simulation Loop

```
for r in 1..N_runs (e.g., 1000):
  clone current state (including statuses, known claims)
  while not terminal and day < cap:
    run night with heuristic targets
    run day with heuristic votes/nominees
  record winner
odds_good = wins_good / N_runs
```

Optimizations: importance sampling on target selections; early stop if parity imminent; parallel runs.

### 6.3 Conditioning with Live Metrics

- Adjust heuristic priors using IG/CB/TC (e.g., if CB strongly evil, bias toward info-role targeting).
- Use observed claims to restrict plausible demon/minion distributions during simulation.

---

## 7) Data & Services

- **Postgres**: accounts, cosmetics, purchases, matches, leaderboards.
- **Redis**: presence, lobby queues, rate-limit tokens.
- **Event Store**: Kafka/NSQ topics `match-events`, `voice-events`, `analytics`.
- **Neo4j**: script graph + live state overlays (statuses edge weights) → scoring queries.
- **Object Storage (S3/MinIO)**: replays, voice cache, prompt packs, script packs.
- **Vector DB**: seat memories & lore chunks (strictly flavor).

---

## 8) Security, Fairness, Anti-Cheat

- **No secrets in LLM prompts**; all seat knowledge flows via redacted `GameState.read`.
- **Tool-only mutation**: agents cannot change state without `NightAction.perform`/`Vote.cast` validations.
- **Determinism**: seeded RNG; record RNG cursor in events.
- **Moderation**: on user text/voice + agent utterances; allow Storyteller hard mute & vote-lock tools.
- **Spectator**: delayed stream; can’t whisper; no secret overlays.

---

## 9) APIs & Schemas (sketch)

### 9.1 Client ↔ Gateway (WS)

```ts
// subscribe
{ type: "subscribe", gameId }
// inbound events (append-only)
{ type: "event", event: { id, kind, ts, payload } }
// commands
{ type: "cmd", cmd: { kind: "nominate"|"vote"|"chat"|"ability", payload } }
```

### 9.2 LLM Tool Contracts

```ts
// GameState.read
input: { mask: "seat|public|narrator", includeChat?: boolean }
output: { publicEvents: Event[], mySeat?: SeatView, claims: Claim[], timers }

// NightAction.perform
input: { abilityId: string, targets: string[] }
output: { ok: boolean, reveals: Reveal[], errors?: string[] }

// Vote.cast
input: { nominee: SeatId, vote: boolean }
output: { accepted: boolean }

// Talk.send
input: { channel: "table"|"whisper", text?: string, emotion?: string }
output: { delivered: boolean }
```

---

## 10) Development Roadmap

**M0**: Core FSM + Rules Engine (Trouble Brewing subset), WS client, text table talk, basic nightly meter.

**M1**: Full TB, replays, SFU voice, NPC seat agents (2–3), Storyteller dashboard.

**M2**: Script DSL editor, Neo4j graphs, Monte Carlo odds, mobile/desktop wrappers.

**M3**: Sects & Violets / Bad Moon Rising support; mod SDK; leagues; cosmetics.

---

## 11) Glossary (quick)

- **IG/CB/TC/RR/V**: Scoring components (Information, Control, Time, Redundancy/Robustness, Volatility).
- **Momentum**: nightly composite meter (–100 evil to +100 good).
- **Keystone**: role whose loss changes IG or CB by ≥20.
- **Register-as**: visibility transform causing false registration to sensors.

---

## 12) Appendix: Cypher Sketches

**Disjoint confirmation paths by Day 3**

```cypher
// conceptual sketch; assumes day properties on edges
MATCH p = allSimplePaths((d:Demon)-[:PRODUCES|TARGETS*..4]->(f:Fact {name:"Demon=SeatX"}))
WHERE maxEdge(p).day <= 3 AND pathReliability(p) >= 0.9
WITH collect(p) AS paths
RETURN maxVertexDisjoint(paths) AS good_paths;
```

**Misinformation pressure**

```cypher
MATCH (a:Ability)-[:DISTORTS]->(f:Fact)
WHERE a.enabled = true AND a.window IN ["N1","N2","N3"]
RETURN sum(a.weight) AS mp;
```

---

### Use This Document

- Keep it in `/docs/architecture/botc_digital.md`.
- Treat weights and mappings as **tunable** for your group; capture actual games to calibrate.
- Extend the DSL gradually; prefer pure, testable handlers.
