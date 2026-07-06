// Centralized animation presets built on animejs v4.
//
// Using a single composable keeps the look-and-feel consistent across the
// app and makes it trivial to tune easing/durations in one place.
// All helpers accept `HTMLElement | null` so call sites don't need to
// repeat null-guards; the animation simply no-ops when the target is gone.
import { animate, stagger, type AnimationParams, type TargetsParam } from 'animejs'

function asTargets(el: HTMLElement | null | undefined): TargetsParam | null {
  return el ?? null
}

export interface StaggerOptions {
  delay?: number
  from?: 'first' | 'last' | 'center' | 'random'
}

export function useAnime() {
  const EASE_OUT = 'outElastic(1, .6)' as const
  const EASE_IN_OUT = 'inOutQuad' as const
  const EASE_OUT_QUAD = 'outQuad' as const

  function run(targets: TargetsParam | null, params: AnimationParams) {
    if (!targets) return
    return animate(targets, params)
  }

  // Page-level entrance: fade + rise + subtle scale, staggered.
  function enterPage(targets: TargetsParam | null, opts: StaggerOptions = {}) {
    if (!targets) return
    const delay = opts.delay ?? stagger(80, { from: opts.from ?? 'first' })
    return run(targets, {
      opacity: [0, 1],
      translateY: [24, 0],
      scale: [0.96, 1],
      duration: 700,
      ease: EASE_OUT_QUAD,
      delay
    })
  }

  // Generic element entrance
  function enterElement(targets: HTMLElement | null, delay = 0) {
    return run(asTargets(targets), {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 560,
      ease: EASE_OUT,
      delay
    })
  }

  // Todo item add animation: from height/opacity 0 with elastic settle
  function enterTodoItem(targets: HTMLElement | null, delay = 0) {
    return run(asTargets(targets), {
      opacity: [0, 1],
      translateY: [-12, 0],
      scaleX: [0.9, 1],
      duration: 600,
      ease: EASE_OUT,
      delay
    })
  }

  // Todo item remove animation: collapse + fade
  function leaveTodoItem(targets: HTMLElement | null, onComplete?: () => void) {
    const base: AnimationParams = {
      opacity: [1, 0],
      translateX: [0, 40],
      height: 0,
      marginTop: 0,
      marginBottom: 0,
      paddingTop: 0,
      paddingBottom: 0,
      duration: 360,
      ease: EASE_IN_OUT
    }
    if (onComplete) base.onComplete = onComplete
    return run(asTargets(targets), base)
  }

  // Completion toggle: checkmark pop + row settle
  function popComplete(targets: HTMLElement | null) {
    return run(asTargets(targets), {
      scale: [0.6, 1],
      duration: 420,
      ease: EASE_OUT
    })
  }

  // Button press feedback
  function pressFeedback(targets: HTMLElement | null | string) {
    const t: TargetsParam | null =
      typeof targets === 'string' ? targets : asTargets(targets)
    return run(t, {
      scale: [1, 0.94, 1],
      duration: 240,
      ease: EASE_IN_OUT
    })
  }

  // Soft shake for validation errors
  function shake(targets: HTMLElement | null) {
    return run(asTargets(targets), {
      translateX: [0, -8, 8, -6, 6, -3, 0],
      duration: 420,
      ease: EASE_IN_OUT
    })
  }

  return {
    EASE_OUT,
    EASE_IN_OUT,
    EASE_OUT_QUAD,
    run,
    enterPage,
    enterElement,
    enterTodoItem,
    leaveTodoItem,
    popComplete,
    pressFeedback,
    shake
  }
}
