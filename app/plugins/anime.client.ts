// Provides animejs v4 modules as a Nuxt plugin so any component can call
// `const { $anime } = useNuxtApp()` if it needs the raw runner. The shared
// `useAnime` composable is the preferred entry point for presets.
import { animate, createTimeline, stagger, utils, eases } from 'animejs'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      anime: { animate, createTimeline, stagger, utils, eases }
    }
  }
})
