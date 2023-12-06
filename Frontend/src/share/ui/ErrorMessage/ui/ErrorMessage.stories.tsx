import type { Meta, StoryObj } from '@storybook/react'
import { ErrorMessage } from './ErrorMessage'
import { AlignDecorator } from '../../../../../config/storybook/decorators/AlignDecorator'

const meta: Meta<typeof ErrorMessage> = {
    component: ErrorMessage,
    decorators: [
        (Story) => (
            <AlignDecorator>
                <Story/>
            </AlignDecorator>
        )
    ]
}

type Story = StoryObj<typeof ErrorMessage>

export const ErrorMess: Story = {
    args: {
    }
}
export default meta
