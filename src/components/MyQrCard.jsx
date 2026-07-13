// Platform Phase 6 — "My QR" card (Pillar F). Shown on the profile-holder
// dashboard: renders the caller's CYD:<slug>:<token> payload as a QR code for
// scan-desk registration. Renders nothing while loading or when the backend
// has no QR support yet (additive: the gate only ever narrows what appears).

import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { QrCode2 as QrCodeIcon } from '@mui/icons-material';
import { getMyQr } from '../api/platformApi';
import { toQrDataUrl } from '../utils/qrHelpers';

const MyQrCard = () => {
  const [qrImage, setQrImage] = useState(null);

  useEffect(() => {
    let active = true;
    getMyQr()
      .then(async (res) => {
        if (!res.success || !res.data || !res.data.payload) return;
        const image = await toQrDataUrl(res.data.payload);
        if (active) setQrImage(image);
      })
      .catch(() => {
        // Older backend / no profile: the card simply stays hidden.
      });
    return () => {
      active = false;
    };
  }, []);

  if (!qrImage) return null;

  return (
    <Card sx={{ borderRadius: 3, mb: 2 }}>
      <CardContent sx={{ textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          <QrCodeIcon sx={{ fontSize: 20, mr: 0.5, verticalAlign: 'text-bottom' }} />
          My QR
        </Typography>
        <Box
          component="img"
          src={qrImage}
          alt="My registration QR code"
          sx={{ width: '100%', maxWidth: 220, aspectRatio: '1', mx: 'auto', display: 'block' }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          Show this code at any event scan desk to register instantly.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default MyQrCard;
