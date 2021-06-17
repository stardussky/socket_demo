const Webpack = require('webpack')
const StyleLintPlugin = require('stylelint-webpack-plugin')
const PrerenderSPAPlugin = require('prerender-spa-plugin')
const Renderer = PrerenderSPAPlugin.PuppeteerRenderer
const path = require('path')

module.exports = {
    publicPath: './',
    productionSourceMap: false,
    devServer: {
        proxy: {
            '/api': {
                target: process.env.VUE_APP_API,
                ws: true,
                changeOrigin: true,
                pathRewrite: {
                    '^/api': '',
                },
            },
        },
        overlay: {
            warnings: false,
            errors: true,
        },
    },
    chainWebpack: (config) => {
        // sass-resources-loader
        const oneOfsMap = config.module.rule('scss').oneOfs.store
        oneOfsMap.forEach((item) => {
            item
                .use('sass-resources-loader')
                .loader('sass-resources-loader')
                .options({
                    resources: ['./src/style/mixins/_mixin.scss'], // 共用sass mixin檔 入口
                })
                .end()
        })
        // svg-sprite-loader
        const iconDir = path.resolve('src/assets/icon')
        config.module.rule('svg').exclude.add(iconDir).end()
        config.module
            .rule('svg-sprite-loader')
            .test(/\.svg$/)
            .include.add(iconDir)
            .end()
            .use('svg-sprite-loader')
            .loader('svg-sprite-loader')
            .options({ symbolId: '[name]' })
        // media
        config.module
            .rule('media')
            .test(/\.(mp3|wav|m4a)$/)
            .use('url-loader')
            .loader('url-loader')
            .options({
                esModule: false,
                name: 'media/[path][name].[ext]',
            })
            .end()
        // models
        config.module
            .rule('models')
            .test(/\.(glb|gltf)$/)
            .use('file-loader')
            .loader('file-loader')
            .options({
                esModule: false,
                name: 'models/[path][name].[ext]',
            })
            .end()
        // glsl file
        config.module
            .rule('glsl')
            .test(/\.(glsl|vs|fs|vert|frag)$/)
            .use('raw-loader')
            .loader('raw-loader')
            .end()
            .use('glslify-loader')
            .loader('glslify-loader')
            .end()
    },
    configureWebpack: () => {
        const plugins = [new Webpack.ProvidePlugin({})]
        if (process.env.NODE_ENV === 'production') {
            plugins.push(
                new StyleLintPlugin({
                    files: ['**/*.{vue,htm,html,css,sss,less,scss,sass}'],
                }),
                new PrerenderSPAPlugin({
                    staticDir: path.join(__dirname, 'dist'),
                    routes: ['/index.html'], // 填入router路徑
                    renderer: new Renderer({
                        renderAfterDocumentEvent: 'render-event',
                    }),
                    postProcess (renderedRoute) {
                        if (renderedRoute.route.endsWith('.html')) {
                            renderedRoute.outputPath = path.join(__dirname, 'dist', renderedRoute.route)
                        }
                        return renderedRoute
                    },
                    minify: {
                        collapseBooleanAttributes: true,
                        collapseWhitespace: true,
                        decodeEntities: true,
                        keepClosingSlash: true,
                        sortAttributes: true,
                        minifyCSS: true,
                        minifyJS: true,
                        processConditionalComments: true,
                        removeEmptyAttributes: true,
                        removeRedundantAttributes: true,
                        trimCustomFragments: true,
                        useShortDoctype: true,
                    },
                })
            )
        }
        return { plugins }
    },
}
