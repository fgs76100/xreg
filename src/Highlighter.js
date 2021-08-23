import { useHighlight } from "./HighlightContext";
import { makeStyles } from '@material-ui/core/styles';


var escapeRegExp = require('lodash.escaperegexp');

const useStyles = makeStyles((theme) => ({
    mark: {
        backgroundColor: theme.palette.secondary.dark
    },
}))

const Highlighter = ({ text = '' }) => {
    const classes = useStyles()
    const { highlight, caseSensitive, enableHighlight } = useHighlight()
    if (!enableHighlight || !highlight.trim()) {
        return <span>{text}</span>
    }
    const option = caseSensitive ? "g" : "gi"
    const regex = new RegExp(`(${escapeRegExp(highlight)})`, option)
    const parts = text.split(regex)
    return (
        <span>
            {parts.filter(part => part).map((part, i) => (
                // regex.test(part) ? <span className={classes.mark} key={i}>{part}</span> : <span key={i}>{part}</span>
                <span className={regex.test(part) ? classes.mark : ""} key={i}>{part}</span>
            ))
            }
        </span >
    )
}

export default Highlighter