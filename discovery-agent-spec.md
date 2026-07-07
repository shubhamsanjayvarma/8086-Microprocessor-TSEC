# Agent Idea Discovery & Validation — Execution Spec

**Purpose:** Find real, evidence-backed problems worth building an agent for. No guessing —
every idea in the final output must trace back to actual complaints found online.

**Runtime assumptions:** This spec assumes an agent runtime with (a) subagent/task-spawning,
(b) web search + browse, (c) KimiWebBridge or equivalent for authenticated-site scraping
(Reddit, private forums, review sites behind login), and (d) filesystem write access to `spec/`.
Run this in Claude Code or similar — not a plain chat session.

**Context rule:** Each milestone is self-contained. On resume, an agent should be able to read
just that milestone's section + its output file and continue, without needing the full thread.

---

## Milestone 0 — Scope Lock (do this first, don't skip)

Before any scraping, lock down scope so subagents aren't improvising queries.

**Output:** `spec/00-scope.md`

Define:
1. **Fields to search** (default list below — edit if you want different fields):
   - Students / EdTech
   - Freelancers & Solopreneurs
   - Developers / DevTools
   - Small Business & Local Commerce
   - Content Creators
   - Personal Productivity / Life-admin
2. **Source tiers per field** — list actual subreddits, forums, review sites (e.g. r/SaaS,
   r/Entrepreneur, r/freelance, IndieHackers, G2/Capterra, HackerNews "Who is hiring / Ask HN
   pain point" threads, niche Discords if accessible).
3. **Auth-gated sources** flagged separately — these route through KimiWebBridge.
4. **Time window** — complaints must be from the **last 6 months** to count as current (reject
   anything older unless it's still being actively echoed).

**Exit criteria:** scope file has a field list, ≥3 sources per field, and auth-gated sources
marked. Don't proceed to Milestone 1 without this — it's the thing that prevents subagents from
each inventing their own search strategy.

---

## Milestone 1 — Parallel Discovery (one subagent per field)

**Input:** `spec/00-scope.md`
**Output:** `spec/raw/<field-name>.md` (one file per field, written by that field's subagent)

For each field, spawn a subagent with this task template:

```
Task: Find recurring real-world complaints in [FIELD] that could plausibly be solved
by an AI agent (not a full SaaS rebuild — think "an agent that does X for me").

Search: [source list for this field from scope file]
Auth-gated sources: use KimiWebBridge.

For each complaint found, capture:
- The problem, in the poster's own words (paraphrase, don't reproduce verbatim >15 words)
- Link + subreddit/site
- Engagement signal (upvotes, comment count, reply agreement — i.e. is this a pile-on
  or a lone rant?)
- Date posted
- Whether the poster mentions paying for a fix, an existing tool they dislike, or a
  workaround they've hacked together

Do NOT rank or filter yet — just collect. Dump everything to spec/raw/<field>.md.
Minimum 15-20 raw complaint entries per field before stopping (some will get cut later).
```

**Exit criteria:** one raw file per field, each with ≥15 entries and a working link per entry.

---

## Milestone 2 — Idea Bank Compilation

**Input:** all `spec/raw/*.md`
**Output:** `spec/01-idea-bank.md`

This is a single agent (not subagents) doing synthesis — merging duplicates across fields is
easier with one pass than parallel writers stepping on each other.

Process:
1. Cluster raw complaints into distinct **problems** (multiple threads often describe the same
   underlying issue — merge them, keep all links as evidence).
2. Drop anything with only 1 supporting thread and no engagement — that's noise, not signal.
3. Score each surviving idea on **Severity** (1-5): how painful is this, judged by language
   intensity + how central it is to the poster's workflow (a blocker vs. a mild annoyance).
4. Rank 5-10 ideas per field by severity.

**Format per field:**

```markdown
## [Field]

| # | Problem | Evidence (links, count) | Severity (1-5) | Agent-solvability note |
|---|---------|--------------------------|-----------------|------------------------|
```

**Exit criteria:** `spec/01-idea-bank.md` has every field from scope, 5-10 ranked ideas each,
every row traceable to ≥2 evidence links.

---

## Milestone 3 — Validation Rubric Definition

**Output:** `spec/02-validation-rubric.md` (small file, write once, reuse in Milestone 4)

Turn the four validation questions into a scored rubric so subagents apply it consistently
instead of each interpreting "is this a real need" differently.

| Parameter | What to check | Score 1 | Score 3 | Score 5 |
|---|---|---|---|---|
| **Complaint Frequency** | # of independent threads/posts on this exact problem | 1-2 threads | 3-5 threads | 6+ threads across sources |
| **Willingness to Pay** | Language signal | Pure venting, no ask | "I wish there was a tool" | Explicitly paying for a worse workaround, or asking "does X exist, I'd pay" |
| **Recency** | Most recent complaint date | >6mo old, no recent echoes | Mixed old + some recent | Active complaints within last 4-6 weeks |
| **Competition/Saturation** | Existing tools solving this | Crowded, many funded competitors | A few weak/incomplete tools | No real solution, or existing tools are widely complained about |

**Weighting (adjust if you disagree):** Frequency 30%, WTP 30%, Recency 20%, Low-saturation 20%.

`Weighted Score = (Freq×0.3 + WTP×0.3 + Recency×0.2 + Saturation×0.2)`

**Exit criteria:** rubric file exists with the table above (or your edited weights) before any
scoring happens — don't let scoring subagents freelance the weights.

---

## Milestone 4 — Parallel Validation Research

**Input:** `spec/01-idea-bank.md` + `spec/02-validation-rubric.md`
**Output:** `spec/raw-validation/<idea-id>.md`

Spawn one subagent per **idea** (not per field this time — ideas are the unit now). Batch
ideas from the same field together if you want fewer subagents (e.g. 3 ideas per subagent).

```
Task: Validate this idea against the rubric in spec/02-validation-rubric.md: [idea + evidence links]

Re-search specifically for:
- More threads on this exact problem (frequency check)
- Any mention of paying / existing paid tools people are unhappy with (WTP check)
- Most recent date this was complained about (recency check)
- Existing competitors — search "[problem] tool" / "[problem] app" / Product Hunt / G2

Score all 4 parameters 1-5 with one-line justification each. Write to
spec/raw-validation/<idea-id>.md
```

**Exit criteria:** every idea from the idea bank has a validation file with 4 scores + justification.

---

## Milestone 5 — Final Ranked Output

**Input:** all `spec/raw-validation/*.md`
**Output:** `spec/03-validated-ideas.md`

Single synthesis agent compiles final ranking.

**Format:**

```markdown
# Validated Idea Ranking

| Rank | Idea | Field | Freq | WTP | Recency | Saturation | Weighted Score | Evidence |
|------|------|-------|------|-----|---------|------------|-----------------|----------|
```

Sort descending by weighted score. Flag top 3-5 as **Recommended** with a short "why this one"
note (2-3 sentences, your own synthesis — not a repeat of the evidence table).

**Exit criteria:** file exists, every idea from the idea bank is present and scored, top
picks have a written rationale, all evidence links still resolve.

---

## Run Order Summary

```
M0 Scope Lock          → spec/00-scope.md
M1 Parallel Discovery   → spec/raw/<field>.md          [subagents, per field]
M2 Idea Bank            → spec/01-idea-bank.md         [single agent, synthesis]
M3 Rubric Definition    → spec/02-validation-rubric.md [single agent, one-time]
M4 Parallel Validation  → spec/raw-validation/<id>.md   [subagents, per idea]
M5 Final Ranking        → spec/03-validated-ideas.md   [single agent, synthesis]
```

Each milestone only depends on the previous milestone's output file, not on prior chat context —
so if a session dies mid-run, resume by pointing the next agent at the last completed file.
