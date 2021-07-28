import { FixedSizeTree as Tree } from 'react-vtree';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';
import { memo, useCallback, useRef } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import RestoreIcon from '@material-ui/icons/Restore';
import { RootSelector } from "./RootSelector"


const useStyles = makeStyles(theme => ({
    nodeRoot: {
        display: 'flex',
        alignItems: 'center',
        cursor: "pointer",
        "&:hover": {
            backgroundColor: theme.palette.action.hover
        }
    },
    node: {
        fontSize: theme.typography.fontSize,
        display: "inline-block",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textAlign: "left",
        textOverflow: "ellipsis",
    },
}));


// var tree;
// var onDoubleClick;
var onClick;

// Source: https://github.com/Lodin/react-vtree
function* _treeWalker(root, refresh) {
    if (!root) return
    const stack = [];

    // Remember all the necessary data of the first node in the stack.
    stack.push({
        nestingLevel: 0,
        node: root,
        parent: null,
    });

    // Walk through the tree until we have no nodes available.
    while (stack.length !== 0) {
        const {
            node: { children = [], id, ...other },
            parent,
            nestingLevel,
        } = stack.pop();

        // Here we are sending the information about the node to the Tree component
        // and receive an information about the openness state from it. The
        // `refresh` parameter tells us if the full update of the tree is requested;
        // basing on it we decide to return the full node data or only the node
        // id to update the nodes order.

        let node = {
            ...other,
            id: id.toString(),
            isLeaf: children.length === 0,
            nestingLevel,
            children,
            parent,
            isOpenByDefault: nestingLevel < 1,
            // isOpenByDefault: nestingLevel < 2,
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
                    parent: node,
                });
            }
        }
    }
}

// Node component receives all the data we created in the `treeWalker` +
// internal openness state (`isOpen`), function to change internal openness
// state (`toggle`) and `style` parameter that should be added to the root div.

const expandIconSize = 30

const Node = ({ data: { isLeaf, nestingLevel, ...node }, isOpen, style, toggle }) => {
    const classes = useStyles();
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
                paddingLeft: (nestingLevel + isLeaf) * expandIconSize,
            }}
            onClick={(e) => isLeaf ? onClick(e, node) : toggleCB(e)}
        >
            {!isLeaf && (
                <IconButton onClick={toggleCB} size="small">
                    {!isOpen ? <ChevronRightIcon /> : <ExpandMoreIcon />}
                </IconButton>
            )}
            {/* <div>{name}</div> */}
            <span className={classes.node} > {node.name} </span>
        </div >
    )
};


const useHierStyles = makeStyles(theme => ({
    toolbarIcon: {
        display: 'flex',
        alignItems: 'center',
        // justifyContent: 'flex-end',
        paddingLeft: '4px',
        '& > *': {
            margin: theme.spacing(0.5),
        },
        ...theme.mixins.toolbar,
    },
}))

const UploadButton = ({ upload, ...other }) => (

    <>
        <input
            // accept="image/*"
            hidden
            id="uploadButton"
            type="file"
            onChange={upload}
        />
        <label htmlFor="uploadButton">
            <IconButton component="span" {...other}>
                <AttachFileIcon />
            </IconButton>
        </label>
    </>
)

const ControlBar = ({ options, treeRef, onUpload, handleChange, value }) => {
    const classes = useHierStyles()
    const handleClick = () => {
        treeRef.current.recomputeTree({
            useDefaultOpenness: true,
            refreshNodes: true,

        })
    }
    return (
        <div className={classes.toolbarIcon}>

            <RootSelector options={options} handleChange={handleChange} value={value} />
            <UploadButton upload={onUpload} size="small" />
            <IconButton onClick={handleClick} size="small">
                <RestoreIcon />
            </IconButton>
            {/* <IconButton size="small">
                <ChevronLeftIcon />
            </IconButton> */}
        </div>
    )
}

const HierarchyView = (
    { onUpload, tree, handleChange, parents, ...rest }
) => {
    const treeRef = useRef(null)
    const treeWalker = useCallback(function* (refresh) {
        yield* _treeWalker(tree, refresh)
    }, [tree])

    onClick = rest.onClick

    return (
        <AutoSizer disableWidth>
            {({ height }) => (
                <Box>
                    <ControlBar
                        treeRef={treeRef}
                        options={parents}
                        onUpload={onUpload}
                        handleChange={handleChange}
                        value={tree}
                    />
                    <Divider />
                    <Tree
                        treeWalker={treeWalker}
                        itemSize={expandIconSize + 2}
                        height={height - 80}
                        ref={treeRef}
                    >
                        {Node}
                    </Tree>
                </Box>

            )}
        </AutoSizer>

    )
};

export default memo(HierarchyView)
// export default HierarchyView
