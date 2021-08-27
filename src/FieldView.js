import { makeStyles } from "@material-ui/core/styles"
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import Box from '@material-ui/core/Box';
import InputBase from '@material-ui/core/InputBase';
import RefreshIcon from '@material-ui/icons/Refresh';
import IconButton from '@material-ui/core/IconButton';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import InputAdornment from '@material-ui/core/InputAdornment';
import { memo, useCallback, useRef, useState, forwardRef, useMemo, useEffect, } from "react";
import {
    debounce, scrollToID, BITS, RESET, RegValue, HEX, DECIMAL,
    NAME, DESC, ACCESS, RESERVED, createID
} from './utils';
import AddBoxIcon from '@material-ui/icons/AddBox';
import Highlighter from "./Highlighter";
// import Tooltip from '@material-ui/core/Tooltip';

const ENCODER = "-1"

const headers = [
    BITS,
    NAME,
    // ACCESS,
    // RESET,
]

const useAnchorStyles = makeStyles((theme) => ({
    desc: {
        "& .anchor-acitve": {
            backgroundColor: theme.palette.action.focus,
            // text: theme.palette.text.hint
        }
    },
}))

const FieldsDesc = memo(({ regID, fields }) => {
    const classes = useAnchorStyles()
    const FieldDesc = ({ field }) => (
        !RESERVED.test(field[NAME]) &&
        <Box mt={3} className={classes.desc} >
            <Typography
                variant="h5"
                id={`${regID}-${field[NAME]}-${field[BITS]}-${NAME}`}
                className={classes.anchor}
                gutterBottom
            >
                <Highlighter text={`[${field[BITS]}] ${field[NAME]}`} />
            </Typography>
            <Typography variant="body1" gutterBottom
                color="textSecondary"
            >
                Access: {field[ACCESS]}, Default: {field[RESET]}
            </Typography>

            {field[DESC] && <Box

                id={`${regID}-${field[NAME]}-${field[BITS]}-${DESC}`}
                fontSize="body1.fontSize"
                whiteSpace="pre-wrap"
            >
                <Highlighter

                    text={field[DESC]} />
            </Box>}
        </Box>
    )
    return (
        <Box mt={4} pb={4}>
            <Typography variant="h4"> Field Descriptions </Typography>
            <Divider />
            {fields.map((field => (
                <FieldDesc field={field} key={field[BITS]} />
            )))}
        </Box>
    )
})


const useDecoderStyles = makeStyles((theme) => ({
    decoderRoot: {
        display: "inline-flex",
        width: "22ch",
        flexWrap: "nowrap",
        backgroundColor: theme.palette.action.focus,
        "& .changed": {
            backgroundColor: theme.palette.type === "light" ?
                theme.palette.primary.light :
                theme.palette.primary.dark
        },
        "& .refrehButton": {
            visibility: "hidden",
        },
        "&:hover .refrehButton": {
            visibility: "visible",
        },
    },
    icon: {
        fontSize: "1.0rem",
    },
    error: {
        backgroundColor: theme.palette.type === "light" ?
            theme.palette.error.light :
            theme.palette.error.dark,
    }
}))


const DecToHex = (value) => {
    return `0x${parseInt(value).toString(16).toUpperCase()}`
}

const FORCE = 1

