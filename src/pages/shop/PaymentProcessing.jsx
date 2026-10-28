import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, CircularProgress, Button, Alert } from '@mui/material';
import { Refresh as RefreshIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import shopApi from '../../api/shopApi';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 2 * 60 * 1000;

// Note: YouPI-PG is an experimental, self-hosted gateway (not a certified bank integration) -
// it detects payment by reading bank SMS/notifications, which its own docs say "can be wrong
// or delayed." This screen is written to degrade gracefully when the checkout script can't be
// reached at all (e.g. no YouPI-PG instance running), and leans on polling our own backend as
// the real source of truth rather than trusting the client-side script alone.
const PaymentProcessing = ({ orderId, navigate }) => {
  const [scriptError, setScriptError] = useState(false);
  const [status, setStatus] = useState('pending');
  const [polling, setPolling] = useState(true);
  const pollTimerRef = useRef(null);
  const pollStartRef = useRef(Date.now());

  const triggerYoupiCheckout = (checkoutData) => {
    try {
      const existing = document.querySelector('script[data-youpi-checkout]');
      if (existing) existing.remove();

      const script = document.createElement('script');
      script.src = checkoutData.checkoutScriptUrl;
      script.setAttribute('data-youpi-key', checkoutData.merchantKey);
      script.setAttribute('data-currency', checkoutData.currency || 'INR');
      script.setAttribute('data-youpi-checkout', 'true');
      script.onload = () => {
        try {
          if (window.Youpi && typeof window.Youpi.pay === 'function') {
            window.Youpi.pay({ orderId: checkoutData.orderId, amount: checkoutData.amount });
          } else {
            setScriptError(true);
          }
        } catch {
          setScriptError(true);
        }
      };
      script.onerror = () => setScriptError(true);
      document.body.appendChild(script);
    } catch {
      setScriptError(true);
    }
  };

  const checkStatus = async () => {
    try {
      const res = await shopApi.getPaymentStatus(orderId);
      setStatus(res.data.payment_status);
      if (res.data.payment_status === 'paid') {
        setPolling(false);
        navigate('order-confirmation', { orderId });
      }
    } catch (err) {
      // transient errors shouldn't stop polling
    }
  };

  const startPolling = () => {
    pollStartRef.current = Date.now();
    setPolling(true);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(() => {
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
        clearInterval(pollTimerRef.current);
        setPolling(false);
        return;
      }
      checkStatus();
    }, POLL_INTERVAL_MS);
  };

  const initiate = async () => {
    setScriptError(false);
    try {
      const res = await shopApi.initiatePayment(orderId);
      triggerYoupiCheckout(res.data.checkout);
      startPolling();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start payment');
      setScriptError(true);
    }
  };

  useEffect(() => {
    initiate();
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', textAlign: 'center', py: 6 }}>
      {status === 'paid' ? (
        <>
          <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h6">Payment confirmed!</Typography>
        </>
      ) : (
        <>
          <CircularProgress size={56} sx={{ mb: 3 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Waiting for payment confirmation...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Complete the UPI payment in the window that opened. Payment verification can take a
            few minutes - please don't close this page.
          </Typography>

          {scriptError && (
            <Alert severity="warning" sx={{ mb: 3, textAlign: 'left', borderRadius: 2 }}>
              The shop's payment gateway could not be reached right now. You can try again, or
              check again if you've already completed the payment.
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={checkStatus} sx={{ borderRadius: 2 }}>
              I've paid, check again
            </Button>
            {scriptError && (
              <Button variant="contained" onClick={initiate} sx={{ borderRadius: 2 }}>
                Try Again
              </Button>
            )}
          </Box>

          {!polling && (
            <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
              Still not confirmed. You can keep checking, or view this order later from "My
              Orders".
            </Alert>
          )}

          <Button sx={{ mt: 3 }} onClick={() => navigate('orders')}>
            View My Orders Instead
          </Button>
        </>
      )}
    </Box>
  );
};

export default PaymentProcessing;
