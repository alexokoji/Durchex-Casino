export const COINTYPES = {
    USDT: { code: 'USDT', fullname: 'Tether', token: 'trc20', decimal: 6 },
    ZELO: { code: 'ZELO', fullname: 'PlayZelo', token: '', decimal: 4 }
};

export const CURRENCIES = {
    USDT: 'USDT',
    ZELO: 'ZELO'
}

export const Fee = {
    USDT: 1,
    ZELO: 1
}

export const TxScanLink = {
    Mainnet: {
        // USDT operates on chains; links may vary by chain
    },
    Testnet: {
        // leave empty or point to appropriate explorer if needed
    }
}

export const AddressScanLink = {
    Mainnet: {
        // not used for USDT/ZELO
    },
    Testnet: {
        // not used
    }
}

export const NETWORK = 'Testnet';