const { defineConfig } = require('@vue/cli-service');
const path = require('path');

module.exports = defineConfig({
  publicPath: '/',
  outputDir: 'dist',

  transpileDependencies: true,
  productionSourceMap: false,

  // PWA Configuration
  pwa: {
    name: 'نظام إدارة المخازن - البران للعطور',
    short_name: 'المخزون',
    themeColor: '#3b82f6',
    backgroundColor: '#ffffff',
    msTileColor: '#3b82f6',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black-translucent',

    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: 'public/service-worker.js',
      swDest: 'service-worker.js',
      skipWaiting: false,
      clientsClaim: false,
      cleanupOutdatedCaches: true,
      exclude: [/\.map$/, /manifest\.json$/]
    },

    iconPaths: {
      favicon32: 'icons/icon-192x192.png',
      favicon16: 'icons/icon-192x192.png',
      appleTouchIcon: 'icons/icon-192x192.png',
      maskIcon: null,
      msTileImage: 'icons/icon-144x144.png'
    },

    manifestOptions: {
      name: 'نظام إدارة المخازن - البران للعطور',
      short_name: 'المخزون',
      description: 'نظام متكامل لإدارة مخازن زجاج العطور - البران للعطور',
      theme_color: '#3b82f6',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: './icons/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: './icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: './icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    }
  },

  // CSS configuration
  css: {
    extract: true,
    sourceMap: false,
    loaderOptions: {
      css: {
        url: false
      }
    }
  },

  // Webpack optimization
  configureWebpack: {
    resolve: {
      extensions: ['.js', '.vue', '.json', '.ts', '.tsx']
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        minSize: 10000,
        maxSize: 250000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'async',
            priority: 5,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      },
      runtimeChunk: {
        name: 'runtime'
      }
    },
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    }
  },

  // Chain webpack for additional configuration
  chainWebpack: config => {
    // Remove prefetch and preload plugins
    config.plugins.delete('prefetch');
    config.plugins.delete('preload');

    // Configure Vue loader for TypeScript
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        options.compilerOptions = {
          ...options.compilerOptions,
          isCustomElement: tag => tag.startsWith('ion-')
        };
        return options;
      });

    // Optimize HTML
    config.plugin('html').tap(args => {
      args[0] = {
        ...args[0],
        title: 'نظام إدارة المخازن - البران للعطور',
        meta: {
          viewport: 'width=device-width,initial-scale=1.0',
          description: 'نظام متكامل لإدارة مخازن زجاج العطور - البران للعطور',
          'theme-color': '#3b82f6'
        },
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: false,
          collapseBooleanAttributes: true,
          removeScriptTypeAttributes: true
        }
      };
      return args;
    });

    // Handle images
    config.module
      .rule('images')
      .use('url-loader')
      .tap(options => ({
        ...options,
        limit: 4096,
        name: 'img/[name].[hash:8].[ext]'
      }));

    // Handle fonts
    config.module
      .rule('fonts')
      .use('url-loader')
      .tap(options => ({
        ...options,
        limit: 4096,
        name: 'fonts/[name].[hash:8].[ext]'
      }));

    // Copy plugin configuration
    config.plugin('copy').tap(([options]) => {
      options.patterns = [];

      options.patterns.push(
        {
          from: path.resolve(__dirname, 'public/service-worker.js'),
          to: path.resolve(__dirname, 'dist/service-worker.js'),
          toType: 'file',
          noErrorOnMissing: true
        },
        {
          from: path.resolve(__dirname, 'public/manifest.json'),
          to: path.resolve(__dirname, 'dist/manifest.json'),
          toType: 'file',
          noErrorOnMissing: true
        },
        {
          from: path.resolve(__dirname, 'public/icons'),
          to: path.resolve(__dirname, 'dist/icons'),
          toType: 'dir',
          noErrorOnMissing: true
        },
        {
          from: path.resolve(__dirname, 'public/favicon.ico'),
          to: path.resolve(__dirname, 'dist/favicon.ico'),
          toType: 'file',
          noErrorOnMissing: true
        }
      );

      return [options];
    });
  },

  // Dev server configuration
  devServer: {
    host: 'localhost',
    port: 8080,
    hot: true,
    open: true,
    historyApiFallback: true,
    client: {
      overlay: {
        warnings: false,
        errors: true
      }
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  }
});