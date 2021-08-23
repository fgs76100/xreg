import React from 'react'


const HighlightContext = React.createContext(null)

export const HighlightProvider = ({ children }) => {
    const [highlight, setHighlight] = React.useState("")
    const [caseSensitive, setCaseSensitive] = React.useState(false)
    const [enableHighlight, setEnableHighlight] = React.useState(false)
    return (
        <HighlightContext.Provider value={
            {
                highlight, setHighlight, caseSensitive, setCaseSensitive,
                enableHighlight, setEnableHighlight
            }
        }>
            {children}
        </HighlightContext.Provider>

    )
}

export const useHighlight = () => React.useContext(HighlightContext)