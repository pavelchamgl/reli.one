import type webpack from 'webpack'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
export const rulesConfig = (isDev: boolean): webpack.RuleSetRule[] => {
    const tsRules = {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
    }

    const styleRule = {
        test: /\.(s[ac]ss|css)$/i,
        use: [

          isDev? "style-loader" : MiniCssExtractPlugin.loader,

          {
            loader: "css-loader",
            options: {
                modules: {
                    auto : /\.module\./,
                    localIdentName: isDev ? "[path][name]__[local]--[hash:base64:5]" : "[hash:base64:5]"
                }
            }
          },
          "sass-loader",
        ],
    }

    const fileRule = {
        test: /\.(png|jpg|gif)$/i,
        type: 'asset/resource',
        generator: {
            filename: 'static/images/[hash][ext][query]'
          }
    }

    const babelRule = {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
            loader: "babel-loader",
            options: {
                presets: ['@babel/preset-env']
            }
        }
    }

 return [
  tsRules,
  styleRule,
  fileRule,
  babelRule
 ]
}
