import { transformAsync } from '@babel/core';
import type { Plugin, Rollup } from 'vite';
import stylexBabelPlugin from '@stylexjs/babel-plugin';
/// @ts-ignore
import flowSyntaxPlugin from '@babel/plugin-syntax-flow';

/// @ts-ignore
import jsxSyntaxPlugin from '@babel/plugin-syntax-jsx';

/// @ts-ignore
import typescriptSyntaxPlugin from '@babel/plugin-syntax-typescript';


import path from 'path';

/**
 * Options for the StylexPlugin.
 */
interface StylexPluginOptions {
    /**
     * Specifies whether the plugin is running in development mode.
     */
    dev?: boolean;
    /**
     * Specifies the module resolution settings for unstable modules.
     */
    unstable_moduleResolution?: { type: string; rootDir: string };
    /**
     * Specifies the file name for the generated CSS file.
     */
    fileName?: string;
    /**
     * Specifies the prefix for virtual module names.
     */
    virtualModulePrefix?: string;
    /**
     * Specifies the Babel configuration for the plugin.
     */
    babelConfig?: { plugins?: any[]; presets?: any[] };
    /**
     * Specifies the stylex import names.
     */
    stylexImports?: string[];
    /**
     * Additional options for the StylexPlugin.
     */
    [key: string]: any;
}

const IS_DEV_ENV =
    process.env.NODE_ENV === 'development' ||
    process.env.BABEL_ENV === 'development';

export default function stylexPlugin({
    dev = IS_DEV_ENV,
    unstable_moduleResolution = { type: 'commonJS', rootDir: process.cwd() },
    fileName = 'stylex.css',
    virtualModulePrefix = 'virtual:',
    babelConfig: { plugins = [], presets = [] } = {},
    stylexImports = ['stylex', '@stylexjs/stylex'],
    ...options
}: StylexPluginOptions = {}): Plugin {
    let stylexRules: { [id: string]: any } = {};
    let cssPlugin: any;
    let cssPostPlugin: any;
    let baseDir = '/';

    return {
        name: 'vite-plugin-stylex',
        enforce: 'post',
        buildStart() {
            stylexRules = {};
        },
        configResolved(config) {
            cssPlugin = config.plugins.find((plugin: any) => plugin.name === 'vite:css');
            cssPostPlugin = config.plugins.find(
                (plugin: any) => plugin.name === 'vite:css-post',
            );
            baseDir = config.base || '/';
        },
        shouldTransformCachedModule({ code: _code, id, cache: _cache, meta }: any) {
            stylexRules[id] = meta.stylex;
            return false;
        },


        async transform(inputCode: string, id: string): Promise<Rollup.TransformResult> {
            if (!stylexImports.some((importName) => inputCode.includes(importName))) {
                return;
            }
            const result = await transformAsync(inputCode, {
                babelrc: false,
                filename: id,
                presets,
                plugins: [
                    ...plugins,
                    /\.jsx?/.test(path.extname(id))
                        ? flowSyntaxPlugin
                        : typescriptSyntaxPlugin,
                    jsxSyntaxPlugin,
                    [stylexBabelPlugin, { dev, unstable_moduleResolution, ...options }],
                ],
            });

            const { code, map, metadata } = result!;

            // @ts-ignore
            if (!dev && metadata.stylex != null && metadata.stylex.length > 0) {
                // @ts-ignore
                stylexRules[id] = metadata.stylex;
            }
            return { code: code ?? undefined, map, meta: metadata };
        },
        async generateBundle() {
            const rules = Object.values(stylexRules).flat();
            if (rules.length > 0) {
                // @ts-ignore
                const collectedCSS = stylexBabelPlugin.processStylexRules(rules, true);
                if (cssPlugin && cssPostPlugin) {
                    const { code: css } = await cssPlugin.transform(
                        collectedCSS,
                        fileName,
                    );
                    this.emitFile({
                        fileName,
                        source: css,
                        type: 'asset',
                    });
                } else {
                    this.emitFile({
                        fileName,
                        source: collectedCSS,
                        type: 'asset',
                    });
                }
            }
        },
        transformIndexHtml(html: string) {
            if (!dev) {
                return {
                    html,
                    tags: [
                        {
                            tag: 'link',
                            injectTo: 'head',
                            attrs: {
                                href: path.join(baseDir, fileName),
                                rel: 'stylesheet',
                            },
                        },
                    ],
                };
            }
        },

        resolveId(id: string) {
            if (id === virtualModulePrefix + fileName) {
                return '\0' + virtualModulePrefix + fileName;
            }
        },

        load(id: string) {
            if (id === '\0' + virtualModulePrefix + fileName || id === virtualModulePrefix + fileName) {
                // @ts-ignore
                return stylexBabelPlugin.processStylexRules(
                    Object.values(stylexRules).flat(),
                    true,
                );
            }
        }
    };
}
