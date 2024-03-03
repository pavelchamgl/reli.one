import type { Meta, StoryObj } from '@storybook/react'
import cls from '../models/LinkCustom.module.scss'
import { LinkCustom, StateLink } from './LinkCustom'
import { AlignDecorator } from '../../../../../config/storybook/decorators/AlignDecorator'

const meta: Meta<typeof LinkCustom> = {
    component: LinkCustom,
    decorators: [
        (Story) => (
            <AlignDecorator>
                <Story/>
            </AlignDecorator>
        )
    ]
}

type Story = StoryObj<typeof LinkCustom>

export const NavbarLink: Story = {
    args: {
        state: StateLink.NAVBAR,
        children: 'Just Link',
        classes: cls.link
    }
}

export const UnderNavbarLink: Story = {
    args: {
        ...NavbarLink.args,
        state: StateLink.UNDERNAVBAR
    },
    decorators: [
        (Story) => (
            <div style={{ backgroundColor: 'aliceblue' }}>
                <Story/>
            </div>
        )
    ]
}

export const IntroLink: Story = {
    args: {
        ...NavbarLink.args,
        state: StateLink.LINKINTRO
    }
}

export const LinkReset: Story = {
    args: {
        ...NavbarLink.args,
        state: StateLink.LINKRESET
    }
}
export default meta
