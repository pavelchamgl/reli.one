import type { Meta, StoryObj } from '@storybook/react'
import { ReduxDecorator } from '../../../../config/storybook/decorators/ReduxDecorator'
import LoginForm from './LoginForm'
import { AlignDecorator } from '../../../../config/storybook/decorators/AlignDecorator'

const meta: Meta<typeof LoginForm> = {
    component: LoginForm,
    decorators: [
        (Story) => (
            <AlignDecorator>
                <Story/>
            </AlignDecorator>
        )
    ]
}

type Story = StoryObj<typeof LoginForm>

export const LoginModal: Story = {
    args: {
    },
    decorators: [
        (Story) => (
            <div style={{ maxWidth: '580px' }}>
                <ReduxDecorator>
                    <Story/>
                </ReduxDecorator>
            </div>
        )
    ]
}
export default meta
