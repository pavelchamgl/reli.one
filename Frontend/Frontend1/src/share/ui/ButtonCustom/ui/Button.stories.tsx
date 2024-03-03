import type { Meta, StoryObj } from '@storybook/react'
import { ButtonCustom, ButtonCustomState } from './ButtonCustom'
import { AlignDecorator } from '../../../../../config/storybook/decorators/AlignDecorator'

const meta: Meta<typeof ButtonCustom> = {
    component: ButtonCustom,
    decorators: [
        (Story) => (
            <AlignDecorator>
                <Story/>
            </AlignDecorator>
        )
    ]
}

type Story = StoryObj<typeof ButtonCustom>

export const ResetButton: Story = {
    args: {
        state: ButtonCustomState.RESET,
        children: 'Just Button'
    }
}

export const NavBarButton: Story = {
    args: {
        ...ResetButton.args,
        state: ButtonCustomState.NAVBARBUTTON
    }
}

export const buttonModal: Story = {
    args: {
        ...ResetButton.args,
        state: ButtonCustomState.BUTTONMODAL
    }
}

export const buttonClose: Story = {
    args: {
        ...ResetButton.args,
        state: ButtonCustomState.BUTTONCLOSE
    }
}
export default meta
