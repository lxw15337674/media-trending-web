import { cloudflare } from '@cloudflare/vite-plugin';
import vinext, { clientOutputConfig, clientTreeshakeConfig } from 'vinext';
import { defineConfig } from 'vite';

const rscDepExcludes = [
  'react-server-dom-webpack',
  'react-server-dom-webpack/client',
  'react-server-dom-webpack/server',
  'react-server-dom-webpack/server.edge',
  'react-server-dom-webpack/server.browser',
  'react-server-dom-webpack/server.node',
  'react-server-dom-webpack/static',
];

// vinext 0.0.34 still forwards Rollup options that Vite 8/Rollup 4 no longer accepts.
// Mutating the exported shared config objects here avoids patching node_modules directly.
delete (clientOutputConfig as Record<string, unknown>).experimentalMinChunkSize;
delete (clientTreeshakeConfig as Record<string, unknown>).preset;

export default defineConfig({
  optimizeDeps: {
    exclude: rscDepExcludes,
  },
  ssr: {
    optimizeDeps: {
      exclude: rscDepExcludes,
    },
  },
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
    }),
  ],
});
