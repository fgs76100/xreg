// import Drawer from '@material-ui/core/Drawer';
// import TreeIcon from '@material-ui/icons/AccountTree';
import AccountTreeOutlinedIcon from '@material-ui/icons/AccountTreeOutlined';
import SearchIcon from '@material-ui/icons/Search';
import { makeStyles } from '@material-ui/core/styles';
import HierarchyView from './HierarchyView';
import { useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import Tabs from '@material-ui/core/Tabs';
import Box from '@material-ui/core/Box';
import Tab from '@material-ui/core/Tab';
import SearchView from './SearchView';
import { useTab } from './TabContext';
import { iterGetParents } from './utils';


function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <Box
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            {...other}
        >
            {/* <Box > */}
            {children}
            {/* </Box> */}
        </Box>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
};


const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        display: 'flex',
        height: "100%",
    },
    tabs: {
        minWidth: "3rem",
        MaxWidth: "3rem",
        // backgroundColor: theme.palette.background.pape
    },
    tab: {
        minWidth: "3rem",
        MaxWidth: "3rem",
    },
    tabPanel: {
        flexGrow: 1,
    },
    // toolbar: theme.mixins.toolbar,
    content: {
        width: "100%",
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1
    },
    dragger: {
        width: "5px",
        cursor: "col-resize",
        padding: "4px 0 0",
        position: "absolute",
        top: 0,
        right: -5,
        bottom: 0,
        zIndex: 100,
        // backgroundColor: "transparent",
        '&:hover': {
            background: theme.palette.action.active
        },
        '&:active': {
            background: theme.palette.action.active
        },
    },
    indicator: {
        left: "0px",
        width: "4px",
    },
}));


const defaultDrawerWidth = 300;
const minDrawerWidth = 50;
const maxDrawerWidth = 1000;

export default function Sidebar(props) {
    const { tree = {}, ...others } = props
    const classes = useStyles();
    const [value, setValue] = useState(0);
    const { dispatch } = useTab();
    const [treeRoot, setTreeRoot] = useState(tree)
    const [showContent, setShowContent] = useState(true)

    useEffect(() => {
        setTreeRoot(tree)
    }, [tree])

    const [drawerWidth, setDrawerWidth] = useState(defaultDrawerWidth);

    const handleMouseMove = (e) => {
        const newWidth = e.clientX - document.body.offsetLeft;
        if (newWidth > minDrawerWidth && newWidth < maxDrawerWidth) {
            setDrawerWidth(newWidth);
        }
        if (newWidth < 200) {
            setDrawerWidth(minDrawerWidth);
            setShowContent(false)
        } else {
            setShowContent(true)
        }
    };

    const handleMouseDown = e => {
        e.stopPropagation();
        e.preventDefault();
        document.addEventListener("mouseup", handleMouseUp, true);
        document.addEventListener("mousemove", handleMouseMove, true);
    };

    const handleMouseUp = () => {
        document.removeEventListener("mouseup", handleMouseUp, true);
        document.removeEventListener("mousemove", handleMouseMove, true);
    };

    const handleChange = (event, newValue) => {
        if (!showContent) {
            setDrawerWidth(defaultDrawerWidth)
            setShowContent(true)
        }
        setValue(newValue);
    };

    others.onClick = useCallback((e, node, fieldID = null) => {
        e.preventDefault()
        // node.fieldID = fieldID
        dispatch({
            type: 'addOpenedTab',
            payload: { tab: node, setHistory: true, target: fieldID }
        })
    }, [dispatch])

    const changeTreeRoot = useCallback((e, value) => {
        setTreeRoot(value || tree)
    }, [tree])

    const parents = useMemo(() => [...iterGetParents(tree)], [tree])

    useEffect(() => {
        let pathname = window.location.pathname
        if (pathname.startsWith(`/${treeRoot.name}`)) {
            const target = window.location.hash.replace("#", "")
            const scopes = pathname.split("/")
            let nodes = [treeRoot]
            let node = null
            for (const scope of scopes) {
                if (scope !== "") {
                    node = nodes.find(item => item.name === scope)
                    if (!node) break
                    nodes = node.children
                }
            }
            if (node) {
                dispatch({
                    type: 'addOpenedTab',
                    payload: { tab: node, setHistory: false, target }
                })
            }
        }
    },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [])

    return (
        <div className={classes.root} style={{ width: drawerWidth }}>
            <Tabs
                orientation="vertical"
                variant="scrollable"
                value={value}
                onChange={handleChange}
                aria-label="Vertical tabs example"
                className={classes.tabs}
                classes={{
                    indicator: classes.indicator
                }}
            >
                <Tab className={classes.tab} icon={<AccountTreeOutlinedIcon />} />
                <Tab className={classes.tab} icon={<SearchIcon />} />
            </Tabs>
            <div className={classes.content}
                style={{ visibility: showContent ? "visible" : "hidden" }}
            >
                <TabPanel value={value} index={0} className={classes.tabPanel}>
                    <HierarchyView
                        parents={parents}
                        tree={treeRoot} handleChange={changeTreeRoot}  {...others} />
                </TabPanel>
                <TabPanel value={value} index={1} className={classes.tabPanel}>
                    <SearchView
                        parents={parents} handleChange={changeTreeRoot}
                        tree={treeRoot} {...others}></SearchView>
                </TabPanel>
            </div>
            <div onMouseDown={e => handleMouseDown(e)} className={classes.dragger} />
        </div>
    );
}
