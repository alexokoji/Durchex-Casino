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
        backgroundImage: (props) => `url(/assets/images/game-${props.gameTitle}.png)`,
        backgroundSize: 'cover',
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

const LargeGameCard = ({ gameTitle, link, available = true }) => {
    const classes = useStyles({ gameTitle, link });
    const CardInner = (
        <Box className={classes.CardContainer}>
            <Box className={classes.CardImageBox}>
                <Box className={classes.FeaturedBox}>Featured</Box>
                <span className={classes.CardName}>Scissor <label>Paper</label> Rock</span>
                {!available && (
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '24px 24px 0 0' }}>
                        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(20,12,40,0.85), rgba(0,0,0,0.8))', borderRadius: '24px 24px 0 0', backdropFilter: 'blur(2px)' }} />
                        <Box sx={{ zIndex: 6, background: 'linear-gradient(135deg, rgba(255,193,7,0.4) 0%, rgba(255,152,0,0.3) 100%)', padding: '16px 32px', borderRadius: 14, border: '2.5px solid rgba(255,215,0,0.7)', fontFamily: "'Styrene A Web'", fontWeight: 900, fontSize: '18px', color: '#FFD700', letterSpacing: 1.6, textShadow: '0 0 25px rgba(255,215,0,0.5), 0 0 50px rgba(255,152,0,0.3)', boxShadow: '0 0 40px rgba(255,215,0,0.4), inset 0 0 25px rgba(255,255,255,0.12), 0 8px 32px rgba(255,152,0,0.2)' }}>⏳ COMING SOON</Box>
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

export default LargeGameCard;