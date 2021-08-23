// import logo from './logo.svg';
// import './App.css';
import { makeStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Paper from '@material-ui/core/Paper';
import SideBar from './SideBar';
import TabView from './TabView';
import { useCallback, useState, useMemo } from 'react';
import data from "./data/data.json"
import ExcelReader from './FileHandler/ExcelReader';
import Fab from '@material-ui/core/Fab';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { setParent } from './utils';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import { green, red, } from '@material-ui/core/colors';

const useStyles = makeStyles(theme => ({
  // root: {
  // },
  toolbar: theme.mixins.toolbar,
  // container: {
  // },
  main: {
    display: "flex",
    height: "100vh",
    // overflow: "auto"
  },
  sideBar: {
    // width: defaultDrawerWidth,
    position: "relative",
    flexShrink: 0,  // so sidebar can be overflow the container
  },
  tabView: {
    marginLeft: "20px",
    flexGrow: 1,
    maxWidth: "960px",
    overflowY: "auto",
  },
  floatButton: {
    bottom: "50vh",
    position: 'fixed',
    transform: "translateX(-80%)",
  }
}));



const backToTop = () => {
  let el = document.getElementById("tabView")
  el.scrollTo(0, 0);
}

function App() {
  const classes = useStyles()
  // const [selected, setSelected] = useState([]);
  const [tree, setTree] = useState(setParent(data))
  const [hideFab, setHideFab] = useState(true)

  const handleUpload = useCallback((e) => {
    // return
    const file = e.target.files[0]
    if (!file) return

    const fileReader = new FileReader()
    const excelReader = new ExcelReader()

    fileReader.onload = e => {
      try {
        let root;
        if (file.type === "application/json") {
          root = JSON.parse(e.target.result)

        } else {
          root = excelReader.createTree(e.target.result, { type: 'binary' })
        }
        setTree(setParent(root))
      } catch (error) {
        alert("Error: failed to parse the excel")
      }
    }
    fileReader.readAsBinaryString(file)
  }, [setTree])

  const onScroll = useCallback((e) => {
    if (e.target.scrollTop > 200) setHideFab(false)
    else setHideFab(true)
  }, [])

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          type: prefersDarkMode ? 'dark' : 'light',
          primary: {
            main: prefersDarkMode ? green[200] : "#3f51b5"
            // main: prefersDarkMode ? "#f48fb1" : "#3f51b5" // nice too
          },
          secondary: {
            main: prefersDarkMode ? red['A100'] : "#f50057"
          }
        },
      }),
    [prefersDarkMode],
  );

  return (
    <ThemeProvider theme={theme}>

      <div className={classes.root}>
        <CssBaseline />
        <div className={classes.main}>
          <Paper className={classes.sideBar}>
            <SideBar tree={tree} onUpload={handleUpload}></SideBar>
          </Paper>
          <Paper className={classes.tabView} id="tabView" onScroll={onScroll}>
            <TabView></TabView>
            <div hidden={hideFab}>
              <Fab
                onClick={backToTop}
                className={classes.floatButton} size="medium" color="primary">
                <ExpandLessIcon />
              </Fab>
            </div>
          </Paper>
        </div >

      </div >

    </ThemeProvider>
  );
}

export default App;
