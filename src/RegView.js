import Divider from '@material-ui/core/Divider';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import FieldView from "./FieldView"
import { joinHier } from './utils';
import Highlighter from "./Highlighter";
import { memo } from 'react';

const RegHeader = ({ node }) => {
    return (
        <>
            <Box mb={3}>
                <Typography variant="h4" id={joinHier(node)}>

                    <Highlighter
                        text={
                            `${node.name}`
                        } />
                </Typography>
                <Divider />
            </Box>
            <Box mb={2}>
                <Typography variant="body1" gutterBottom>
                    <Highlighter
                        text={
                            `Hierarchy: ${joinHier(node)}`
                        } />
                </Typography>
                <Typography variant="body1" gutterBottom>
                    <Highlighter
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