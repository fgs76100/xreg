import InputBase from '@material-ui/core/InputBase';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { makeStyles } from '@material-ui/core/styles';

const useSearchStyles = makeStyles(theme => ({
    root: {
        backgroundColor: theme.palette.action.focus,
    },
}));

export const RootSelector = ({ options, handleChange, value }) => {
    const classes = useSearchStyles()
    return (
        <Autocomplete
            className={classes.root}
            size="small"
            id="root-selector"
            freeSolo
            value={value}
            autoHighlight
            options={options}
            getOptionLabel={(option) => option?.name}
            onChange={handleChange}
            renderInput={(params) => (
                <div ref={params.InputProps.ref}>
                    <InputBase
                        style={{
                            paddingLeft: "2ch",
                            paddingRight: "2ch",
                        }}
                        placeholder="Change Root"
                        type="text" {...params.inputProps} />
                </div>
            )}
        />
    )
}
