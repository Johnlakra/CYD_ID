import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PayOrder from './PayOrder';
import shopApi from '../../api/shopApi';

jest.mock('../../api/shopApi', () => ({
  __esModule: true,
  default: { getOrderById: jest.fn(), claimPayment: jest.fn(), editClaim: jest.fn() },
}));

const baseOrder = {
  id: 42,
  order_number: 'CYD-ABC-123',
  shop_name: 'St. John Youth Shop',
  total_paise: 25050,
  viewer_role: 'buyer',
  payment_method: 'upi',
  claim: null,
  dispute_reasons: [],
  disputes: [],
};

const awaiting = {
  ...baseOrder,
  payment_status: 'awaiting_payment',
  pay_seconds_left: 1500,
  allowed_actions: ['claim', 'cancel', 'chat'],
  payee: {
    upi_id: 'stjohnsyouth@okaxis',
    name: 'St. John Youth Shop',
    upi_link: 'upi://pay?pa=stjohnsyouth@okaxis&pn=St.%20John%20Youth%20Shop&am=250.50&tn=CYD-ABC-123&cu=INR',
  },
};

const renderWith = (order) => {
  shopApi.getOrderById.mockResolvedValue({ data: { order } });
  const navigate = jest.fn();
  render(<PayOrder orderId={order.id} navigate={navigate} />);
  return navigate;
};

afterEach(() => jest.clearAllMocks());

test('awaiting payment: shows the seller UPI ID, exact amount, reference, countdown and QR', async () => {
  renderWith(awaiting);
  expect(await screen.findByText('stjohnsyouth@okaxis')).toBeInTheDocument();
  expect(screen.getByText('₹250.50')).toBeInTheDocument();
  expect(screen.getByText('CYD-ABC-123')).toBeInTheDocument();
  expect(screen.getByRole('timer')).toHaveTextContent('25:00 left');
  expect(screen.getByText(/goes directly to the seller/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /open upi app/i })).toHaveAttribute('href', awaiting.payee.upi_link);
  fireEvent.click(screen.getByRole('button', { name: /show qr code/i }));
  expect(screen.getByLabelText(/upi payment qr code/i)).toBeInTheDocument();
});

test('rejects a UTR that is not 12 digits and does not call the API', async () => {
  renderWith(awaiting);
  const input = await screen.findByLabelText(/upi reference number/i);
  fireEvent.change(input, { target: { value: 'T2402150123' } });
  fireEvent.click(screen.getByRole('button', { name: /i have paid/i }));
  expect(await screen.findByText(/enter the 12-digit upi ref no/i)).toBeInTheDocument();
  expect(shopApi.claimPayment).not.toHaveBeenCalled();
});

test('submits the UTR without spaces and switches to the waiting state', async () => {
  renderWith(awaiting);
  shopApi.claimPayment.mockResolvedValue({
    data: {
      order: {
        ...baseOrder,
        payment_status: 'claimed',
        confirm_seconds_left: 86000,
        allowed_actions: ['edit_claim', 'chat'],
        payee: null,
        claim: { utr: '401234567890' },
      },
    },
  });
  const input = await screen.findByLabelText(/upi reference number/i);
  fireEvent.change(input, { target: { value: '4012 3456 7890' } });
  fireEvent.click(screen.getByRole('button', { name: /i have paid/i }));
  await waitFor(() => expect(shopApi.claimPayment).toHaveBeenCalledWith(42, { utr: '401234567890', screenshot: undefined }));
  expect(await screen.findByText(/waiting for the seller to confirm/i)).toBeInTheDocument();
  expect(screen.getByText('401234567890')).toBeInTheDocument();
});

test('confirmed: tells the buyer the seller has the payment', async () => {
  renderWith({ ...baseOrder, payment_status: 'confirmed', allowed_actions: ['chat'], payee: null });
  expect(await screen.findByText(/payment confirmed/i)).toBeInTheDocument();
});

test('expired: warns not to pay and points to the paid-after-cancel report', async () => {
  renderWith({
    ...baseOrder,
    payment_status: 'void',
    cancel_reason: 'Payment window expired',
    allowed_actions: ['chat', 'dispute'],
    dispute_reasons: ['paid_after_cancel'],
    payee: null,
  });
  expect(await screen.findByText(/no longer waiting for payment/i)).toBeInTheDocument();
  expect(screen.getByText(/do not send any money/i)).toBeInTheDocument();
  expect(screen.getByText(/already paid\?/i)).toBeInTheDocument();
});

test('load error: shows a retry option', async () => {
  shopApi.getOrderById.mockRejectedValue({ response: { data: { message: 'Order not found' } } });
  render(<PayOrder orderId={1} navigate={jest.fn()} />);
  expect(await screen.findByText('Order not found')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
});
