import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography } from '@mui/material';

// displays the combined fiat+crypto balance as "chips"
const UnifiedBalance = () => {
    const authData = useSelector(state => state.auth);
    if (!authData.isAuth || !authData.balanceData) return null;

    const total = authData.balanceData.reduce((sum, item) => {
        const num = parseFloat(item.balance) || 0;
        return sum + num;
    }, 0);

    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: '#fff' }}>
                Unified balance: {total.toFixed(4)} chips
            </Typography>
        </Box>
    );
};

export default UnifiedBalance;
