import React from 'react'
import { setHistoryState } from './utils';

const NO_SELECT = false;
const TabContext = React.createContext(null)


function tabReducer(state, action) {

    let index;
    let tab = action.payload.tab
    let target = action.payload.target
    switch (action.type) {
        case 'setCurrentTab':
            let nextTab = tab.id ?? NO_SELECT
            if (nextTab === state.currentTabID) return state
            return { ...state, currentTabID: nextTab, currentTab: tab, target };
        case 'addOpenedTab':
            tab.id = tab.id.toString()
            if (action.payload.setHistory && state.currentTabID !== tab.id) {
                setHistoryState(tab)
            }
            index = state.openedTabs.findIndex(item => item.id === tab.id)
            if (index > -1) {
                // if tab was already opened, just change it to current tab
                // state.openedTabs[index] = [...state.openedTabs]
                state.openedTabs[index] = tab
                return { ...state, currentTabID: tab.id, currentTab: tab, target }
            }
            return {
                target,
                currentTabID: tab.id,
                currentTab: tab,
                openedTabs: [...state.openedTabs, tab]
            }
        case 'removeOpenedTab':
            let id = action.payload.id.toString()
            index = state.openedTabs.findIndex(item => item.id === id)
            if (index > -1) {
                let openedTabs = state.openedTabs.filter(item => item.id !== id)

                let currentTabID;
                let currentTab;
                let target = undefined
                if (state.currentTabID === id) {
                    currentTabID = NO_SELECT;
                    currentTab = undefined;
                    window.history.pushState(null, "", "/");
                } else {
                    currentTabID = state.currentTabID;
                    currentTab = tab;
                }

                return { target, currentTabID, openedTabs, currentTab }
            }
            return state
        default:
            throw new Error(`Got unexpected action: '${action.type}'`);
    }
}

export const TabProvider = ({ children }) => {
    const [tabState, dispatch] = React.useReducer(tabReducer, {
        currentTabID: NO_SELECT,
        currentTab: undefined,
        openedTabs: [],
        target: undefined,
    })

    return (
        <TabContext.Provider value={{ tabState, dispatch }}>
            {children}
        </TabContext.Provider>

    )
}

export const useTab = () => React.useContext(TabContext)