const isLocal = process.env.NODE_ENV === 'development';
const pro = 'https://casino.durchex.com';
const dev = 'http://localhost:5000';
const url = isLocal ? dev : pro;

const Config = {
    Root: {
        baseUrl: isLocal ? 'http://localhost:5000' : 'https://casino.durchex.com',
        apiUrl: `${url}/api`,
        socketServerUrl: isLocal ? `http://localhost:4000` : 'https://casino.durchex.com:4001',
        socket: null,
        chatSocket: null,
        chatSocketUrl: isLocal ? 'http://localhost:4900' : 'https://casino.durchex.com:4901',
        turtleraceSocketUrl: isLocal ? 'http://localhost:5100' : 'https://casino.durchex.com:5101',
        scissorSocketUrl: isLocal ? 'http://localhost:5200' : 'https://casino.durchex.com:5201',
        minesSocketUrl: isLocal ? 'http://localhost:5300' : 'https://casino.durchex.com:5301',
        diceSocketUrl: isLocal ? 'http://localhost:5400' : 'https://casino.durchex.com:5401',
        slotSocketUrl: isLocal ? 'http://localhost:5500' : 'https://casino.durchex.com:5501',
        plinkoSocketUrl: isLocal ? 'http://localhost:5600' : 'https://casino.durchex.com:5601',
        crashSocketUrl: isLocal ? 'http://localhost:5700' : 'https://casino.durchex.com:5701'
    },
    token: 'PlayZelo',
    request: {
        getAuthData: '/auth/getAuthData',
        userGoogleLogin: '/auth/google-login',
        metamaskLogin: '/auth/metamask-login',
        emailLogin: '/auth/email-login',
        verifyEmailCode: '/auth/verifyEmailCode',
        updateProfileSet: '/auth/updateProfileSet',
        getDepositAddress: '/v0/payment/deposit-address',
        getMyBalance: '/auth/getMyBalance',
        getMyBalances: '/auth/getMyBalances',
        withdraw: '/v0/payment/withdraw',
        getDailyReward: '/v0/payment/get-daily-reward',
        getProfileData: '/auth/getProfileData',
        getDepositBonus: '/auth/getDepositBonus',
        getBetHistoryData: '/auth/getBetHistoryData',
        updateCurrency: '/auth/updateCurrency',
        updateProfileHistory: '/auth/updateProfileHistory',
        updateUserGameSetting: '/auth/updateUserGameSetting',
        getSeedData: '/auth/getSeedData',
        updateClientSeed: '/auth/updateClientSeed',
        updateServerSeed: '/auth/updateServerSeed',
        getLevelData: '/auth/getLevelData',
        getCurrencies: '/v0/payment/getCurrencies',
        getExchangeRate: '/v0/payment/getExchangeRate',
        swapCoin: '/v0/payment/swapCoin',
        getAvailableGames: '/auth/getAvailableGames',
        getBannerText: '/auth/getBannerText',
        getPrivacyData: '/auth/getPrivacyData',
        updatePrivacyData: '/auth/updatePrivacyData',
        getCampaignCode: '/auth/getCampaignCode',
        getCampaignData: '/auth/getCampaignData',
        claimCampaignAmount: '/auth/claimCampaignAmount',
        getUnlockBalance: '/auth/getUnlockBalance',
        getWargerBalance: '/auth/getWargerBalance',
        claimLockedBalance: '/auth/claimLockedBalance',
        getSpinCount: '/auth/getSpinCount',
        updateSpinCount: '/auth/updateSpinCount',
        getTournamentList: '/auth/getTournamentList',
        participateTournament: '/auth/participateTournament',
        getAffiliateUsersData: '/auth/getAffiliateUsersData',
        getAffiliateEarningData: '/auth/getAffiliateEarningData',
        getTournamentWargerDetail: '/auth/getTournamentWargerDetail',
        getCampaignList: '/auth/getCampaignList',
        addCampaignList: '/auth/addCampaignList',
        getCampaignDetail: '/auth/getCampaignDetail',
        getTransactionHistory: '/auth/getTransactionHistory',
        // Demo Mode Endpoints
        getDemoBalance: '/v0/payment/demo/balance',
        toggleDemoMode: '/v0/payment/demo/toggle',
        simulateDemoDeposit: '/v0/payment/demo/simulate-deposit',
        // Fiat/Flutterwave Endpoints
        flutterwaveInitialize: '/v0/payment/flutterwave/initialize',
        flutterwaveVerify: '/v0/payment/flutterwave/verify',
        flutterwaveHistory: '/v0/payment/flutterwave/history',
        flutterwaveWithdraw: '/v0/payment/flutterwave/withdraw',
        // Withdrawal Endpoints
        processWithdrawal: '/v0/payment/withdrawal/process',
        getWithdrawalHistory: '/v0/payment/withdrawal/history',
        getWithdrawalStatus: '/v0/payment/withdrawal/status',
        // Deposit Endpoints
        getOrCreateDepositAddress: '/v0/payment/deposit/get-address',
        getDepositHistory: '/v0/payment/deposit/history'
    }
};

export default Config;