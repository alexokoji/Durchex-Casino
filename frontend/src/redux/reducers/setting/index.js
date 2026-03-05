const preState = {
    inited: false,
    sound: true,
    backgroundSound: true,
    effectSound: true,
    hotkey: false,
    animation: false,
    maxBet: false
};

const settingReducer = (state = preState, action) => {
    switch (action.type) {
        case 'INIT_SETTING':
            return {
                ...action.data
            };
        default:
            state = { ...state };
            break;
    }
    return state;
};

export default settingReducer;