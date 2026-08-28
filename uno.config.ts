import { defineConfig, presetUno, presetAttributify } from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
  ],
  rules: [
    [/^min-w-(\d+)px$/, ([, d]) => ({ 'min-width': `${d}px` })],
  ],
});
