// Binding to the offline evidence verifier. Wraps the vendored, first-party
// @infrix/verify closure (theme/lib/verify/portableVerifier.js — a byte-exact
// browser mirror of the Go pkg/evidence VerifyPortablePackage) into the contract
// every consumer expects:
//
//   verify(bundleJSON: string) => Promise<{ ok, chainHash?, reason? }>
//
// The verifier module is dynamically imported on the FIRST verify() call only
// (00-overview §8: the verifier stays off the initial page-load bundle — it is an
// async chunk fetched on demand). Verification is pure cryptography (SHA-256 via
// the Web Crypto API) over the bundle JSON passed in: NO network call, no Infrix
// node, no endpoint. That zero-trust property is the whole point (runbook 05 §6).

export interface VerifyResult {
  ok: boolean;
  chainHash?: string;
  reason?: string;
}

// The vendored verifier's return shape.
interface PortableCheck {
  name: string;
  passed: boolean;
  detail?: string;
  error?: string;
}
interface PortableResult {
  passed: boolean;
  checks: PortableCheck[];
}
type VerifyFn = (pkg: unknown) => Promise<PortableResult>;

// Single-flight: resolve the verifier module once, share it across calls.
let modPromise: Promise<VerifyFn> | null = null;
function loadVerifier(): Promise<VerifyFn> {
  if (!modPromise) {
    modPromise = import("../lib/verify/portableVerifier.js")
      .then((m: any) => m.verifyPortablePackage as VerifyFn)
      .catch((err) => {
        modPromise = null; // allow retry after a transient import failure
        throw err;
      });
  }
  return modPromise;
}

/** Hex-encode a 32-byte digest however the wire form carries it (array | hex | base64). */
function hashToHex(v: unknown): string | undefined {
  if (!v) return undefined;
  if (typeof v === "string") return v.startsWith("0x") ? v : v;
  if (Array.isArray(v)) {
    return "0x" + v.map((b) => Number(b).toString(16).padStart(2, "0")).join("");
  }
  return undefined;
}

/** True for a real-looking hash (hex, ≥16 nibbles), so we don't surface a placeholder string. */
function looksLikeHash(s: string): boolean {
  return /^0x[0-9a-f]{8,}$/i.test(s) || /^[0-9a-f]{16,}$/i.test(s);
}

/** Surface a proof hash for display: the bundle's anchor tx when it's a real hash, else the
 *  package export hash — the 32-byte integrity digest the verifier just recomputed and matched. */
function chainHashOf(pkg: any): string | undefined {
  const anchor = pkg?.anchorTxHash;
  if (typeof anchor === "string" && looksLikeHash(anchor)) return anchor;
  return hashToHex(pkg?.exportHash);
}

/** First failing check, as a plain-English reason. */
function firstFailure(result: PortableResult): string {
  const bad = result.checks?.find((c) => !c.passed);
  if (!bad) return "verification failed";
  const why = bad.error ?? bad.detail ?? "check did not pass";
  return `${bad.name}: ${why}`;
}

export async function verify(bundleJSON: string): Promise<VerifyResult> {
  let pkg: any;
  try {
    pkg = JSON.parse(bundleJSON);
  } catch (err) {
    return { ok: false, reason: "bundle is not valid JSON" };
  }

  let verifyPortablePackage: VerifyFn;
  try {
    verifyPortablePackage = await loadVerifier();
  } catch {
    return { ok: false, reason: "Could not load the verifier in this browser." };
  }

  try {
    const result = await verifyPortablePackage(pkg);
    if (result.passed) {
      return { ok: true, chainHash: chainHashOf(pkg) };
    }
    // Fail closed: a failed check is NEVER a green badge.
    return { ok: false, chainHash: chainHashOf(pkg), reason: firstFailure(result) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: "Could not run the verifier: " + msg };
  }
}
