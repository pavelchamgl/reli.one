import React from 'react'
import { type ErrorInfo } from 'react-dom/client'
import { ErrorMessage } from 'share/ui/ErrorMessage'

interface ErrorBoundaryProps {
    children?: React.ReactNode
    error?: Error
}
interface ErrorBoundaryState {
    hasError: boolean
}
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor (props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError (error: Error): { hasError: boolean } {
        // Update state so the next render will show the fallback UI.
        return { hasError: true }
    }

    componentDidCatch (error: Error, info: ErrorInfo): void {

    }

    render () {

        if (this.state.hasError) {
            return <ErrorMessage/>
        }

        return this.props.children
    }
}
