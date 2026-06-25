// v-tilt: subtle 3D tilt-toward-cursor on hover. Sets --rx/--ry CSS vars the
// element's transform consumes (see .ifx-tilt in effects.css). Skips entirely
// under prefers-reduced-motion and on coarse (touch) pointers.
import type { Directive } from "vue";

const MAX_DEG = 6;

function inert(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia?.("(pointer: coarse)").matches
  );
}

interface Handlers {
  move: (e: MouseEvent) => void;
  leave: () => void;
}

export const vTilt: Directive<HTMLElement & { __tilt?: Handlers }> = {
  mounted(el) {
    if (inert()) return;
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--ry", `${(px * MAX_DEG).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${(-py * MAX_DEG).toFixed(2)}deg`);
    };
    const leave = () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    el.__tilt = { move, leave };
  },
  unmounted(el) {
    if (el.__tilt) {
      el.removeEventListener("mousemove", el.__tilt.move);
      el.removeEventListener("mouseleave", el.__tilt.leave);
    }
  },
};
