import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    copyPublicDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'vendor-icons';
            return 'vendor';
          }
          if (id.includes('/src/data/vehicles/') || id.includes('\\src\\data\\vehicles\\')) {
            return 'catalog-vehicles';
          }
          if (id.includes('guidesData')) {
            return 'catalog-guides';
          }
          if (
            id.includes('vehiclePresets') ||
            id.includes('obdCodes') ||
            id.includes('maintenanceData') ||
            id.includes('vehicleCatalog')
          ) {
            return 'catalog-core';
          }
        },
      },
    },
  },
});
