import type { Preview } from "@storybook/react";
import { RouterDecorator } from './decorators/RouterDecorator'
import { I18nextDecorator } from './decorators/I18nextDecorator'
import {StyleDecorator} from "./decorators/StyleDecorator";
const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },

  },
  decorators: [
    (Story) => (
         <RouterDecorator>
           <Story/>
         </RouterDecorator>

    ),
    (Story) => (
       <I18nextDecorator>
         <Story/>
       </I18nextDecorator>
    ),
      (Story) => (
          <StyleDecorator>
              <Story/>
          </StyleDecorator>
      )
  ]
};

export default preview;
