import { useRef, useEffect } from "react"

var escapeRegExp = require('lodash.escaperegexp');

export const BITS = "bits"
export const RESET = "default"
export const HEX = "H"
export const DECIMAL = "D"
export const NAME = "field"
export const DESC = "desc"
export const ACCESS = "access"
export const FIEDLS = "fields"
export const RESERVED = new RegExp("reserved", "i")

export const debounce = (fn, delay = 300) => {
    var timer = null;
    return function () {
        var context = this,
            args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            fn.apply(context, args);
        }, delay);
    };
}


export const scrollTo = (node, id, option = null) => {
    // https://stackoverflow.com/questions/824349/how-do-i-modify-the-url-without-reloading-the-page
    let hash = `#${id}`
    // prevent from registering same hash again
    if (window.location.hash !== hash) {
        let current_page_state = {
            id,
            type: "tab",
            // pathname: window.location.pathname
            node,
        }
        window.history.pushState(current_page_state, "", hash)
        window.location.replace(hash)  // trigger css :target
    }
    let el = document.getElementById(id)
    if (el) el.scrollIntoView(option)
    else throw Error(`${id} not found`)
}


export const binaryToHex = (bin) => parseInt(bin, 2).toString(16)

export const binaryTo = (value, format = HEX) => {
    if (format === HEX) return `0x${binaryToHex(value)}`
    // else if (format === 'bin') return value
    else return parseInt(value, 2)  // return demical
}


export class RegValue {
    // for future bitInt (bitWidth largen than 32), please refer following link
    // https://stackoverflow.com/questions/39334494/converting-large-numbers-from-binary-to-decimal-and-back-in-javascript/55681265#55681265
    constructor(bitWidth, fields) {
        this.fields = []
        this.bitWidth = bitWidth
        this.value = new Array(bitWidth).fill(0)
        this.defaultValue = this.calcDefaultValue(bitWidth, fields)
        // Object.seal(this.value)
    }
    reset() {
        this.setValue(this.defaultValue)
    }
    calcDefaultValue(bitWidth, fields) {
        if (!fields || fields.length === 0) return "0"
        const reducer = (acc, field) => {
            let bits = field[BITS]
            let reset = field[RESET]
            for (let [bit, value] of RegValue.iterEachBitAndValue(bits, reset)) {
                acc[bitWidth - (bit + 1)] = value
            }
            return acc
        }
        fields.reduce(reducer, this.value)
        return this.value.join("")
    }
    setValueByIndex(index, value) {
        this.value[this.bitWidth - (index + 1)] = value
    }
    getValueByIndex(index) {
        return this.value[this.bitWidth - (index + 1)]
    }
    setValueByBits(bits, value, format) {
        if (!value) return
        if (format === HEX) {
            if (!value.toLowerCase().startsWith("0x")) {
                value = `0x${value}`
            }
        }
        for (let [bit, bitValue] of RegValue.iterEachBitAndValue(bits, value)) {
            this.setValueByIndex(bit, bitValue)
        }
    }
    getValueByBits(bits, format = HEX) {
        let value = []
        for (let bit of RegValue.iterEachBit(bits)) {
            value.push(this.getValueByIndex(bit))
        }
        return binaryTo(value.reverse().join(""), format)
    }
    getDefaultValue(format = HEX) {
        return binaryTo(this.defaultValue, format)
    }
    getValue(format = HEX) {
        return binaryTo(this.value.join(""), format)
    }
    setValue(value, format) {
        this.setValueByBits(`${this.bitWidth - 1}:0`, value, format)
    }

    static *iterEachBit(bits) {
        bits = bits.toString().split(",")
        // here we indexing bits from LSB
        for (let bit of bits.reverse()) {
            bit = bit.split(":")
            if (bit.length === 1) {
                bit = parseInt(bit[0])
                yield bit
            }
            else if (bit.length === 2) {
                let [msb, lsb] = bit
                msb = parseInt(msb)
                lsb = parseInt(lsb)
                for (let index = lsb; index <= msb; index++) {
                    yield index
                }
            } else {
                throw new Error()
            }
        }
    }
    static *iterEachBitAndValue(bits, value) {
        let binary = value;
        if (typeof value === "string")
            binary = parseInt(value).toString(2)
        else if (!Array.isArray(value))
            throw new Error("expecting an array of value or a string")

        // here we indexing binary from LSB
        let start = -1
        let end = undefined
        for (const bit of RegValue.iterEachBit(bits)) {
            yield [bit, binary.slice(start, end) || "0"]
            end = start
            start -= 1
        }
    }
}


export const createID = () => {
    // source https://gist.github.com/gordonbrander/2230317
    return Math.random()
        .toString(36)
        .substr(2, 9)
}

// https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state
export const usePrevious = (value) => {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

export const Highlighter = ({ text = '', highlight = '', caseSensitive }) => {
    if (!highlight.trim()) {
        return <span>{text}</span>
    }
    const option = caseSensitive ? "g" : "gi"
    const regex = new RegExp(`(${escapeRegExp(highlight)})`, option)
    const parts = text.split(regex)
    return (
        <span>
            {parts.filter(part => part).map((part, i) => (
                regex.test(part) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>
            ))}
        </span>
    )
}



// export function useTraceUpdate(props) {
//     const prev = useRef(props);
//     useEffect(() => {
//         const changedProps = Object.entries(props).reduce((ps, [k, v]) => {
//             if (prev.current[k] !== v) {
//                 ps[k] = [prev.current[k], v];
//             }
//             return ps;
//         }, {});
//         if (Object.keys(changedProps).length > 0) {
//             console.log('Changed props:', changedProps);
//         }
//         prev.current = props;
//     });
// }


export const joinHier = (node, sep = '/') => {
    if (node.parent) return `${joinHier(node.parent)}${sep}${node.name}`
    else return node.name
}


export const setHistoryState = (node, hash = "") => {
    window.history.pushState(
        {
            node,
            type: "tab"
        },
        "",
        `/${joinHier(node)}${hash}`,
    )
    // if (hash) window.location.replace(hash)  // trigger css :target
}

export const getParents = (node) => {
}

export function* iterGetParents(node) {
    // if (!node) return
    if (node?.children) {
        yield node
        for (const child of node.children) {
            yield* iterGetParents(child)
        }
    }
}
