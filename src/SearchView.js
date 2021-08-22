import { FixedSizeTree as Tree } from 'react-vtree';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import IconButton from '@material-ui/core/IconButton';
import InputBase from '@material-ui/core/InputBase';
import InputAdornment from '@material-ui/core/InputAdornment';
import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import { memo, useCallback, useMemo, useState } from 'react';
import { useHighlight } from './HighlightContext';
import { debounce, NAME, DESC, createID, FIEDLS, Highlighter, BITS, RESERVED } from './utils';
import AutoSizer from 'react-virtualized-auto-sizer';
import FontDownloadOutlinedIcon from '@material-ui/icons/FontDownloadOutlined';
import FontDownloadIcon from '@material-ui/icons/FontDownload';
import { RootSelector } from "./RootSelector"
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
var escapeRegExp = require('lodash.escaperegexp');


const useSearchStyles = makeStyles(theme => ({
    search: {
        backgroundColor: theme.palette.action.focus,
        paddingLeft: "2ch",
        marginTop: "0.5rem",
    }
}));

const useNodeStyles = makeStyles(theme => ({
    nodeRoot: {
        display: 'flex',
        alignItems: 'center',
        cursor: "pointer",
        "&:hover": {
            backgroundColor: theme.palette.action.hover
        }
    },
    node: {
        display: "inline-block",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        marginRight: "1rem"
    }
}));


// var tree;
var onClick;

const fieldIndexes = [
    NAME,
    DESC,
]

const regIndexes = [
    "name",
    'address',
    // "fields",
]


// Source: https://github.com/Lodin/react-vtree
function* _treeWalker(tree, refresh) {
    if (!tree) return
    const stack = [];

    for (const node of tree) {

        // Remember all the necessary data of the first node in the stack.
        stack.push({
            nestingLevel: 0,
            node: node,
        });

        // Walk through the tree until we have no nodes available.
        while (stack.length !== 0) {
            const {
                node: { matches = [], id, ...other },
                nestingLevel,
            } = stack.pop();

            const children = matches

            // Here we are sending the information about the node to the Tree component
            // and receive an information about the openness state from it. The
            // `refresh` parameter tells us if the full update of the tree is requested;
            // basing on it we decide to return the full node data or only the node
            // id to update the nodes order.

            let node = {
                id: id.toString(),
                isLeaf: children.length === 0,
                isOpenByDefault: nestingLevel < 3,
                nestingLevel,
                ...other,
                children: children,
            }

            const isOpened = yield refresh
                ? node :
                id.toString()

            // Basing on the node openness state we are deciding if we need to render
            // the child nodes (if they exist).
            if (children.length !== 0 && isOpened === true) {
                // Since it is a stack structure, we need to put nodes we want to render
                // first to the end of the stack.

                for (let i = children.length - 1; i >= 0; i--) {
                    stack.push({
                        nestingLevel: nestingLevel + 1,
                        node: children[i],
                    });
                }
            }
        }
    }
}


// Node component receives all the data we created in the `treeWalker` +
// internal openness state (`isOpen`), function to change internal openness
// state (`toggle`) and `style` parameter that should be added to the root div.

const expandIconSize = 30

const Node = ({ data: { isLeaf, nestingLevel, ...node }, isOpen, style, toggle }) => {
    const { highlight, caseSensitive } = useHighlight()
    const classes = useNodeStyles();
    const toggleCB = (e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(e)
    }
    return (
        <div
            className={classes.nodeRoot}
            style={{
                ...style,
                // paddingLeft: nestingLevel * expandIconSize + (isLeaf ? expandIconSize : 0),
                paddingLeft: (isLeaf + nestingLevel) * expandIconSize,
            }}
            onClick={(e) => onClick(e, node.ptr, node.fieldID)}
        >
            {!isLeaf && (
                <IconButton onClick={toggleCB} size="small">
                    {!isOpen ? <ChevronRightIcon /> : <ExpandMoreIcon />}
                </IconButton>
            )}
            {/* <div>{name}</div> */}
            <div className={classes.node} >
                <Highlighter text={node.text} highlight={highlight} caseSensitive={caseSensitive} />
            </div>
        </div >
    )
};

