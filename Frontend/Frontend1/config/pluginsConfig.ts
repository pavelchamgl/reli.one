import  webpack  from 'webpack'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import HTMLWebpackPlugin from 'html-webpack-plugin'
import { ConfigPaths } from "./types/WebpackSettings"

export const pluginsConfig = (paths: ConfigPaths, isDev: boolean, api: string): webpack.WebpackPluginInstance[] => {
  return [
    new HTMLWebpackPlugin({
       title: 'Solopharma',
       template: paths.HTMLpath
    }),
    new MiniCssExtractPlugin({
      filename: isDev ? "styles/[name].css" : "styles/[name].[contenthash].css",
      chunkFilename: isDev ? "styles/[id].css" : "styles/[id].[contenthash].css",
    }),
      new webpack.DefinePlugin({
          __IS_DEV__ : JSON.stringify(isDev),
          __API__: JSON.stringify(api)
      })
  ]
}
