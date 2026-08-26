# DecisionScope CA1

## Project Goal
DecisionScope helps evaluate proposed policy changes using a multi-step AI agent. It acts as an intelligent evaluator by gathering supporting evidence, simulating stakeholder impact, identifying risks, and recommending whether the proposal should be accepted, modified, or rejected.

## Tools
Tool 1: `searchPolicyEvidence()`
Searches a historical vector database (or fallback generator) to find precedent or data related to the proposed policy change.

Tool 2: `simulateStakeholderImpact()`
Analyzes the proposed action and evidence to simulate numerical impact scores for key stakeholder groups (e.g., Students, Faculty).

Optional Tool 3: `critiquePolicy()`
Examines the stakeholder impacts to identify potential risks and suggests alternative mitigation strategies.

## Memory
The agent maintains conversational memory, remembering previous decisions, contexts, and proposals within the same session. When evaluating later changes, it uses this stored context (e.g., remembering a prior proposed penalty) to provide a historically informed recommendation.

## Agent Loop
PLAN → ACT (Tool) → OBSERVE (Tool Result) → RE-PLAN → ACT → FINAL

## Honest Failure
The `searchPolicyEvidence()` tool honestly reports its status. If the live Qdrant retrieval database is unconfigured or unavailable, the tool falls back to generating mock evidence points via the LLM or hardcoded defaults. When doing so, it explicitly marks the result with `usedFallback: true` in the output trace, rather than falsely presenting mock data as real retrieval.
