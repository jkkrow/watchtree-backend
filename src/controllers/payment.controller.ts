import * as PaymentService from '../services/payment.service';
import { asyncHandler } from '../util/async-handler';

export const createSubscription = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { planName } = req.body;

  const plan = await PaymentService.findPlanByName(planName);
  const subscription = await PaymentService.createSubscription(
    plan.id,
    req.user.id
  );

  res.json({ subscription });
});

export const captureSubscription = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { id } = req.params;

  const premium = await PaymentService.captureSubscription(id, req.user.id);

  res.json({ premium });
});

export const cancelSubscription = asyncHandler(async (req, res) => {
  if (!req.user) return;

  const { reason } = req.body;
  const { id } = req.params;

  await PaymentService.verifySubscription(id, req.user.id);
  await PaymentService.cancelSubscription(id, reason);
  await PaymentService.cancelUserPremium(id, req.user.id);

  res.json({ message: 'Subscription cancelled successfully' });
});

export const subscriptionWebhookHandler = asyncHandler(async (req, res) => {
  await PaymentService.verifyWebhookSignature(req.body, req.headers);

  if (req.body.event_type === 'PAYMENT.SALE.COMPLETED') {
    const subscriptionId = req.body.resource.billing_agreement_id;
    const userId = req.body.resource.custom;

    await PaymentService.updateUserPremium(subscriptionId, userId);
  }

  if (req.body.event_type === 'BILLING.SUBSCRIPTION.CANCELLED') {
    const subscriptionId = req.body.resource.id;
    const userId = req.body.resource.custom_id;

    await PaymentService.cancelUserPremium(subscriptionId, userId);
  }

  res.json({ message: 'Webhook triggered successfully' });
});
