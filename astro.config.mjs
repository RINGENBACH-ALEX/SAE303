// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  // Garde les espaces entre le texte et les expressions {…} des paragraphes
  compressHTML: false,

  vite: {
    plugins: [tailwindcss()],
    // Plot est importé dynamiquement par le script des filtres : on le pré-optimise
    // dès le démarrage du serveur de dev (sinon 504 « Outdated Optimize Dep », cf. TP7)
    optimizeDeps: {
      include: ['@observablehq/plot']
    }
  },

 adapter: netlify({
  devFeatures: {
    images: true,
    environmentVariables: false,
    edgeFunctions: false
  }
})
});