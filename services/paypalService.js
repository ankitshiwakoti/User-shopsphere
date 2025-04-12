import paypal from '@paypal/checkout-server-sdk';

// Creating an environment
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

// This sample uses SandboxEnvironment. In production, use LiveEnvironment
const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

export const createOrder = async (amount) => {
    try {
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: amount.toFixed(2)
                }
            }]
        });

        const response = await client.execute(request);
        return response.result;
    } catch (error) {
        console.error('Error creating PayPal order:', error);
        throw error;
    }
};

export const captureOrder = async (orderId) => {
    try {
        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});
        const response = await client.execute(request);
        return response.result;
    } catch (error) {
        console.error('Error capturing PayPal order:', error);
        throw error;
    }
}; 