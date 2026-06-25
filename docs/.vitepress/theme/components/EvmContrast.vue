<script setup lang="ts">
interface ContrastRow {
  old: string;       // the EVM / typical-chain behaviour
  infrix: string;    // the Infrix behaviour
}

withDefaults(
  defineProps<{
    heading?: string;
    sub?: string;
    oldTitle?: string;
    infrixTitle?: string;
    rows?: ContrastRow[];
  }>(),
  {
    heading: 'Not another EVM. Not another VM. A governance spine the contracts run inside.',
    sub:
      'The traditional contract surface still exists — @call, @deploy, storage. It just sits ' +
      'beneath the spine, not above it. You can’t bypass governance, because there’s no API to.',
    oldTitle: 'On EVM / typical chains',
    infrixTitle: 'On Infrix',
    rows: () => [
      {
        old: 'You sign a raw transaction and trust validators to do the right thing.',
        infrix: 'You submit an intent — what you want, in plain or typed terms.',
      },
      {
        old: 'Governance is described in docs and hoped for in practice.',
        infrix: 'Governance is enforced in code: no path mutates state without approval + policy.',
      },
      {
        old: 'To audit, you trust the chain’s RPC or re-run an indexer.',
        infrix: 'Every outcome ships a portable evidence bundle you verify offline.',
      },
      {
        old: 'Plugin / VM choice is hard-coded.',
        infrix: 'Infrix picks the right execution per step — confidentiality, cost, trust, capability.',
      },
    ],
  },
);
</script>

<template>
  <section class="ifx-contrast-block ifx-container">
    <header class="ifx-contrast-head ifx-reveal">
      <h2>{{ heading }}</h2>
      <p class="sub">{{ sub }}</p>
    </header>

    <!-- Reuse the .ifx-contrast grid from utilities.css; this component only adds
         per-row scroll-reveal + stagger. Two real columns, headed once. -->
    <div class="ifx-contrast">
      <div class="old">
        <p class="col-title">{{ oldTitle }}</p>
        <ul>
          <li
            v-for="(row, i) in rows"
            :key="'o' + i"
            class="ifx-reveal"
            :style="{ transitionDelay: 70 * i + 'ms' }"
          >{{ row.old }}</li>
        </ul>
      </div>
      <div class="infrix">
        <p class="col-title">{{ infrixTitle }}</p>
        <ul>
          <li
            v-for="(row, i) in rows"
            :key="'i' + i"
            class="ifx-reveal"
            :style="{ transitionDelay: 70 * i + 'ms' }"
          >{{ row.infrix }}</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ifx-contrast-block { margin: 72px auto; }
.ifx-contrast-head { max-width: 760px; margin-bottom: 28px; }
.ifx-contrast-head h2 { font-family: var(--ifx-font-display); letter-spacing: -0.02em; }
.ifx-contrast-head .sub { color: var(--ifx-text-muted); }
/* Only layout inside the columns is local; the grid + glow + mute come from
   utilities.css (.ifx-contrast / .old / .infrix). */
.ifx-contrast .col-title {
  font-family: var(--ifx-font-mono); font-size: 0.78rem; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--ifx-text-muted); margin: 0 0 12px;
}
.ifx-contrast .infrix .col-title { color: var(--ifx-brand); }
.ifx-contrast ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.ifx-contrast li { line-height: 1.55; }
.ifx-contrast .infrix li::before {
  content: '✓'; color: var(--ifx-verified); margin-right: 8px; font-weight: 600;
}
.ifx-contrast .old li::before {
  content: '·'; color: var(--ifx-text-muted); margin-right: 8px;
}
</style>
