import { useSelector } from "react-redux";
import { useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, StyledEngineProvider } from "@mui/material";
import themes from "./themes";
import { LoadingProvider } from "./layout/Context/loading";
import ContextLoading from "./ui-component/loading";
import MainRoutes from "./routes/main";
import { GoogleOAuthProvider } from '@react-oauth/google'
import chatRoomConnect from "redux/actions/chat";
import baseInit from "redux/actions/base";

const App = () => {
    const customization = useSelector((state) => state.customization);
    
    // Initialize sockets only once on component mount
    useEffect(() => {
        chatRoomConnect();
        baseInit();
    }, []);

    const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    const children = (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={themes(customization)}>
                <CssBaseline />
                <LoadingProvider>
                    <ContextLoading />
                    <MainRoutes />
                </LoadingProvider>
            </ThemeProvider>
        </StyledEngineProvider>
    );

    // always include provider to satisfy hooks; if clientId is missing the context
    // is still provided but login attempts will fail gracefully.
    return (
        <GoogleOAuthProvider clientId={googleClientId || ''}>
            {children}
        </GoogleOAuthProvider>
    );
};

export default App;