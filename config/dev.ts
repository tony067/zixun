import type { UserConfigExport } from '@tarojs/cli';
export default {
  logger: {
    quiet: false,
    stats: true,
  },
  mini: {},
  h5: {
    devServer: {
      open: false,
      port: 10086,
      proxy: {
        '/api': {
          target: 'http://123.207.40.7:3001',
          changeOrigin: true,
          pathRewrite: { '^/api': '/api' },
        },
      },
    },
  },
} satisfies UserConfigExport<'webpack5'>;
