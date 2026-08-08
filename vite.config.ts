import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

function supabaseVirtualShimPlugin() {
  const message = "Supabase client is disabled in this project (Drizzle/MySQL). Remove the import: '@/integrations/supabase/client'.";
  const VIRTUAL_ID = "\0supabase-virtual-shim";
  return {
    name: "supabase-virtual-shim",
    enforce: "pre" as const,
    resolveId(id: string) {
      if (id === "@/integrations/supabase/client") return VIRTUAL_ID;
      return null;
    },
    load(id: string) {
      if (id !== VIRTUAL_ID) return null;
      return `const message = ${JSON.stringify(message)};
export const supabase = new Proxy({}, { get() { throw new Error(message); } });
export default supabase;
`;
    },
  };
}

const plugins = [supabaseVirtualShimPlugin(), react(), tailwindcss(), jsxLocPlugin()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          'router': ['wouter'],
          'ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-alert-dialog',
          ],
          'charts': ['recharts'],
          'utils': ['date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
  },
  server: {
    host: true,
    allowedHosts: ['localhost', '127.0.0.1'],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
