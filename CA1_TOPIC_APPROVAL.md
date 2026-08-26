# CA1 Custom Topic Approval

**Project:** DecisionScope

**Goal:**
"Help users evaluate proposed policy changes by gathering supporting evidence, simulating stakeholder impact, identifying risks, and recommending whether the proposal should be accepted, modified, or rejected."

**Tools:**
1. `searchPolicyEvidence()` - Retrieves historical data and evidence for the policy.
2. `simulateStakeholderImpact()` - Simulates quantitative impact scores for various stakeholders.
3. `critiquePolicy()` (Optional third tool) - Evaluates risks and suggests alternatives based on the impacts.

**Agent Flow:**
The project uses a multi-step PLAN -> ACT -> OBSERVE loop where the agent inspects the state after each tool call to determine the next action (e.g., skipping critique if impacts are entirely positive).

**Memory:**
The project includes conversation memory, where a session's previous decisions and contexts are preserved and injected into subsequent evaluation requests.
