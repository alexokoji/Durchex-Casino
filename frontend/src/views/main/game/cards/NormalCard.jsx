import { Box } from "@mui/material";
import { makeStyles } from "@mui/styles";
import MoneyIcon from "assets/icons/Crypto3.png";
import { Link } from "react-router-dom";

const useStyles = makeStyles(() => ({
    CardContainer: {
        width: '100%',
        height: '309px',
        background: '#2C2C3A',
        borderRadius: '24px'
    },
    CardImageBox: {
        width: '100%',
        height: 'calc(100% - 69px)',
        backgroundImage: (props) => `url(/assets/images/games/${props.gameTitle}.png)`,
        backgroundSize: '100% 100%',
        borderRadius: '24px 24px 0px 0px',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '50%',
        position: 'relative'
    },
    CardName: {
        position: 'absolute',
        bottom: '10px',
        width: '100%',
        textAlign: 'center',
        fontFamily: "'Styrene A Web'",
        fontWeight: 900,
        fontSize: "32px",
        lineHeight: "34px",
        textTransform: "uppercase",
        color: "#FFFFFF",
        textShadow: "-12.731px 12.731px 0px rgba(31, 30, 37, 0.25)",
        "&>label": {
            color: '#FEF101',
            fontFamily: 'inherit'
        }
    },
    FeaturedBox: {
        position: 'absolute',
        left: '20px',
        top: '20px',
        width: "162px",
        height: "43px",
        background: "#6FE482",
        borderRadius: "8px",
        fontFamily: "'Styrene A Web'",
        fontWeight: 700,
        fontSize: "18px",
        lineHeight: "18px",
        textAlign: "center",
        textTransform: "uppercase",
        color: "#000000",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    CardBottomBox: {
        width: '100%',
        height: '69px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '21px'
    },
    AmountBox: {
        padding: '4px 10px 5px 6px',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        justifyContent: 'center',
        background: "#424253",
        borderRadius: "7px",
        "&>span": {
            fontFamily: "'Styrene A Web'",
            fontWeight: 700,
            fontSize: "18px",
            lineHeight: "23px",
            textTransform: "uppercase",
            color: "#FFFFFF"
        }
    },
    HiddenText: {
        fontFamily: "'Cera Pro'",
        fontWeight: 700,
        fontSize: "17px",
        lineHeight: "21px",
        color: "#FFFFFF"
    }
}));

const NormalGameCard = ({ gameTitle, link, available = true }) => {
    const classes = useStyles({ gameTitle });

    const CardInner = (
        <Box className={classes.CardContainer}>
            <Box className={classes.CardImageBox}>
                {/* <span className={classes.CardName}>{gameTitle}</span> */}
                {!available && (
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '24px 24px 0 0' }}>
                        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(20,12,40,0.8), rgba(0,0,0,0.75))', borderRadius: '24px 24px 0 0', backdropFilter: 'blur(2px)' }} />
                        <Box sx={{ zIndex: 6, background: 'linear-gradient(135deg, rgba(255,193,7,0.35) 0%, rgba(255,152,0,0.25) 100%)', padding: '14px 28px', borderRadius: 12, border: '2px solid rgba(255,215,0,0.6)', fontFamily: "'Styrene A Web'", fontWeight: 900, fontSize: '16px', color: '#FFD700', letterSpacing: 1.5, textShadow: '0 0 20px rgba(255,215,0,0.4), 0 0 40px rgba(255,152,0,0.2)', boxShadow: '0 0 30px rgba(255,215,0,0.3), inset 0 0 20px rgba(255,255,255,0.1)' }}>⏳ COMING SOON</Box>
                    </Box>
                )}
            </Box>
            <Box className={classes.CardBottomBox}>
                <span className={classes.HiddenText}>Hidden</span>
                <Box className={classes.AmountBox}>
                    <img src={MoneyIcon} alt="icon" width="32px" height="33px" />
                    <span>0.03</span>
                </Box>
            </Box>
        </Box>
    );

    return available ? (
        <Link to={link}>{CardInner}</Link>
    ) : (
        <Box>{CardInner}</Box>
    );
};

export default NormalGameCard;