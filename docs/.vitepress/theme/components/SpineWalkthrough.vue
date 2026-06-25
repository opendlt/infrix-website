<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { SPINE_STAGES } from '../data/spine';
import { DEMO_BUNDLE } from '../data/demo-bundle';
import type { DemoBundle, DemoFinality } from '../data/demo-bundle';
import DEMO_EVIDENCE from '../data/demo-evidence.json';

const bundle: DemoBundle = DEMO_BUNDLE;
const stages = SPINE_STAGES;

const index = ref(0);
const stage = computed(() => stages[index.value]);
const atStart = computed(() => index.value === 0);
const atEnd = computed(() => index.value === stages.length - 1);

function next() { if (!atEnd.value) index.value++; }
function prev() { if (!atStart.value) index.value--; }
function goTo(i: number) { index.value = i; }

// ---- Keyboard: Left/Right move stages while focus is inside the widget. ----
const root = ref<HTMLElement | null>(null);
function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') { next(); e.preventDefault(); }
  else if (e.key === 'ArrowLeft') { prev(); e.preventDefault(); }
}

// ---- Finality ticker: provisional → locally_final → l0_anchored_final on the outcome stage. ----
const finalityStep = ref(0);
let finalityTimer: ReturnType<typeof setInterval> | null = null;
const currentFinality = computed<DemoFinality>(
  () => bundle.outcome.finalitySequence[finalityStep.value],
);
function runFinalityTicker() {
  stopFinalityTicker();
  finalityStep.value = 0;
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { finalityStep.value = bundle.outcome.finalitySequence.length - 1; return; }
  finalityTimer = setInterval(() => {
    if (finalityStep.value < bundle.outcome.finalitySequence.length - 1) finalityStep.value++;
    else stopFinalityTicker();
  }, 900);
}
function stopFinalityTicker() {
  if (finalityTimer) { clearInterval(finalityTimer); finalityTimer = null; }
}

// Kick the ticker whenever we land on the outcome stage.
watch(stage, (s) => {
  if (s.id === 'outcome') runFinalityTicker();
  else stopFinalityTicker();
});

onMounted(() => root.value?.addEventListener('keydown', onKey));
onBeforeUnmount(() => { root.value?.removeEventListener('keydown', onKey); stopFinalityTicker(); });

// The real, verifiable PortableEvidencePackage that <EvidenceVerifier> checks
// in-browser (runbook 05). It is the genuine @infrix/verify fixture — a valid
// proof that passes all ten cryptographic checks offline, with no node and no
// network. The friendly per-stage data above (DEMO_BUNDLE) drives the *display*;
// this drives the *live verify*.
const demoEvidence = DEMO_EVIDENCE;

// Approver display state → CSS class (submitter greyed, approver signs green).
function approverClass(state: string) {
  return { submitted: 'is-submitter', signed: 'is-signed', blocked: 'is-blocked' }[state] ?? '';
}
</script>

