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
import InputAdornment from '@material-ui/core/InputAdornment';
import { memo, useCallback, useRef, useState, forwardRef } from "react";
import {
    debounce, scrollTo, BITS, RESET, RegValue, HEX, DECIMAL,
    NAME, DESC, ACCESS, Highlighter, RESERVED, createID
} from './utils';
import { useHighlight } from "./HighlightContext";
// import Tooltip from '@material-ui/core/Tooltip';
import AddBoxIcon from '@material-ui/icons/AddBox';

const ENCODER = "-1"

const headers = [
    BITS,
    NAME,
    // ACCESS,
    // RESET,
]

const useAnchorStyles = makeStyles((theme) => ({
    anchor: {
        "&:target": {
            backgroundColor: theme.palette.action.focus,
        },
    },
}))

const FieldsDesc = memo(({ regID, fields }) => {
    const { highlight, caseSensitive } = useHighlight()
    const classes = useAnchorStyles()
    const FieldDesc = ({ field }) => (
        !RESERVED.test(field[NAME]) &&
        <Box mt={3} className={classes.desc} >
            <Typography
                variant="h5"
                id={`${regID}-${field[NAME]}-${field[BITS]}-desc`}
                className={classes.anchor}
                gutterBottom
            >
                <Highlighter
                    caseSensitive={caseSensitive}
                    text={`[${field[BITS]}] ${field[NAME]}`} highlight={highlight} />
            </Typography>
            <Typography variant="body1" gutterBottom
                color="textSecondary"
            >
                Access: {field[ACCESS]}, Default: {field[RESET]}
                {/* <Highlighter text={
                    `Access: ${field[ACCESS]}, Default: ${field[RESET]}`
                } highlight={highlight} /> */}
            </Typography>
            {field[DESC] && <Box
                fontSize="body1.fontSize"
                whiteSpace="pre-wrap"
            >
                <Highlighter
                    caseSensitive={caseSensitive}
                    text={field[DESC]} highlight={highlight} />
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
        width: "20ch",
        flexWrap: "nowrap",
        backgroundColor: theme.palette.action.focus,
    },
    refreshIcon: {
        fontSize: "1.0rem",
    },
}))


