import type { Meta, StoryObj } from '@storybook/react'
import { InputCustom, InputState } from './InputCustom'
import { AlignDecorator } from '../../../../../config/storybook/decorators/AlignDecorator'

const meta: Meta<typeof InputCustom> = {
    component: InputCustom,
    decorators: [
        (Story) => (
            <AlignDecorator>
                <Story/>
            </AlignDecorator>
        )
    ]
}

type Story = StoryObj<typeof InputCustom>

export const PrimaryButton: Story = {
    args: {
        placeholder: 'Enter some..',
        state: InputState.MODALINPUT

    }
}
export default meta