<template>
  <section
    ref="root"
    class="ifx-walk ifx-container ifx-reveal"
    aria-roledescription="step-through demo"
    aria-label="Watch an intent become a proof, one governance stage at a time"
  >
    <header class="ifx-walk-head">
      <h2>Watch an intent become a proof</h2>
      <p class="sub">Step through the governance spine — one enforced pipeline — and verify the receipt yourself.</p>
    </header>

    <!-- The live diagram, lit at the current stage. Decorative duplication of the
         tablist state, so aria-hidden. -->
    <div class="ifx-walk-diagram" aria-hidden="true">
      <SpineDiagram :animated="false" :active-id="stage.id" />
    </div>

    <!-- Stage selector as a real tablist: keyboard + SR navigable, color-coded by
         stage token with a text label (color is never the sole signal). -->
    <div class="ifx-walk-tabs" role="tablist" aria-label="Governance stages">
      <button
        v-for="(s, i) in stages"
        :key="s.id"
        role="tab"
        :id="'walk-tab-' + s.id"
        :aria-selected="i === index"
        :aria-controls="'walk-panel'"
        :tabindex="i === index ? 0 : -1"
        class="ifx-walk-tab"
        :class="{ 'is-active': i === index, 'is-done': i < index }"
        :style="{ '--stage-color': s.color }"
        @click="goTo(i)"
      >
        <span class="num">{{ i + 1 }}</span>
        <span class="label">{{ s.label }}</span>
      </button>
    </div>

    <!-- One panel; its content swaps with the active stage. -->
    <div
      id="walk-panel"
      class="ifx-walk-panel"
      role="tabpanel"
      :aria-labelledby="'walk-tab-' + stage.id"
      tabindex="0"
    >
      <p class="stage-blurb" :style="{ '--stage-color': stage.color }">
        <span class="stage-dot" /> {{ stage.blurb }}
      </p>

      <!-- ===== INTENT ===== -->
      <div v-if="stage.id === 'intent'" class="stage-body">
        <p class="restate">{{ bundle.intent.summary }}</p>
        <pre class="kv"><code>{{ bundle.intent.goal }} {
  from:   {{ bundle.intent.params.from }}
  to:     {{ bundle.intent.params.to }}
  amount: {{ bundle.intent.params.amount }}
}</code></pre>
        <p class="meta">intent <code>{{ bundle.intent.id }}</code></p>
      </div>

      <!-- ===== PLAN ===== -->
      <div v-else-if="stage.id === 'plan'" class="stage-body">
        <ol class="steps">
          <li v-for="s in bundle.plan.steps" :key="s.id">
            <span class="step-label">{{ s.label }}</span>
            <code class="step-type">{{ s.stepType }}</code>
            <div v-if="s.selection" class="selection">
              <p><strong>{{ s.selection.plugin }}</strong> — {{ s.selection.reason }}</p>
              <ul>
                <li>{{ s.selection.confidentiality }}</li>
                <li>{{ s.selection.cost }}</li>
              </ul>
            </div>
          </li>
        </ol>
        <p class="meta">plan <code>{{ bundle.plan.id }}</code> · hash <code>{{ bundle.plan.planHash }}</code></p>
      </div>

      <!-- ===== APPROVAL (separation of duties) ===== -->
      <div v-else-if="stage.id === 'approval'" class="stage-body">
        <p class="restate">{{ bundle.approval.requirement }}</p>
        <div class="approvers">
          <div
            v-for="a in bundle.approval.approvers"
            :key="a.id"
            class="approver"
            :class="approverClass(a.state)"
          >
            <span class="avatar" aria-hidden="true">{{ a.name.charAt(0) }}</span>
            <span class="who">{{ a.name }}</span>
            <span class="role">{{ a.role }}</span>
            <span class="badge">
              {{ a.state === 'signed' ? '✓ signed' : a.state === 'submitted' ? 'submitted (can’t approve)' : 'blocked' }}
            </span>
          </div>
        </div>
        <p class="meta sr-note">{{ bundle.approval.separationNote }}</p>
      </div>

      <!-- ===== EXECUTION ===== -->
      <div v-else-if="stage.id === 'execution'" class="stage-body">
        <ul class="exec">
          <li v-for="s in bundle.plan.steps" :key="s.id" class="exec-step">
            <span class="check">✓</span>
            <span class="step-label">{{ s.label }}</span>
            <code class="fin">{{ bundle.execution.greenedAt[s.id] }}</code>
          </li>
        </ul>
      </div>

      <!-- ===== OUTCOME (finality ticker) ===== -->
      <div v-else-if="stage.id === 'outcome'" class="stage-body">
        <p class="restate">Status: <strong>{{ bundle.outcome.status }}</strong></p>
        <ol class="finality">
          <li
            v-for="(f, i) in bundle.outcome.finalitySequence"
            :key="f"
            :class="{ reached: i <= finalityStep, current: i === finalityStep }"
          >
            <span class="check">{{ i <= finalityStep ? '✓' : '○' }}</span> {{ f }}
          </li>
        </ol>
      </div>

      <!-- ===== EVIDENCE (portable receipt) ===== -->
      <div v-else-if="stage.id === 'evidence'" class="stage-body">
        <p class="restate">A portable receipt you can verify offline.</p>
        <dl class="bundle">
          <div v-for="r in bundle.evidence.rows" :key="r.label" class="bundle-row" :class="'tok-' + r.token">
            <dt>{{ r.label }}</dt>
            <dd><code>{{ r.value }}</code></dd>
          </div>
        </dl>
      </div>

      <!-- ===== ANCHOR + VERIFY payoff ===== -->
      <div v-else-if="stage.id === 'anchor'" class="stage-body">
        <p class="restate">
          A digest is written to <strong>{{ bundle.anchor.network }}</strong> at height
          <code>{{ bundle.anchor.height }}</code>.
        </p>
        <pre class="kv anchor"><code>{{ bundle.anchor.chainHash }}</code></pre>

        <EvidenceVerifier :bundle="demoEvidence" />
        <p class="meta demo-note">
          Sample proof, real verifier — this runs the actual offline proof-checker in your
          browser. No node, no network: it is pure cryptography over the evidence package.
        </p>
      </div>
    </div>

    <!-- Explicit Prev/Next — the ONLY drivers (no scroll-jacking). -->
    <div class="ifx-walk-nav">
      <button class="nav-btn" :disabled="atStart" @click="prev">← Prev</button>
      <span class="nav-pos" aria-live="polite">Stage {{ index + 1 }} of {{ stages.length }} — {{ stage.label }}</span>
      <button class="nav-btn primary" :disabled="atEnd" @click="next">Next →</button>
    </div>
  </section>
