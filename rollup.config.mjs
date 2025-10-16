import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';

export default    {
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
      context: "this",
    }