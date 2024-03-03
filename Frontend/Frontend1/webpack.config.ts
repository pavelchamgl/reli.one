import path from 'path'
import type webpack from 'webpack'
import { type EnvType, Modes, type WebpackSettings } from './config/types/WebpackSettings'
import { webpackConfig } from './config/webpackConfig'
export default (env: EnvType): webpack.Configuration => {
    const settings: WebpackSettings = {
        mode: env.mode || Modes.DEVELOPMENT,
        paths: {
            output: path.resolve(__dirname, 'dist'),
            entry: path.resolve(__dirname, 'src'),
            HTMLpath: path.resolve(__dirname, 'public', 'index.html'),
            absolutePath: path.resolve(__dirname, 'src')
        },
        devServer: {
            port: env.port || 80,
            path: path.resolve(__dirname, 'public')
        },
        apiUrl: env.apiUrl || undefined,
        isDev: env.mode !== Modes.PRODUCTION
    }
    console.log(env.apiUrl)
    return webpackConfig(settings)
}
