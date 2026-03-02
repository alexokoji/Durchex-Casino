const preState = {
    isAuth: false,
    userData: null,
    balanceData: {}
};

const authReducer = (state = preState, action) => {
    switch (action.type) {
        case 'SET_AUTH':
            return {
                ...state,
                isAuth: true
            };
        case 'SET_LOGOUT':
            return {
                ...preState
            };
        case 'SET_USERDATA':
            return {
                ...state,
                userData: action.data
            };
        case 'SET_BALANCEDATA':
            // only keep USDT/ZELO/CHIPS entries (chippied amounts treated as unified chips)
            const allowed = ['USDT','ZELO','CHIPS'];
            let filtered = action.data;
            if (Array.isArray(action.data)) {
                filtered = action.data.filter(b => allowed.includes(b.coinType));
            }
            return {
                ...state,
                balanceData: filtered
            };
        default:
            state = { ...state };
            break;
    }
    return state;
};

export default authReducer;