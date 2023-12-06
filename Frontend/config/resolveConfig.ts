import type webpack from 'webpack'
import { ConfigPaths } from './types/WebpackSettings'
export const resolveConfig = (paths: ConfigPaths): webpack.ResolveOptions => {
 return {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
    modules: ['node_modules', paths.absolutePath]
 }
}
