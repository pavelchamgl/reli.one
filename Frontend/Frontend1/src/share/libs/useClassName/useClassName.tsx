interface Classes {
    cls: string
    mode?: Record<string, boolean>
    classes?: string[]
}

export const useClassName = ({ cls, mode, classes }: Classes): string => {
    return [
        cls,
        ...Object.entries(mode).filter((element) => Boolean(element[1])).map((element) => element[0]),
        ...classes
    ].join(' ')
}
