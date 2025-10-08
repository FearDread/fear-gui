// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import { defineConfig } from 'rollup';

const production = !process.env.ROLLUP_WATCH;

export default defineConfig([
  // Main build - UMD format (for browser with jQuery)
  {
    input: 'src/main.js',
    output: {
      file: 'dist/jquery.fear.gui.js',
      format: 'umd',
      name: 'FEAR',
      sourcemap: !production,
      globals: {
        jquery: 'jQuery'
      },
      banner: '/*! FEAR GUI v2.0.0 | MIT License | https://github.com/yourorg/fear-gui */',
      // IIFE wrapper for jQuery plugin
      intro: ';(function($, window, document, undefined) {',
      outro: '})(jQuery, window, document);'
    },
    external: ['jquery'],
    plugins: [
      resolve({
        browser: true
      }),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          ['@babel/preset-env', {
            targets: {
              browsers: ['> 1%', 'last 2 versions', 'not dead']
            }
          }]
        ]
      }),
      !production && terser({
        format: {
          comments: /^!/
        }
      })
    ]
  },
  
  // Minified build
  {
    input: 'src/main.js',
    output: {
      file: 'dist/jquery.fear.gui.min.js',
      format: 'umd',
      name: 'FEAR',
      sourcemap: true,
      globals: {
        jquery: 'jQuery'
      },
      banner: '/*! FEAR GUI v2.0.0 | MIT License */',
      intro: ';(function($, window, document, undefined) {',
      outro: '})(jQuery, window, document);'
    },
    external: ['jquery'],
    plugins: [
      resolve({
        browser: true
      }),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          ['@babel/preset-env', {
            targets: {
              browsers: ['> 1%', 'last 2 versions', 'not dead']
            }
          }]
        ]
      }),
      terser({
        format: {
          comments: /^!/
        },
        compress: {
          drop_console: true,
          pure_funcs: ['console.log']
        }
      })
    ]
  },
  
  // ES Module build (for modern bundlers)
  {
    input: 'src/main.js',
    output: {
      file: 'dist/fear.esm.js',
      format: 'es',
      sourcemap: !production
    },
    external: ['jquery'],
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**'
      })
    ]
  },
  
  // CommonJS build (for Node.js)
  {
    input: 'src/main.js',
    output: {
      file: 'dist/fear.cjs.js',
      format: 'cjs',
      sourcemap: !production,
      exports: 'auto'
    },
    external: ['jquery'],
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**'
      })
    ]
  }
]);