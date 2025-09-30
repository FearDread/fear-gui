import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';

export default {
  input: 'src/jquery.fear.bundle.js',
  output: [
      {
      file: 'dist/jquery.fear.js', // Non-minimized (development)
      format: 'esm'
  },
  {
    file: 'dist/jquery.fear.min.js',
    format: 'umd',
    name: 'FEAR',
    globals: {
      jquery: '$'
    }
  },
],
  external: ['jquery'],
  plugins: [
    babel({
      babelHelpers: 'bundled',
      presets: ['@babel/preset-env']
    }),
    terser()
  ]
};