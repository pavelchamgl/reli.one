import webpack from 'webpack'
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import path from "path";

export  const styleRule = {
    test: /\.(s[ac]ss|css)$/i,
    use: [

        "style-loader",

        {
            loader: "css-loader",
            options: {
                modules: {
                    auto : /\.module\./,
                    localIdentName:   "[hash:base64:5]"
                }
            }
        },
        "sass-loader",
    ],
}
export const fileRule = {
    test: /\.(png|jpg|gif)$/i,
    type: 'asset/resource',
    generator: {
        filename: 'static/images/[hash][ext][query]'
    }
}

export const paths = {
    absolutePath: path.resolve(__dirname, '../', '../', 'src'),
    entry: path.resolve(__dirname, 'preview.tsx')
}
