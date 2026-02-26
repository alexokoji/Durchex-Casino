import { combineReducers } from "redux";
import authReducer from "./auth/index";
import customizedReducer from "./customization/index";
import menuReducer from "./menu/index";
import chatReducer from "./chat";
import modalReducer from "./modal";
import settingReducer from "./setting";
import currencyReducer from "./currency";
import privacyReducer from "./privacy";
import walletReducer from "../walletSlice";

const rootReducer = combineReducers({
    authentication: authReducer,
    customization: customizedReducer,
    menuOption: menuReducer,
    chatOption: chatReducer,
    modalOption: modalReducer,
    settingOption: settingReducer,
    currencyOption: currencyReducer,
    privacyOption: privacyReducer,
    wallet: walletReducer
});

export default rootReducer;