const FieldDecoder = forwardRef((
    { onChange, defaultValue, inputRef, bits, id, reset, autoUpdate }, ref) => {
    console.log('123')
    const bitWidth = useMemo(() => {
        if (bits === ENCODER) return 32
        return [...RegValue.iterEachBit(bits)].length
    }, [bits])

    const classes = useDecoderStyles()
    const [format, setFormat] = useState(HEX)
    const [error, setError] = useState(false)
    const PreviousFormat = useRef(format)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debounceOnChange = useCallback(debounce(onChange, 200), [onChange])
    const isHex = format === HEX
    const handleChange = (e, force = 0) => {

        let value = e.target.value.toUpperCase()
        let test = parseInt(value, isHex ? 16 : 10)
        if (isNaN(test)) {
            setError(true)
        } else if (test.toString(2).length > bitWidth) {
            setError(true)
        }
        else {
            setError(false)
        }
        if (autoUpdate) debounceOnChange(force, id, value, bits)
    }

    useEffect(() => {
        // avoid race condition
        // if onChange invoke in the "formtOnClick",
        // there will be a race condition between setFormat and handleChange
        // So, here use "useEffect" to guarantee fomat has changed
        // then trigger handleChange
        if (PreviousFormat.current !== format)
            onChange(FORCE, id, undefined, bits, format)
    }, [format, id, bits, onChange])

    const formatOnClick = () => {
        PreviousFormat.current = format
        let nexFomrat = isHex ? DECIMAL : HEX
        setFormat(nexFomrat)
    }

    const handleKeyDown = (e) => {
        if (e.keyCode === 13) {
            // enter key
            onChange(0, id, e.target.value, bits, format)
        }
        if (e.ctrlKey && e.key === 'a') {
            // increment by 1
            e.preventDefault()
            let value = parseInt(e.target.value, isHex ? 16 : 10) + 1
            if (isNaN(value)) value = 0
            value = isHex ? DecToHex(value) : value.toString()
            onChange(FORCE, id, value, bits, format)
        }
        if (e.ctrlKey && e.key === 'x') {
            // decrement by 1
            e.preventDefault()
            let value = parseInt(e.target.value, isHex ? 16 : 10) - 1
            if (value < 0) { value = (2 ** bitWidth) - 1 }
            if (isNaN(value)) value = 0
            value = isHex ? DecToHex(value) : value.toString()
            onChange(FORCE, id, value, bits, format)
        }
    }

    const handleRest = () => {
        onChange(FORCE, id, reset, bits, format)
    }

    return (
        <span
            ref={ref}
            className={classes.decoderRoot}>
            <InputBase
                error={error}
                inputRef={inputRef}
                defaultValue={defaultValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className={classes.decoder}
                inputProps={{
                    format,
                }}
                classes={{
                    error: classes.error
                }}
                startAdornment={
                    <InputAdornment position="start"
                    >
                        <IconButton
                            className="refrehButton"
                            size="small"
                            onClick={handleRest}
                        >
                            <RefreshIcon
                                size="small"
                                className={classes.icon}
                            />
                        </IconButton>
                    </InputAdornment>
                }
                endAdornment={
                    <InputAdornment position="end">
                        <IconButton
                            size="small"
                            onClick={formatOnClick}
                            className={classes.icon}
                        >
                            {format}
                        </IconButton>
                    </InputAdornment>
                }
            />
        </span>
    )
})


const FieldTableRow = ({ regID, parent, field, children }) => {
    let isValidName = !RESERVED.test(field[NAME])

    return (
        <TableRow>
            {headers.map((header) => (
                <TableCell key={header}>
                    {
                        header === NAME && isValidName ?
                            <Link
                                onClick={
                                    () => scrollToID(
                                        parent,
                                        `${regID}-${field[NAME]}-${field[BITS]}-desc`,
                                        { block: "center" }
                                    )
                                }
                            >
                                <Highlighter text={field[header]} />
                            </Link> :
                            `${field[header]}`
                    }
                </TableCell>)
            )}
            {children}
        </TableRow>
    )
}

const FieldTable = ({ parent, fields, bitWidth }) => {
    let id = `${parent.id}-${createID()}`
    const [forceUpdate, setForceUpdate] = useState(0)
    const [autoUpdate, setAutoUpdate] = useState(true)
    const decoderRef = useRef({ [id]: [], })
    const regValueRef = useRef({
        [id]: new RegValue(bitWidth ?? 32, fields)
    })
    const onChange = useCallback((force, id, value, key, format) => {
        if (value !== undefined && typeof value !== "string") {
            throw Error(
                `expecting value is a string type, got ${typeof value}(${value}) instead`
            )
        }
        if (value && value.toLowerCase() === "0x") {
            value += "0"
        }
        const ref = decoderRef.current[id]
        const valueFormat = format || ref[key].attributes.format.value;
        const regValue = regValueRef.current[id]
        if (key === ENCODER) {
            // the encoder update
            regValue.setValue(value, valueFormat)
            value = regValue.getValue(valueFormat)
            if (force) {
                // ref[ENCODER].value = value
                // https://stackoverflow.com/questions/16195644/in-chrome-undo-does-not-work-properly-for-input-element-after-contents-changed-p
                let tmp = ref[ENCODER].value
                ref[ENCODER].selectionStart = 0
                ref[ENCODER].selectionEnd = tmp.length
                ref[ENCODER].focus()
                // this will trigger onChange event from the input
                document.execCommand("insertText", false, value)
            } else {
                // ref[ENCODER].value = value
                // console.log(value)
                // when encoder updated, all decoders must update too
                for (const bits in ref) {
                    if (Object.hasOwnProperty.call(ref, bits)) {
                        if (bits === ENCODER) continue
                        ref[bits].parentElement.classList.remove("changed")
                        let fieldFormat = ref[bits].attributes.format.value;
                        const isHex = fieldFormat === HEX
                        let oldValue = parseInt(ref[bits].value, isHex ? 16 : 10)
                        ref[bits].value = regValue.getValueByBits(bits, fieldFormat)
                        if (oldValue !== parseInt(ref[bits].value, isHex ? 16 : 10)) {
                            if (!force) ref[bits].parentElement.classList.add("changed")
                        }
                    }
                }
            }
        } else {
            // one of decoders update
            let bits = key
            regValue.setValueByBits(bits, value, valueFormat)
            if (force) {
                value = regValue.getValueByBits(bits, valueFormat)

                let tmp = ref[key].value
                ref[key].selectionStart = 0
                ref[key].selectionEnd = tmp.length
                ref[key].focus()
                document.execCommand("insertText", false, value)
            }
            // when decoder update, the encoder must update too
            let encoderFormat = ref[ENCODER].attributes.format.value;
            ref[ENCODER].value = regValue.getValue(encoderFormat)
        }
    }, [])

    const Encoders = () => {
        return Object.keys(decoderRef.current).map((id) => (
            <TableCell
                key={id.toString()} >
                <FieldDecoder
                    inputRef={el => decoderRef.current[id][ENCODER] = el}
                    defaultValue={regValueRef.current[id].getValue()}
                    onChange={onChange}
                    bits={ENCODER}
                    id={id}
                    autoUpdate={autoUpdate}
                    reset={regValueRef.current[id].getDefaultValue()}
                />
            </TableCell >
        ))
    }

    const Decoders = ({ field }) => {
        return Object.keys(decoderRef.current).map((id) => (
            <TableCell
                key={`${id}-${field[BITS]}-${field[NAME]}`}
            >
                <FieldDecoder
                    inputRef={el => decoderRef.current[id][field[BITS]] = el}
                    defaultValue={regValueRef.current[id].getValueByBits(field[BITS])}
                    onChange={onChange}
                    bits={field[BITS]}
                    id={id}
                    autoUpdate={autoUpdate}
                    reset={DecToHex(parseInt(field[RESET]))}
                />
            </TableCell>
        ))
    }
    const addDecoder = (e) => {
        if (e.detail > 1) return
        let id = `${parent.id}-${createID()}`
        regValueRef.current[id] = new RegValue(bitWidth ?? 32, fields)
        decoderRef.current[id] = []
        setForceUpdate(forceUpdate + 1)
    }

    return (
        <>
            <Box display="flex" justifyContent="flex-end">
                {/* <Tooltip
                    placement="top"
                    title={`Auto Update`}> */}
                <IconButton size="small"
                    disableRipple
                    disableFocusRipple
                    disableTouchRipple
                    onClick={() => setAutoUpdate(!autoUpdate)}
                    style={{ opacity: autoUpdate ? 1 : 0.3 }}>
                    <AutorenewIcon />
                </IconButton>
                {/* </Tooltip> */}
                <IconButton size="small"
                    disableRipple
                    disableFocusRipple
                    disableTouchRipple
                    onClick={addDecoder}
                >
                    <AddBoxIcon />
                </IconButton>
            </Box>
            <TableContainer component={Paper} style={{ maxHeight: "450px" }}>
                <Table
                    aria-label="simple table" size="small"
                    padding="normal"
                    stickyHeader={true}
                >
                    <TableHead>
                        <TableRow>
                            {headers.map((header) => (
                                <TableCell key={header}>{header}</TableCell>)
                            )}
                            <Encoders />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {fields.map((field) => (
                            <FieldTableRow
                                regID={parent.id}
                                parent={parent}
                                key={field[BITS]} field={field}
                            >
                                <Decoders field={field} />
                            </FieldTableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer >
        </>
    )
}


const FieldView = ({ parent, fields, bitWidth }) => {
    if (!fields) return null
    return (
        <Box>
            <FieldTable parent={parent} fields={fields} bitWidth={bitWidth} />
            <FieldsDesc regID={parent.id} fields={fields} />
        </Box>
    )
}

export default memo(FieldView)