</template>

<style scoped>
.ifx-walk { margin: 88px auto; }
.ifx-walk-head { max-width: 720px; margin-bottom: 24px; }
.ifx-walk-head h2 { font-family: var(--ifx-font-display); letter-spacing: -0.02em; }
.ifx-walk-head .sub { color: var(--ifx-text-muted); }
.ifx-walk-diagram { margin: 12px 0 24px; }

/* Tablist */
.ifx-walk-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.ifx-walk-tab {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 14px; border-radius: var(--ifx-r-sm);
  border: 1px solid var(--ifx-glass-border);
  background: color-mix(in srgb, var(--ifx-surface) 50%, transparent);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  color: var(--ifx-text-muted); font-size: 0.86rem; cursor: pointer;
  transition: color var(--ifx-dur-fast) var(--ifx-ease), border-color var(--ifx-dur-fast) var(--ifx-ease),
    box-shadow var(--ifx-dur-fast) var(--ifx-ease);
}
.ifx-walk-tab .num {
  display: inline-grid; place-items: center; width: 20px; height: 20px;
  border-radius: 50%; font-size: 0.74rem; background: var(--ifx-surface-2);
}
.ifx-walk-tab.is-done { color: var(--ifx-text); }
.ifx-walk-tab.is-active {
  color: var(--ifx-text); border-color: var(--stage-color);
  box-shadow: 0 0 0 1px var(--stage-color),
    0 0 22px -4px color-mix(in srgb, var(--stage-color) 70%, transparent);
}
.ifx-walk-tab.is-active .num { background: var(--stage-color); color: var(--ifx-bg); }
.ifx-walk-tab:focus-visible { outline: 2px solid var(--ifx-brand); outline-offset: 2px; }

/* Panel */
.ifx-walk-panel {
  border: 1px solid var(--ifx-glass-border); border-radius: var(--ifx-r-lg);
  background: color-mix(in srgb, var(--ifx-surface) 55%, transparent);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  padding: 24px; min-height: 280px;
  box-shadow: 0 26px 70px -46px color-mix(in srgb, var(--ifx-brand) 45%, transparent);
}
/* The synced diagram's active node glows, matching the hero spine. */
.ifx-walk-diagram :deep(.ifx-spine__node.is-active .ifx-spine__core) {
  filter: drop-shadow(0 0 6px var(--node-color));
}
.ifx-walk-panel:focus-visible { outline: 2px solid var(--ifx-brand); outline-offset: 2px; }
.stage-blurb { display: flex; align-items: center; gap: 10px; font-weight: 600; margin-top: 0; }
.stage-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--stage-color); flex: none; }
.restate { color: var(--ifx-text); }
.meta { color: var(--ifx-text-muted); font-size: 0.84rem; }
.meta code, .kv code, .step-type, .fin { font-family: var(--ifx-font-mono); }
.kv {
  background: var(--ifx-bg); border: 1px solid var(--ifx-border);
  border-radius: var(--ifx-r-sm); padding: 14px 16px; overflow-x: auto;
  font-family: var(--ifx-font-mono); font-size: 0.86rem;
}
.kv.anchor code { color: var(--ifx-brand); }

