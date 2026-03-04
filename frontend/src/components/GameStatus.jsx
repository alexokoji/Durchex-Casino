import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography } from '@mui/material';

// accepts a list of bet objects [{userId, betAmount, profit?}]
const GameStatus = ({ bets }) => {
    const authData = useSelector(state => state.auth || {});
    const [playersCount, setPlayersCount] = useState(0);
    const [totalBet, setTotalBet] = useState(0);
    const [myTotal, setMyTotal] = useState(0);
    const [myProfit, setMyProfit] = useState(0);

    useEffect(() => {
        const total = bets.reduce((s, b) => s + (parseFloat(b.betAmount) || 0), 0);
        setTotalBet(total);
        setPlayersCount(bets.length);
        if (authData.isAuth && authData.userData) {
            const myBets = bets.filter(b => b.userId === authData.userData._id);
            const myT = myBets.reduce((s, b) => s + (parseFloat(b.betAmount) || 0), 0);
            const profit = myBets.reduce((s, b) => s + (parseFloat(b.profit) || 0), 0);
            setMyTotal(myT);
            setMyProfit(profit);
        } else {
            setMyTotal(0);
            setMyProfit(0);
        }
    }, [bets, authData]);

    // choose a color for the profit/loss number
    const profitColor = myProfit > 0 ? '#4caf50' : myProfit < 0 ? '#f44336' : '#fff';
    const profitLabel = myProfit > 0 ? 'profit' : myProfit < 0 ? 'loss' : 'net';
    return (
        <Box sx={{ mb: 2, color: '#fff', fontSize: '0.75rem' }}>
            <Typography variant="caption" component="span">
                Players: {playersCount} | Total bets: {totalBet.toFixed(2)} | My bets: {myTotal.toFixed(2)} 
            </Typography>
            {authData.isAuth && (
                <Typography variant="caption" component="span" sx={{ color: profitColor, ml: 1 }}>
                    ({profitLabel} {myProfit.toFixed(2)})
                </Typography>
            )}
        </Box>
    );
};

export default GameStatus;
