import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import envCompatible from 'vite-plugin-env-compatible';

export default defineConfig({
  plugins: [sveltekit(), envCompatible()],
  preview: {
    port: Number(process.env.PORT) || 4173,
    host: true,
    allowedHosts: ['dotientwishlist.onrender.com']
  }
});