/* Plan */
.steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.steps > li { border-left: 2px solid var(--ifx-border); padding-left: 14px; }
.step-label { font-weight: 600; margin-right: 8px; }
.step-type {
  font-size: 0.78rem; color: var(--ifx-evidence);
  background: color-mix(in srgb, var(--ifx-evidence) 12%, transparent);
  padding: 1px 6px; border-radius: 4px;
}
.selection {
  margin-top: 8px; padding: 12px; border-radius: var(--ifx-r-sm);
  background: color-mix(in srgb, var(--ifx-brand) 8%, var(--ifx-surface-2));
  border: 1px solid color-mix(in srgb, var(--ifx-brand) 28%, transparent);
}
.selection ul { margin: 6px 0 0; padding-left: 18px; color: var(--ifx-text-muted); }

/* Approval — separation of duties */
.approvers { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 12px 0; }
@media (max-width: 560px) { .approvers { grid-template-columns: 1fr; } }
.approver {
  display: grid; grid-template-columns: auto 1fr; grid-auto-rows: min-content; gap: 2px 12px;
  align-items: center; padding: 14px; border-radius: var(--ifx-r-sm);
  border: 1px solid var(--ifx-border); background: var(--ifx-surface-2);
}
.approver .avatar {
  grid-row: span 2; width: 38px; height: 38px; border-radius: 50%;
  display: grid; place-items: center; font-weight: 700; color: var(--ifx-bg);
  background: var(--ifx-text-muted);
}
.approver .who { font-weight: 600; }
.approver .role { font-size: 0.78rem; color: var(--ifx-text-muted); text-transform: capitalize; }
.approver .badge { grid-column: 1 / -1; margin-top: 6px; font-size: 0.8rem; }
.approver.is-submitter { opacity: 0.55; }            /* submitter greyed out */
.approver.is-signed .avatar { background: var(--ifx-verified); }
.approver.is-signed .badge { color: var(--ifx-verified); }
.sr-note { margin-top: 12px; }

/* Execution */
.exec { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.exec-step { display: flex; align-items: center; gap: 10px; }
.exec-step .check { color: var(--ifx-verified); font-weight: 700; }
.exec-step .fin { font-size: 0.78rem; color: var(--ifx-text-muted); margin-left: auto; }

/* Outcome finality ticker */
.finality { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 10px; }
.finality li { color: var(--ifx-text-muted); transition: color var(--ifx-dur) var(--ifx-ease); }
.finality li .check { color: var(--ifx-border); }
.finality li.reached { color: var(--ifx-text); }
.finality li.reached .check { color: var(--ifx-verified); }
.finality li.current { color: var(--ifx-verified); font-weight: 600; }

/* Evidence bundle */
.bundle { display: grid; gap: 8px; margin: 12px 0 0; }
.bundle-row {
  display: flex; justify-content: space-between; gap: 12px;
  padding: 10px 14px; border-radius: var(--ifx-r-sm);
  background: var(--ifx-surface-2); border-left: 3px solid var(--ifx-border);
}
.bundle-row dt { color: var(--ifx-text-muted); margin: 0; }
.bundle-row dd { margin: 0; }
.bundle-row dd code { font-family: var(--ifx-font-mono); }
.bundle-row.tok-evidence { border-left-color: var(--ifx-evidence); }
.bundle-row.tok-brand    { border-left-color: var(--ifx-brand); }
.bundle-row.tok-verified { border-left-color: var(--ifx-verified); }

/* Verify payoff — the button/spinner/result live in <EvidenceVerifier>; only the
   caption beneath it is styled here. */
.demo-note { margin-top: 12px; }

/* Nav */
.ifx-walk-nav { display: flex; align-items: center; gap: 16px; margin-top: 22px; }
.nav-btn {
  padding: 10px 18px; border-radius: var(--ifx-r-sm); cursor: pointer;
  border: 1px solid var(--ifx-border); background: var(--ifx-surface); color: var(--ifx-text);
}
.nav-btn.primary { border-color: var(--ifx-brand); color: var(--ifx-brand); }
.nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.nav-btn:focus-visible { outline: 2px solid var(--ifx-brand); outline-offset: 2px; }
.nav-pos { color: var(--ifx-text-muted); font-size: 0.86rem; margin-left: auto; }

@media (prefers-reduced-motion: reduce) {
  .finality li { transition: none; }
}
</style>
