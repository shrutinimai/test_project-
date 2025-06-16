
const { v4: uuidv4 } = require('uuid');

const createPaymentIntent = async (amount, currency, metadata) => {
    console.log(`Mock: Creating payment intent for ${amount} ${currency} with metadata:`, metadata);
    await new Promise(resolve => setTimeout(resolve, 500));

    const clientSecret = `pi_mock_${uuidv4()}_secret_${uuidv4().substring(0, 8)}`;
    const orderId = `order_mock_${uuidv4()}`;

    return {
        success: true,
        clientSecret: clientSecret,
        orderId: orderId,
        status: 'requires_confirmation'
    };
};


const verifyWebhookSignature = (rawBody, signature, secret) => {
    console.log('Mock: Verifying webhook signature...');
    if (signature && secret) {
        console.log('Mock: Webhook signature considered valid (placeholder).');
        return true;
    }
    console.log('Mock: Webhook signature considered invalid (placeholder).');
    return false;
};


const processWebhookEvent = async (event) => {
    console.log('Mock: Processing webhook event...');
    await new Promise(resolve => setTimeout(resolve, 300)); 

    if (event && (event.type === 'payment_intent.succeeded' || event.event === 'payment.captured')) {
        console.log('Mock: Payment success event detected.');
        return {
            success: true,
            transactionId: event.data?.object?.id || `txn_mock_${uuidv4()}`,
            amount: event.data?.object?.amount || event.amount,
            currency: event.data?.object?.currency || event.currency, 
            metadata: event.data?.object?.metadata || event.payload 
        };
    } else if (event && (event.type === 'payment_intent.failed' || event.event === 'payment.failed')) {
        console.log('Mock: Payment failed event detected.');
        return { success: false, message: 'Mock payment failed' };
    }
    console.log('Mock: Unhandled webhook event type.');
    return { success: false, message: 'Unhandled mock event type' };
};

module.exports = {
    createPaymentIntent,
    verifyWebhookSignature,
    processWebhookEvent
};