function* iterLeaf(node, query, showParent = true, parent = null) {
    node.parent = parent

    if (node.hasOwnProperty("children")) {
        for (const child of node.children) {
            yield* iterLeaf(child, query, showParent, node)
        }
    } else {
        let matches = []
        if (node.hasOwnProperty(FIEDLS)) {
            for (const field of node[FIEDLS]) {
                if (RESERVED.test(field[NAME])) continue
                for (const index of fieldIndexes) {
                    let value = field[index]
                    if (query.test(value)) {
                        matches.push({
                            text: value,
                            id: `${node.id}_${createID()}`,
                            ptr: node,
                            fieldID: `${node.id}-${field[NAME]}-${field[BITS]}-desc`
                        })
                    }
                }
            }

        }

        let parent_name = showParent && parent ? `${parent.name} / ` : ""

        if (matches.length) {
            yield {
                id: node.id,
                text: `${parent_name}${node['name']}`,
                matches,
                ptr: node,
            }
        } else {
            for (const index of regIndexes) {
                if (query.test(node[index])) {
                    yield {
                        id: `reg_${node.id}`,
                        ptr: node,
                        text: `${parent_name}${node[index]}`,
                    }
                }
            }
        }

        // yield node
    }
}

// const outerElementType = forwardRef((props, ref) => {
//     const onClick = (e) => {
//     }
//     return <div ref={ref} onClick={onClick} nice="123" {...props} />
// });


const SearchInput = (props) => {
    const classes = useSearchStyles()
    const {
        // highlight,
        setHighlight,
        caseSensitive,
        setCaseSensitive
    } = useHighlight()

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const setSearchText = useCallback(debounce(setHighlight, 400), [])
    return (
        <InputBase
            fullWidth
            className={classes.search}
            onChange={(e) => setSearchText(e.target.value)}
            id="search" placeholder="Search"
            endAdornment={
                <InputAdornment position="end">
                    <IconButton
                        size="small"
                        onClick={() => setCaseSensitive(!caseSensitive)}
                    >
                        {caseSensitive ?
                            <FontDownloadIcon /> :
                            <FontDownloadOutlinedIcon />
                        }
                    </IconButton>
                </InputAdornment>
            }
        />
    )
}

const useStyles = makeStyles(theme => ({
    searchGroup: {
        margin: "0 1rem"
    },
}));

const SearchView = (props) => {
    const classes = useStyles()

    const [showParent, setShowParent] = useState(true)
    const { highlight, caseSensitive } = useHighlight()
    const { tree, parents, handleChange } = props

    const nodes = useMemo(() => {
        // TODO: imporve this with previous state(useRef)
        if (!highlight) return []
        const option = caseSensitive ? "" : "i"
        const query = new RegExp(escapeRegExp(highlight), option)
        return [...iterLeaf(tree, query, showParent)]
    }, [highlight, caseSensitive, tree, showParent])

    const treeWalker = useCallback(function* treeWalkerWrapper(refresh) {
        if (!highlight) return
        yield* _treeWalker(nodes, refresh)
    }, [highlight, nodes])

    const handleCheckBoxChange = (e) => {
        setShowParent(!showParent)
    }

    onClick = props.onClick

    return (

        <AutoSizer disableWidth>
            {({ height }) => <Box mt={1}>
                <Box className={classes.searchGroup}>
                    <RootSelector value={tree} options={parents} handleChange={handleChange} />
                    <SearchInput />
                    <FormControlLabel
                        control={<Checkbox color="primary"
                            value={showParent}
                            checked={showParent}
                            size="small"
                            onChange={handleCheckBoxChange} />}
                        label="show parent"
                        labelPlacement="end"
                    />
                </Box>
                <Tree
                    treeWalker={treeWalker}
                    itemSize={expandIconSize + 2}
                    height={height - 150}
                // outerElementType={outerElementType}
                >
                    {Node}
                </Tree>
            </Box >}
        </AutoSizer>
    )
};

export default memo(SearchView)
// export default SearchView