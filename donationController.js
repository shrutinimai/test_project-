const { User, Charity, Project, Donation } = require('../config/database');
const { sendEmail } = require('../utils/emailService');
const paymentMock = require('../utils/paymentMock');
const sequelize = require('../config/database'); 


const initiateDonation = async (req, res, next) => {
  const userId = req.user.id;
  const { charityId, projectId, amount, currency, anonymous = false } = req.body;

  if (!charityId || !amount || !currency) {
    const error = new Error('Charity ID, amount, and currency are required.');
    error.statusCode = 400;
    return next(error);
  }
  if (typeof amount !== 'number' || amount <= 0) {
    const error = new Error('Invalid donation amount. Must be a positive number.');
    error.statusCode = 400;
    return next(error);
  }

  try {
    const charity = await Charity.findOne({ where: { id: charityId, status: 'approved' } });
    if (!charity) {
      const error = new Error('Charity not found or not approved.');
      error.statusCode = 404;
      return next(error);
    }

    if (projectId) {
      const project = await Project.findOne({ where: { id: projectId, charity_id: charityId } });
      if (!project) {
        const error = new Error('Project not found under this charity.');
        error.statusCode = 404;
        return next(error);
      }
    }

    const result = await sequelize.transaction(async (t) => {
      const newDonation = await Donation.create({
        user_id: anonymous ? null : userId,
        charity_id: charityId,
        project_id: projectId || null,
        amount: amount,
        currency: currency,
        status: 'pending',
        is_anonymous: anonymous,
      }, { transaction: t });

      
      const paymentIntent = await paymentMock.createPaymentIntent(
        amount,
        currency,
        { donationId: newDonation.id, userId: anonymous ? 'anonymous' : userId, charityId: charityId, projectId: projectId || 'none' }
      );

      if (!paymentIntent.success) {
        throw new Error('Failed to initiate payment with gateway (mock).');
      }

      newDonation.transaction_id = paymentIntent.clientSecret || paymentIntent.orderId;
      await newDonation.save({ transaction: t });

      return { newDonation, paymentIntent };
    });

    res.json({
      message: 'Donation initiated successfully (mock). Complete payment on the client side.',
      donationId: result.newDonation.id,
      clientSecret: result.paymentIntent.clientSecret, 
      orderId: result.paymentIntent.orderId, 
      amount: parseFloat(result.newDonation.amount),
      currency: result.newDonation.currency,
    });

  } catch (error) {
    console.error('Error initiating donation:', error.message);
    next(new Error('Server error initiating donation.'));
  }
};


const verifyDonation = async (req, res, next) => {

  const sig = req.headers['stripe-signature'] || req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.MOCK_PAYMENT_WEBHOOK_SECRET;

  const event = req.body;
  console.log('Received mock webhook event:', event.type || event.event);

  
  const isValidSignature = paymentMock.verifyWebhookSignature(JSON.stringify(event), sig, webhookSecret);
  if (!isValidSignature) {
    console.warn('Webhook signature verification failed (mock).');
    const error = new Error('Webhook signature verification failed.');
    error.statusCode = 400;
    return next(error);
  }

  try {
    const processedEvent = await paymentMock.processWebhookEvent(event);

    if (!processedEvent.success) {
      console.warn('Mock payment event processing failed:', processedEvent.message);
      return res.status(200).json({ received: true, message: processedEvent.message });
    }

    const { transactionId, amount, currency, metadata } = processedEvent;
    const donationId = metadata?.donationId;

    if (!donationId) {
      console.warn('Webhook event missing donationId in metadata.');
      return res.status(400).json({ received: true, message: 'Missing donationId in webhook metadata.' });
    }

    await sequelize.transaction(async (t) => {
      const donation = await Donation.findOne({ where: { id: donationId, status: 'pending' }, transaction: t });

      if (!donation) {
        console.warn(`Donation ${donationId} not found or already processed.`);
        return;
      }

      donation.status = 'completed';
      donation.transaction_id = transactionId;
      donation.donated_at = new Date(); 
      await donation.save({ transaction: t });

      const charity = await Charity.findByPk(donation.charity_id, { transaction: t });
      if (charity) {
        charity.raised_amount = parseFloat(charity.raised_amount) + parseFloat(donation.amount);
        await charity.save({ transaction: t });
      }

      if (donation.project_id) {
        const project = await Project.findByPk(donation.project_id, { transaction: t });
        if (project) {
          project.raised_amount = parseFloat(project.raised_amount) + parseFloat(donation.amount);
          await project.save({ transaction: t });
        }
      }

      if (!donation.is_anonymous && donation.user_id) {
        const user = await User.findByPk(donation.user_id);
        const charityInfo = await Charity.findByPk(donation.charity_id);
        if (user && user.email) {
          await sendEmail(
            user.email,
            'Donation Confirmation - Thank You!',
            `<p>Dear Donor,</p>
             <p>Thank you for your generous donation of ${donation.amount} ${donation.currency} to ${charityInfo ? charityInfo.name : 'Unknown Charity'}.</p>
             <p>Your transaction ID is: ${transactionId}.</p>
             <p>Your support makes a difference!</p>
             <p>Best regards,<br>The Charity Donation Platform Team</p>`
          );
        }
      }
    });

    res.status(200).json({ received: true, message: 'Donation successfully processed.' });

  } catch (error) {
    console.error('Error processing webhook event:', error.message);
    next(new Error('Server error processing donation webhook.'));
  }
};

module.exports = {
  initiateDonation,
  verifyDonation,
};