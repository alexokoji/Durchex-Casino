import { Box, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles(() => ({
    MainLayout: {
        width: '100%',
        padding: '30px 50px',
        marginTop: '80px',
        "@media (max-width: 681px)": {
            padding: '20px'
        }
    },
    PageTitle: {
        fontFamily: 'Styrene A Web',
        fontWeight: 900,
        fontSize: 36,
        lineHeight: '40px',
        textTransform: 'uppercase',
        color: '#FFF',
        marginBottom: '40px'
    },
    QuestionBox: {
        marginBottom: '30px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '20px'
    },
    Question: {
        fontSize: 20,
        fontWeight: 700,
        color: '#FFF',
        fontFamily: 'Styrene A Web',
        marginBottom: '10px'
    },
    Answer: {
        fontSize: 16,
        fontWeight: 400,
        color: '#CCC',
        fontFamily: 'Styrene A Web',
        lineHeight: '1.6'
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
        a: 'Bet limits vary by game. Refer to the game\'s info panel for specific limits. Generally, minimum bets start at 0.0001 and maximums are displayed on each table.'
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
    },
    {
        q: 'What is the house edge?',
        a: 'House edge varies by game. Each game displays its theoretical RTP (Return to Player) which indicates the long-term payout percentage.'
    },
    {
        q: 'Can I play on mobile?',
        a: 'Yes, our platform is fully responsive and works on mobile devices. Simply access the site through your mobile browser.'
    },
    {
        q: 'Is there a referral program?',
        a: 'Yes, visit the Affiliate section to learn about our referral program and earn commissions from your friends\' play.'
    },
    {
        q: 'How are my funds secured?',
        a: 'Your crypto funds are stored in secure wallets. We use industry-standard security practices to protect all user data and transactions.'
    },
    {
        q: 'What should I do if I experience technical issues?',
        a: 'Contact our support team via the live chat, email, or check the help center. We\'re available 24/7 to assist you.'
    }
];

const FaqPage = () => {
    const classes = useStyles();

    return (
        <Box className={classes.MainLayout}>
            <Typography className={classes.PageTitle}>Frequently Asked Questions</Typography>
            {questions.map((item, idx) => (
                <Box key={idx} className={classes.QuestionBox}>
                    <Typography className={classes.Question}>{item.q}</Typography>
                    <Typography className={classes.Answer}>{item.a}</Typography>
                </Box>
            ))}
        </Box>
    );
};

export default FaqPage;
