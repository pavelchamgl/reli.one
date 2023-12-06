import type { Meta, StoryObj } from '@storybook/react'
import { Loader, LoaderState } from './Loader'
import { AlignDecorator } from '../../../../../config/storybook/decorators/AlignDecorator'

const meta: Meta<typeof Loader> = {
    component: Loader,
    decorators: [
        (Story) => (
            <AlignDecorator>
                <Story/>
            </AlignDecorator>
        )
    ]
}

export default meta
type Story = StoryObj<typeof Loader>

export const loaderFirst: Story = {
    args: {
        state: LoaderState.Primary
    }
}

export const LoaderSecond: Story = {
    args: {
        state: LoaderState.Secondary
    }
}
