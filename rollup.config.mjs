import terser from '@rollup/plugin-terser';
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

const jsconfig = [{
		input: ['src/core/index.js','src/modules/index.js', 'src/plugins/index.js'],
		output: [
			{
				file: 'dist/fear.gui.js',
				format: 'cjs',
        		exports: 'named',
				sourcemap: true,
			},
			{
				file: 'dist/fear.gui.esm.js',
				format: "esm",
        		exports: 'named',
				sourcemap: true,
			},
		  	{
				file: 'dist/fear.gui.bundle.min.js',
				format: 'iife',
				name: 'version',
				plugins: [terser()]
			}
		],
		plugins: [
			peerDepsExternal(),
      		resolve({
        		browser: true,
        		preferBuiltins: false,
      		}),
			commonjs(),
      		json(),
			terser()
		]
	},  
];

export default jsconfig;