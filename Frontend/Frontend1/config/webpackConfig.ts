import type webpack from 'webpack'
import { WebpackSettings } from './types/WebpackSettings'
import { pluginsConfig } from './pluginsConfig'
import { rulesConfig } from './rulesConfig'
import { resolveConfig } from './resolveConfig'
import { devServerConfig } from './devServeConfig'

export const webpackConfig = (settings : WebpackSettings): webpack.Configuration => {
  return {
      mode: settings.mode,
      entry: settings.paths.entry,
      output: {
        filename: '[name].[contenthash].js',
        path: settings.paths.output,
        clean: true,
          publicPath: '/'
      },
      plugins: pluginsConfig(settings.paths, settings.isDev, settings.apiUrl),
      module: {
        rules: rulesConfig(settings.isDev),

      },
      resolve: resolveConfig(settings.paths),
      devServer: settings.isDev ? devServerConfig(settings.devServer) : undefined,
      devtool: settings.isDev ?  'inline-source-map'  : undefined,

  }
}
 