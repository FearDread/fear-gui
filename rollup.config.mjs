import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';

export default {
  [
    {
      input: 'src/gui/core/index.js',
      output: [
        {
          file: 'dist/jquery.fear.js', // Non-minimized (development)
          format: 'esm',
          globals: {
            jQuery: '$'
          },
        },
        {
          file: 'dist/jquery.fear.min.js',
          format: 'umd',
          name: 'FEAR',
          globals: {
            jQuery: '$'
          },
          plugins: [
            babel({
              babelHelpers: 'bundled',
              presets: ['@babel/preset-env']
            }),
            terser()
          ]
        },
      ],

      external: ['jQuery'],
      context: 'this',
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
  ]
};