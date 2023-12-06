import { useCallback, useState } from 'react'

interface useHoverInterface {
    onMouseLeave: () => void
    onMouseEnter: () => void
}
type useHoverType = [boolean: useHoverInterface]
export const useHover = (): useHoverType => {
    const [isHover, setHover] = useState<boolean>(false)
    const onMouseLeave = useCallback(() => {
        setHover(false)
    }, [isHover])

    const onMouseEnter = useCallback(() => {
        setHover(true)
    }, [isHover])

    return [
        {
            onMouseLeave,
            onMouseEnter
        }
    ]

}