const FieldDecoder = forwardRef((props, ref) => {
    const { onChange, defaultValue, inputRef, bits, id } = props
    const classes = useDecoderStyles()
    const [format, setFormat] = useState(HEX)
    const [showTool, setShowTool] = useState(false)

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debounceOnChange = useCallback(debounce(onChange, 400), [onChange])

    const isHex = format === HEX
    const formatOnClick = () => {
        let nexFomrat = isHex ? DECIMAL : HEX
        setFormat(nexFomrat)
        onChange(id, undefined, bits, nexFomrat)
    }
    const handleKeyDown = (e) => {
        if (e.ctrlKey && e.key === 'a') {
            // increment by 1
            e.preventDefault()
            let value = parseInt(e.target.value, isHex ? 16 : 10) + 1
            value = value.toString(isHex ? 16 : 10)
            onChange(id, value, bits, format)
        }
        if (e.ctrlKey && e.key === 'x') {
            // decrement by 1
            e.preventDefault()
            let value = parseInt(e.target.value, isHex ? 16 : 10) - 1
            value = value.toString(isHex ? 16 : 10)
            onChange(id, value, bits, format)
        }
    }
    return (
        <span
            ref={ref}
            onMouseEnter={() => setShowTool(true)}
            onMouseLeave={() => setShowTool(false)}
            className={classes.decoderRoot}>
            <InputBase
                inputRef={inputRef}
                defaultValue={defaultValue}
                onChange={(e) => debounceOnChange(id, e.target.value, bits)}
                onKeyDown={handleKeyDown}
                className={classes.decoder}
                inputProps={{
                    format,
                }}
                // placeholder="Decoder"
                startAdornment={
                    <InputAdornment position="start"
                    >
                        <IconButton
                            style={{ visibility: showTool ? "visible" : "hidden" }}
                            size="small"
                            onClick={() => onChange(id, defaultValue, bits)}
                        >
                            <RefreshIcon
                                size="small"
                                className={classes.refreshIcon}
                            />
                        </IconButton>
                    </InputAdornment>
                }
                endAdornment={
                    <InputAdornment position="end">
                        <IconButton
                            size="small"
                            onClick={formatOnClick}
                            className={classes.refreshIcon}
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
    const { highlight, caseSensitive } = useHighlight()
    let isValidName = !RESERVED.test(field[NAME])
    return (
        <TableRow>
            {headers.map((header) => (
                <TableCell key={header}>
                    {
                        header === NAME && isValidName ?
                            <Link
                                onClick={
                                    () => scrollTo(
                                        parent,
                                        `${regID}-${field[NAME]}-${field[BITS]}-desc`,
                                        { block: "center" }
                                    )
                                }
                            >
                                <Highlighter
                                    caseSensitive={caseSensitive}
                                    text={field[header]} highlight={highlight} />
                            </Link> :
                            `${field[header]}`
                    }
                </TableCell>)
            )}
            {children}
        </TableRow>
    )
}

const FieldTable = ({ Head, Cell, parent, fields }) => {
    return (
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
                        {Head?.()}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {fields.map((field) => (
                        <FieldTableRow
                            regID={parent.id}
                            parent={parent}
                            key={field[BITS]} field={field}
                        >
                            {Cell?.(field)}
                        </FieldTableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer >
    )
}


const FieldView = ({ parent, fields, bitWidth }) => {
    let id = `${parent.id}-${createID()}`
    const decoderRef = useRef({ [id]: [], })
    const regValueRef = useRef({
        [id]: new RegValue(bitWidth ?? 32, fields)
    })

    const onChange = useCallback((id, value, key, format) => {
        if (value !== undefined && typeof value !== "string") {
            throw Error(
                `expecting value is a string type, got ${typeof value}(${value}) instead`
            )
        }
        const ref = decoderRef.current[id]
        const valueFormat = format || ref[key].attributes.format.value;
        const regValue = regValueRef.current[id]
        if (key === ENCODER) {
            // the encoder update
            regValue.setValue(value, valueFormat)
            ref[ENCODER].value = regValue.getValue(valueFormat)
            // when encoder updated, all decoders must update too
            for (const bits in ref) {
                if (Object.hasOwnProperty.call(ref, bits)) {
                    if (bits === ENCODER) continue
                    let fieldFormat = ref[bits].attributes.format.value;
                    ref[bits].value = regValue.getValueByBits(bits, fieldFormat)
                }
            }
        } else {
            // one of decoders update
            let bits = key
            regValue.setValueByBits(bits, value, valueFormat)
            ref[key].value = regValue.getValueByBits(bits, valueFormat)
            // when decoder update, the encoder must update too
            let encoderFormat = ref[ENCODER].attributes.format.value;
            ref[ENCODER].value = regValue.getValue(encoderFormat)
        }
    }, [])

    const [forceUpdate, setForceUpdate] = useState(0)

    if (!fields) return null

    const Heads = () => {
        return Object.keys(decoderRef.current).map((id) => (
            <TableCell
                key={id.toString()} >
                <FieldDecoder
                    inputRef={el => decoderRef.current[id][ENCODER] = el}
                    defaultValue={regValueRef.current[id].getDefaultValue()}
                    onChange={onChange}
                    bits={ENCODER}
                    id={id}
                />
            </TableCell >
        ))
    }

    const Cells = (field) => {
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
        <Box>
            <Box display="flex" justifyContent="flex-end">
                <IconButton size="small" color="primary"
                    onClick={addDecoder}
                >
                    <AddBoxIcon />
                </IconButton>
            </Box>
            <FieldTable Head={Heads} Cell={Cells} parent={parent} fields={fields} />
            <FieldsDesc regID={parent.id} fields={fields} />
        </Box>
    )
}

export default memo(FieldView)