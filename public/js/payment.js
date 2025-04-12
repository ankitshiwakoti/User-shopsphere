document.addEventListener('DOMContentLoaded', function() {
    let currentOrderId = null;

    paypal.Buttons({
        // Create order
        createOrder: async function(data, actions) {
            try {
                // Get shipping information from forms
                const shippingInfo = {
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    fullName: document.getElementById('fullName').value,
                    address: document.getElementById('address').value,
                    city: document.getElementById('city').value,
                    state: document.getElementById('state').value,
                    zipCode: document.getElementById('zipCode').value,
                    country: document.getElementById('country').value
                };

                // Get the total amount from the order summary
                const totalAmount = parseFloat(document.querySelector('.card-body .d-flex.justify-content-between strong:last-child').textContent.replace('$', ''));

                console.log('Sending order data:', {
                    shippingInfo,
                    totalAmount
                });

                // First create the order in our database
                const orderResponse = await fetch('/api/payment/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        shippingInfo,
                        totalAmount
                    })
                });

                if (!orderResponse.ok) {
                    const errorData = await orderResponse.json();
                    throw new Error(errorData.error || 'Failed to create order');
                }

                const orderData = await orderResponse.json();
                currentOrderId = orderData.orderId;

                // Then create the PayPal order
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: totalAmount.toFixed(2),
                            currency_code: 'USD'
                        }
                    }]
                });
            } catch (error) {
                console.error('Error creating order:', error);
                showToast(error.message || 'Error creating order. Please try again.', true);
                return null;
            }
        },

        // Finalize the transaction after payer approval
        onApprove: async function(data, actions) {
            try {
                console.log('Starting payment capture...');
                console.log('PayPal Order ID:', data.orderID);
                console.log('Current Order ID:', currentOrderId);

                // Capture the PayPal payment
                const details = await actions.order.capture();
                console.log('Payment details:', details);

                if (!details || !details.id) {
                    throw new Error('Invalid payment details received from PayPal');
                }

                // Update our order with the PayPal payment details
                const response = await fetch('/api/payment/capture', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        orderId: currentOrderId,
                        paypalOrderId: data.orderID,
                        paymentDetails: details
                    })
                });

                const responseData = await response.json();
                
                if (!response.ok) {
                    console.error('Server response error:', responseData);
                    throw new Error(responseData.details || responseData.error || 'Failed to capture order');
                }

                console.log('Payment captured successfully:', responseData);
                
                // Show success message
                showToast('Payment completed successfully!');
                
                // Redirect to order details page
                window.location.href = `/orders/${currentOrderId}`;
            } catch (error) {
                console.error('Error capturing order:', error);
                showToast(error.message || 'Error processing payment. Please try again.', true);
                
                // If we have an order ID, redirect to order details with retry option
                if (currentOrderId) {
                    window.location.href = `/orders/${currentOrderId}?payment=failed`;
                } else {
                    // If no order ID, show error and stay on current page
                    showToast('Payment failed. Please try again.', true);
                }
            }
        },

        // Handle errors
        onError: function(err) {
            console.error('PayPal error:', err);
            showToast('An error occurred with PayPal. Please try again.', true);
            // Redirect to order details page with retry option
            if (currentOrderId) {
                window.location.href = `/orders/${currentOrderId}?payment=failed`;
            }
        }
    }).render('#paypal-button-container');

    // Direct PayPal payment button
    const directPayPalButton = document.getElementById('direct-paypal-button');
    if (directPayPalButton) {
        directPayPalButton.addEventListener('click', async function() {
            try {
                const response = await fetch('/api/payment/direct', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to create payment');
                }

                const data = await response.json();
                window.location.href = data.approvalUrl;
            } catch (error) {
                console.error('Error creating direct payment:', error);
                showToast(error.message || 'Error creating payment. Please try again.', true);
            }
        });
    }
});

// Toast message helper function
function showToast(message, isError = false) {
    const toastContainer = document.createElement('div');
    toastContainer.className = `toast-container position-fixed bottom-0 end-0 p-3`;
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center ${isError ? 'text-bg-danger' : 'text-bg-success'}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove the toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toastContainer);
    });
} 