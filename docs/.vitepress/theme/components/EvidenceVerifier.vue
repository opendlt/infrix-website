<script setup lang="ts">
import { ref, computed } from "vue";
import type { VerifyResult } from "../data/verifier";

const props = defineProps<{
  // The evidence bundle — accepted as a JSON string OR an object (we stringify).
  bundle: string | Record<string, unknown>;
  // Optional label override for the button.
  label?: string;
}>();

type Phase = "idle" | "running" | "ok" | "fail";
const phase = ref<Phase>("idle");
const result = ref<VerifyResult | null>(null);

const bundleJSON = computed(() =>
  typeof props.bundle === "string" ? props.bundle : JSON.stringify(props.bundle),
);

const live = computed(() => {
  switch (phase.value) {
    case "running": return "Verifying the proof in your browser…";
    case "ok":      return `Verified offline. Chain hash ${result.value?.chainHash ?? ""}.`;
    case "fail":    return `Could not verify: ${result.value?.reason ?? "unknown reason"}.`;
    default:        return "";
  }
});

async function run() {
  if (phase.value === "running") return;
  phase.value = "running";
  result.value = null;
  // Dynamic import keeps the verifier off the page-load critical path (00-overview §8).
  const { verify } = await import("../data/verifier");
  const res = await verify(bundleJSON.value);
  result.value = res;
  phase.value = res.ok ? "ok" : "fail";
}
</script>

<template>
  <div class="ifx-verifier" :data-phase="phase">
    <button
      class="ifx-verify-btn"
      type="button"
      :disabled="phase === 'running'"
      :aria-busy="phase === 'running'"
      @click="run"
    >
      <span v-if="phase === 'running'" class="ifx-spinner" aria-hidden="true" />
      <span>{{ phase === 'running' ? 'Verifying…' : (label ?? 'Verify this proof') }}</span>
    </button>

    <!-- Single polite live region: the ONLY announced result surface. -->
    <p class="ifx-verify-status" role="status" aria-live="polite">{{ live }}</p>

    <div v-if="phase === 'ok'" class="ifx-verify-result is-ok">
      <span class="ifx-verify-icon" aria-hidden="true">✓</span>
      <span>
        <strong>Verified offline.</strong> No node, no trust required.
        <code v-if="result?.chainHash" class="ifx-chainhash">{{ result.chainHash }}</code>
      </span>
    </div>

    <div v-else-if="phase === 'fail'" class="ifx-verify-result is-fail">
      <span class="ifx-verify-icon" aria-hidden="true">✕</span>
      <span><strong>Did not verify.</strong> {{ result?.reason }}</span>
    </div>
  </div>
</template>

<style scoped>
.ifx-verifier { display: flex; flex-direction: column; gap: 12px; }

.ifx-verify-btn {
  display: inline-flex; align-items: center; gap: 10px; align-self: flex-start;
  font-family: var(--ifx-font-mono); font-size: 0.95rem; cursor: pointer;
  padding: 10px 18px; border-radius: var(--ifx-r-sm);
  color: var(--ifx-bg); background: var(--ifx-brand); border: 1px solid var(--ifx-brand-strong);
  transition: background var(--ifx-dur-fast) var(--ifx-ease);
}
.ifx-verify-btn:hover:not(:disabled) { background: var(--ifx-brand-strong); }
.ifx-verify-btn:disabled { opacity: 0.7; cursor: progress; }
.ifx-verify-btn:focus-visible { outline: 2px solid var(--ifx-verified); outline-offset: 2px; }

.ifx-spinner {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--ifx-bg) 40%, transparent);
  border-top-color: var(--ifx-bg);
  animation: ifx-spin 700ms linear infinite;
}
@keyframes ifx-spin { to { transform: rotate(360deg); } }

.ifx-verify-status { margin: 0; min-height: 1.2em; font-size: 0.85rem; color: var(--ifx-text-muted); }

.ifx-verify-result {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 12px 16px; border-radius: var(--ifx-r-md); font-size: 0.95rem;
  border: 1px solid var(--ifx-border); background: var(--ifx-surface);
}
.ifx-verify-result.is-ok {
  color: var(--ifx-verified);
  border-color: color-mix(in srgb, var(--ifx-verified) 50%, transparent);
  background: color-mix(in srgb, var(--ifx-verified) 8%, var(--ifx-surface));
}
.ifx-verify-result.is-fail {
  color: var(--ifx-pending);
  border-color: color-mix(in srgb, var(--ifx-pending) 50%, transparent);
  background: color-mix(in srgb, var(--ifx-pending) 8%, var(--ifx-surface));
}
.ifx-verify-result strong { color: inherit; }
.ifx-verify-icon { font-weight: 700; line-height: 1.4; }
.ifx-chainhash {
  display: inline-block; margin-top: 4px; font-family: var(--ifx-font-mono);
  font-size: 0.82rem; color: var(--ifx-text); word-break: break-all;
}

@media (prefers-reduced-motion: reduce) {
  .ifx-spinner { animation: none; border-top-color: transparent; }
  .ifx-verify-btn { transition: none; }
}
</style>
