import Divider from '@material-ui/core/Divider';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import FieldView from "./FieldView"
import { useHighlight } from './HighlightContext';
import { joinHier, Highlighter } from './utils';
import { memo } from 'react';

const RegHeader = ({ node }) => {
    const { highlight, caseSensitive } = useHighlight()
    return (
        <>
            <Box mb={3}>
                <Typography variant="h4" id={joinHier(node)}>

                    <Highlighter
                        highlight={highlight}

                        caseSensitive={caseSensitive}
                        text={
                            `${node.name}`
                        } />
                </Typography>
                <Divider />
            </Box>
            <Box mb={2}>
                <Typography variant="body1" gutterBottom>
                    <Highlighter
                        highlight={highlight}

                        caseSensitive={caseSensitive}
                        text={
                            `Hierarchy: ${joinHier(node)}`
                        } />
                </Typography>
                <Typography variant="body1" gutterBottom>
                    <Highlighter
                        highlight={highlight}

                        caseSensitive={caseSensitive}
                        text={
                            `Address : ${node.address}`
                        } />
                </Typography>
            </Box>
        </>
    )
}

const RegView = (node) => {

    return <Box>
        <RegHeader node={node}></RegHeader>
        <FieldView parent={node} fields={node.fields} bitWidth={32}></FieldView>
    </Box>
}

export default memo(RegView)