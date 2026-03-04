import { Box, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import HelpTree from "../help/HelpTree";

const useStyles = makeStyles(() => ({
    MainLayout: {
        width: '100%',
        padding: '12px'
    },
    HelpTreeBox: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
    },
    PageTitle: {
        fontFamily: 'Styrene A Web',
        fontWeight: 900,
        fontSize: 28,
        lineHeight: '32px',
        textTransform: 'uppercase',
        color: '#FFF'
    },
    Question: {
        marginTop: 20,
        fontSize: 20,
        fontWeight: 700,
        color: '#FFF',
        fontFamily: 'Styrene A Web'
    },
    Answer: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: 400,
        color: '#CCC',
        fontFamily: 'Styrene A Web'
    }
}));

const questions = [
    {
        q: 'How do I create an account?',
        a: 'Click the Register button in the header and fill out the required information. You will receive a confirmation email to activate your account.'
    },
    {
        q: 'What payment methods can I use to deposit?',
        a: 'We accept a variety of cryptocurrencies including BTC, ETH, USDT, USDC and many more. Select your preferred currency in the wallet deposit modal.'
    },
    {
        q: 'How can I withdraw my winnings?',
        a: 'Go to the wallet section, choose Withdraw, select a network and enter the destination address. Be sure you meet any minimum withdrawal requirements.'
    },
    {
        q: 'Is the site provably fair?',
        a: 'Yes – all of our games use provably-fair algorithms. You can verify each bet using the details provided on the game page.'
    },
    {
        q: 'What are the minimum and maximum bets?',
        a: 'Bet limits vary by game. Refer to the game’s info panel for specific limits. Generally, minimum bets start at 0.0001 and maximums are displayed on each table.'
    },
    {
        q: 'How do tournaments work?',
        a: 'Tournaments are time-limited events where players compete for a leaderboard prize pool. Visit the Tournaments page for active events and rules.'
    },
    {
        q: 'Can I use Autobet?',
        a: 'Yes – Autobet allows you to place a sequence of bets automatically. Configure the parameters in the autobet modal inside any supported game.'
    },
    {
        q: 'What cryptocurrencies are supported?',
        a: 'We support dozens of coins and tokens via the Tatum integration. To see the full list, open the deposit modal or check the Supported Networks page.'
    },
    {
        q: 'How do I enable two-factor authentication (2FA)?',
        a: 'Navigate to User Settings > Security and follow the instructions to setup 2FA using an authenticator app.'
    },
    {
        q: 'How can I contact customer support?',
        a: 'Use the live chat widget (bottom right corner) or email support@durchex.com. Our team is available 24/7.'
    }
];

const FaqPage = () => {
    const classes = useStyles();
    const helpTreeData = [
        { to: '/app/help', label: 'PlayZelo Support' },
        { to: '/faq', label: 'FAQ' }
    ];

    return (
        <Box className={classes.MainLayout}>
            <Box className={classes.HelpTreeBox}>
                <HelpTree data={helpTreeData} />
            </Box>
            <Typography className={classes.PageTitle}>FREQUENTLY ASKED QUESTIONS</Typography>
            {questions.map((item, idx) => (
                <Box key={idx}>
                    <Typography className={classes.Question}>{item.q}</Typography>
                    <Typography className={classes.Answer}>{item.a}</Typography>
                </Box>
            ))}
        </Box>
    );
};

export default FaqPage;
