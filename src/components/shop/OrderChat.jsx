import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Typography, TextField, Button, CircularProgress, Alert, alpha, useTheme } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import shopApi from '../../api/shopApi';
import { apiErrorMessage } from '../../utils/apiError';

const ROLE_LABEL = { buyer: 'Buyer', seller: 'Seller', admin: 'Admin' };
const POLL_MS = 5000;

// Per-order conversation between buyer and seller (and an admin once there is a dispute).
// New messages are fetched every few seconds while the chat is open.
const OrderChat = ({ orderId, viewerRole, canWrite }) => {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [readOnly, setReadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const lastIdRef = useRef(0);
  const listRef = useRef(null);

  const fetchNew = useCallback(async () => {
    try {
      const res = await shopApi.getMessages(orderId, lastIdRef.current);
      const fresh = res.data.messages || [];
      if (fresh.length) {
        lastIdRef.current = fresh[fresh.length - 1].id;
        setMessages((prev) => [...prev, ...fresh.filter((m) => !prev.some((p) => p.id === m.id))]);
      }
      setReadOnly(Boolean(res.data.read_only));
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load messages'));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    lastIdRef.current = 0;
    setMessages([]);
    setLoading(true);
    fetchNew();
    const timer = setInterval(fetchNew, POLL_MS);
    return () => clearInterval(timer);
  }, [fetchNew]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      await shopApi.sendMessage(orderId, body);
      setText('');
      await fetchNew();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Message not sent'));
    } finally {
      setSending(false);
    }
  };

  const writable = canWrite && !readOnly;

  return (
    <Box>
      <Box
        ref={listRef}
        aria-live="polite"
        sx={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, p: 1 }}
      >
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        {!loading && error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && messages.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            No messages yet.
          </Typography>
        )}
        {messages.map((m) => {
          if (m.sender_role === 'system') {
            return (
              <Box
                key={m.id}
                sx={{
                  alignSelf: 'center',
                  maxWidth: '92%',
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.info.main, 0.08),
                  border: `1px dashed ${alpha(theme.palette.info.main, 0.4)}`,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                  {m.body}
                </Typography>
              </Box>
            );
          }
          const mine = m.sender_role === viewerRole;
          return (
            <Box
              key={m.id}
              sx={{
                alignSelf: mine ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                px: 1.5,
                py: 1,
                borderRadius: 3,
                bgcolor: mine ? alpha(theme.palette.primary.main, 0.12) : theme.palette.grey[100],
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                {mine ? 'You' : `${ROLE_LABEL[m.sender_role] || m.sender_role}${m.sender_username ? ` · ${m.sender_username}` : ''}`}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {m.body}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(m.created_at).toLocaleString()}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {writable ? (
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Write a message…"
            value={text}
            inputProps={{ maxLength: 1000, 'aria-label': 'Message' }}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button
            variant="contained"
            onClick={send}
            disabled={sending || !text.trim()}
            aria-label="Send message"
            sx={{ borderRadius: 2, minWidth: 48 }}
          >
            {sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon fontSize="small" />}
          </Button>
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {readOnly ? 'This conversation is closed.' : 'You can read this conversation but not reply.'}
        </Typography>
      )}
    </Box>
  );
};

export default OrderChat;
