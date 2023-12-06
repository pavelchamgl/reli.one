import type { StorybookConfig } from "@storybook/react-webpack5";
import webpack from 'webpack'
import {styleRule, paths, fileRule} from "./configStorybook";
const config: StorybookConfig = {
  stories: [ "../../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  async webpackFinal(config){
     config.resolve.modules.push(paths.absolutePath, 'node_modules')
     config.module.rules.push(styleRule, fileRule)
     config.resolve.extensions.push('.js', '.ts', '.tsx', '.jsx', '.json')
    config.plugins.push(
        new  webpack.DefinePlugin({
          __IS_DEV__ : JSON.stringify(true),
            __API__: JSON.stringify('')
        })
    )
    config.optimization.splitChunks = false
    return config
  }
};
export default config;
