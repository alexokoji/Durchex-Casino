import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { verifyFlutterwave } from '../../redux/walletSlice';
import { CircularProgress, Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function PaymentCallback() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, success } = useSelector((s) => s.wallet);
    const [message, setMessage] = useState('Verifying transaction...');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        // Flutterwave returns tx_ref parameter
        const reference = params.get('tx_ref') || params.get('reference');
        if (!reference) {
            setMessage('No transaction reference provided.');
            return;
        }

        dispatch(verifyFlutterwave(reference))
            .unwrap()
            .then((res) => {
                if (res.status && res.data?.paymentStatus === 'completed') {
                    setMessage('✅ Payment successful!');
                } else {
                    setMessage('⚠️ Payment not completed.');
                }
            })
            .catch((err) => {
                setMessage(`❌ Verification error: ${err}`);
            });
    }, [dispatch]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10 }}>
            {loading && <CircularProgress />}
            <Typography variant="h6" sx={{ mt: 2 }}>{message}</Typography>
            {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
            {(!loading && (success || error)) && (
                <Button
                    variant="contained"
                    sx={{ mt: 3 }}
                    onClick={() => navigate('/app/home')}
                >
                    Back to Home
                </Button>
            )}
        </Box>
    );
}
