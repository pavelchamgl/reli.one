import { type Configuration } from 'webpack-dev-server'
import { DevServer } from './types/WebpackSettings'

export const devServerConfig  = (devServerSettings: DevServer): Configuration => {
  return {
     static: {
      directory: devServerSettings.path
     },
     port: devServerSettings.port,
      historyApiFallback: true,
      hot: true,
  }
}
