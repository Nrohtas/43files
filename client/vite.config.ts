import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: '.',
    base: '/',
    publicDir: 'public',
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        }
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                hdc: resolve(__dirname, 'hdc/index.html'),
                oppp: resolve(__dirname, 'oppp/index.html'),
                report: resolve(__dirname, 'hdc/report/index.html'),
                'oppp-report': resolve(__dirname, 'oppp/report/index.html'),
                admin: resolve(__dirname, 'admin/index.html'),
            }
        }
    },
    server: {
        port: 5173
    },
    appType: 'mpa'
});
