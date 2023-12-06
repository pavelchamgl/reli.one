import { Loader } from 'share/ui/Loader'
import { LoaderState } from 'share/ui/Loader/ui/Loader'

interface LoadingProps {
    classe?: string
    state: LoaderState

}

export const Loading: React.FC<LoadingProps> = ({ classe, state }: LoadingProps) => {
    return (<>
        <div><Loader state={state} /></div>
    </>)
}

export { LoaderState }
