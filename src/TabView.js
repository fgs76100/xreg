import { memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
// import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Close from '@material-ui/icons/Close';
import Button from '@material-ui/core/Button';
import { useTab } from './TabContext';
import RegView from './RegView';
import { joinHier, scrollTo, setHistoryState } from './utils';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`scrollable-auto-tabpanel-${index}`}
      aria-labelledby={`scrollable-auto-tab-${index}`}
      {...other}
    >
      <Box p={3}>
        {children}
      </Box>
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

// function a11yProps(index) {
//   return {
//     id: `scrollable-auto-tab-${index}`,
//     'aria-controls': `scrollable-auto-tabpanel-${index}`,
//   };
// }


const useTabStyles = makeStyles((theme) => ({
  tab: {
    minWidth: "5ch",
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  tabLabel: {
    '&:hover': {
      backgroundColor: "transparent",
    },
    display: "inline-flex",
    justifyContent: "flex-start",
  },
  wrapper: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  closeButton: {
    '&:hover': {
      color: theme.palette.secondary.main,
    },
  },
}));

const RemoveableTab = ({ label, onDelete, value, ...rest }) => {
  const classes = useTabStyles();
  return (
    <Tab
      className={classes.tab}
      {...rest}
      value={value}
      component="span"
      disableRipple
      starticon={<Close />}
      classes={{
        wrapper: classes.wrapper
      }}
      label={
        <Button
          disableElevation
          disableRipple
          className={classes.tabLabel}
          startIcon={
            <Close
              size="small"
              className={classes.closeButton}
              onClick={(e) => (onDelete(e, value))}
            />}
        >
          {label}
        </Button>
      }
    />

  )
}

const useStyles = makeStyles((theme) => ({
  root: {
    // flexGrow: 1,
    // backgroundColor: theme.palette.background.paper,
  },
  tabbars: {
    backgroundColor: theme.palette.background.paper,
    ...theme.mixins.toolbar
  },

}))




const TabView = (props) => {
  const classes = useStyles();
  const { tabState, dispatch } = useTab();

  let nodes = tabState.openedTabs
  let currentTabID = tabState.currentTabID

  const handleChange = (event, newValue) => {
    const node = nodes.find(node => node.id === newValue)
    dispatch({ type: "setCurrentTab", payload: { tab: node } })
    if (currentTabID !== node.id) {
      setHistoryState(node)
    }
  };

  const onDelete = (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch({ type: "removeOpenedTab", payload: { id: id } })
  }

  window.onpopstate = (e) => {
    if (e.state) {
      const type = e.state.type
      if (type === "tab") {
        dispatch({
          type: "addOpenedTab",
          payload: { tab: e.state.node, target: e.state.id }
        })
      }
      else {
        throw Error("...")
      }
    }
  }

  useEffect(() => {
    if (tabState.target) {
      scrollTo(tabState.currentTab, tabState.target, { block: "center" })
    }
    else if (tabState.currentTab) {
      const regID = joinHier(tabState.currentTab)
      let el = document.getElementById(regID)
      if (el) el.scrollIntoView({ block: 'center' })
    }
  }, [tabState])

  return (
    <div className={classes.root}
    >
      <AppBar position="sticky" color="default"
        className={classes.tabbars}
      >
        <Tabs
          value={currentTabID}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="desktop"
          aria-label="scrollable auto tabs example"
        >
          {
            nodes.map((node) => (
              <RemoveableTab
                key={`${node.id}`}
                label={node.name}
                value={node.id}
                onDelete={onDelete} />
            ))
          }
        </Tabs>
      </AppBar>
      {
        nodes.map((node) => (
          <TabPanel key={`${node.id}`} value={currentTabID} index={node.id}>
            <RegView {...node} />
          </TabPanel>
        ))
      }
    </div >
  );
}

export default memo(TabView);