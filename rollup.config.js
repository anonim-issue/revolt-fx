import { nodeResolve } from '@rollup/plugin-node-resolve';
import esbuild from "rollup-plugin-esbuild";

const format = (path, format) => {
    return [
        config(path + "revoltfx.js", format, { minify: false }),
        config(path + "revoltfx.min.js", format, { minify: true }),
    ];
};

const config = (file, format, { minify = false }) => {
    return {
        input: './src/index.ts',
        output: {
            file: file,
            format: format,
            sourcemap: true,
            name: 'revolt',
            globals: {
                'pixi.js': 'PIXI'
            },
        },
        moduleContext: () => 'window',
        external: [
            'pixi.js'
        ],
        plugins: [
            nodeResolve(),
            esbuild({
                target: "esnext",
                minify
            }),
        ]
    };
};

export default [
    ...format("dist/browser/", "iife"),
    ...format("dist/cjs/", "cjs"),
    ...format("dist/esm/", "esm"),
];
