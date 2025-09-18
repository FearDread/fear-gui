import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/jquery.fear-gui.js',
    format: 'umd', // Universal Module Definition
    name: '$.FEAR.GUI',
  },
  plugins: [
    resolve(),
    commonjs(),
    terser() // Minifies the output
  ]
};