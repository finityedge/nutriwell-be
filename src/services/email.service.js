const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send email
 */
const sendEmail = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'NutriWell'}" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });

        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Base email template
 */
const getBaseTemplate = (content) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #3D9B7B 0%, #2D7A5F 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .logo {
            width: 120px;
            height: auto;
        }
        .content {
            padding: 40px 30px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
        }
        .text {
            font-size: 16px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(135deg, #3D9B7B 0%, #2D7A5F 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            background-color: #1a3d2e;
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
            font-size: 14px;
        }
        .footer-links {
            margin-top: 15px;
        }
        .footer-link {
            color: #3D9B7B;
            text-decoration: none;
            margin: 0 10px;
        }
        .divider {
            height: 1px;
            background-color: #e0e0e0;
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="color: #ffffff; font-size: 32px; font-weight: bold;">
                🌿 NutriWell
            </div>
            <div style="color: #e0f2ed; font-size: 14px; margin-top: 10px;">
                Health & Wellness Marketplace
            </div>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} NutriWell. All rights reserved.</p>
            <div class="footer-links">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="footer-link">Home</a>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" class="footer-link">Contact</a>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/privacy" class="footer-link">Privacy Policy</a>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

/**
 * Password reset email
 */
const sendPasswordResetEmail = async (email, resetToken, userName) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const content = `
        <div class="title">Reset Your Password</div>
        <p class="text">Hi ${userName || 'there'},</p>
        <p class="text">We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
        </div>
        <p class="text">This link will expire in 1 hour.</p>
        <div class="divider"></div>
        <p class="text" style="font-size: 14px; color: #999;">
            If you didn't request a password reset, please ignore this email or contact our support team if you have concerns.
        </p>
        <p class="text" style="font-size: 14px; color: #999;">
            For security reasons, this link can only be used once.
        </p>
    `;

    return await sendEmail({
        to: email,
        subject: 'Reset Your Password - NutriWell',
        html: getBaseTemplate(content)
    });
};

/**
 * Order confirmation email
 */
const sendOrderConfirmationEmail = async (email, order, userName) => {
    const itemsList = order.items.map(item => `
        <tr>
            <td style="padding: 15px; border-bottom: 1px solid #e0e0e0;">
                <strong>${item.productName}</strong>
                ${item.productBrand ? `<br><span style="color: #999; font-size: 14px;">${item.productBrand}</span>` : ''}
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #e0e0e0; text-align: center;">x${item.quantity}</td>
            <td style="padding: 15px; border-bottom: 1px solid #e0e0e0; text-align: right;">Rs ${parseFloat(item.subtotal).toFixed(2)}</td>
        </tr>
    `).join('');

    const content = `
        <div class="title">🎉 Order Confirmed!</div>
        <p class="text">Hi ${userName || order.contactFirstName},</p>
        <p class="text">Thank you for your order! We've received your order and are currently processing it.</p>
        
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px;">
                Order #${order.orderNumber}
            </div>
            <div style="font-size: 14px; color: #666;">
                Placed on ${new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}
            </div>
        </div>

        <div style="margin: 30px 0;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">Order Details</div>
            <table style="width: 100%; border-collapse: collapse;">
                ${itemsList}
                <tr>
                    <td colspan="2" style="padding: 15px; text-align: right; font-weight: bold;">Subtotal:</td>
                    <td style="padding: 15px; text-align: right;">Rs ${parseFloat(order.subtotal).toFixed(2)}</td>
                </tr>
                <tr>
                    <td colspan="2" style="padding: 15px; text-align: right; font-weight: bold;">Shipping:</td>
                    <td style="padding: 15px; text-align: right;">${parseFloat(order.shippingFee) === 0 ? 'Free' : 'Rs ' + parseFloat(order.shippingFee).toFixed(2)}</td>
                </tr>
                <tr style="background-color: #f8f8f8;">
                    <td colspan="2" style="padding: 15px; text-align: right; font-size: 18px; font-weight: bold;">Total:</td>
                    <td style="padding: 15px; text-align: right; font-size: 18px; font-weight: bold; color: #3D9B7B;">Rs ${parseFloat(order.total).toFixed(2)}</td>
                </tr>
            </table>
        </div>

        ${order.deliveryMethod === 'DELIVERY' ? `
        <div style="margin: 30px 0;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">Delivery Address</div>
            <p class="text" style="margin: 5px 0;">${order.shippingAddress}</p>
            ${order.shippingAddress2 ? `<p class="text" style="margin: 5px 0;">${order.shippingAddress2}</p>` : ''}
            <p class="text" style="margin: 5px 0;">${order.shippingRegion}, ${order.shippingCountry}</p>
        </div>
        ` : `
        <div style="margin: 30px 0;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">📦 Store Pickup</div>
            <p class="text">Your order will be ready for pickup soon. We'll notify you when it's ready!</p>
        </div>
        `}

        <div class="divider"></div>
        <p class="text">We'll send you another email when your order ships. If you have any questions, feel free to contact our support team.</p>
    `;

    return await sendEmail({
        to: email,
        subject: `Order Confirmation #${order.orderNumber} - NutriWell`,
        html: getBaseTemplate(content)
    });
};

/**
 * Order status update email
 */
const sendOrderStatusEmail = async (email, order, userName) => {
    const statusMessages = {
        PAID: {
            title: '💳 Payment Confirmed',
            message: 'Your payment has been confirmed and your order is being prepared.'
        },
        PROCESSING: {
            title: '📦 Order Processing',
            message: 'We\'re preparing your order for shipment.'
        },
        SHIPPED: {
            title: '🚚 Order Shipped',
            message: 'Your order is on its way! You should receive it soon.'
        },
        DELIVERED: {
            title: '✅ Order Delivered',
            message: 'Your order has been delivered. We hope you enjoy your products!'
        },
        CANCELLED: {
            title: '❌ Order Cancelled',
            message: 'Your order has been cancelled. If you didn\'t request this, please contact support.'
        }
    };

    const statusInfo = statusMessages[order.status] || {
        title: 'Order Update',
        message: `Your order status has been updated to ${order.status}.`
    };

    const content = `
        <div class="title">${statusInfo.title}</div>
        <p class="text">Hi ${userName || order.contactFirstName},</p>
        <p class="text">${statusInfo.message}</p>
        
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px;">
                Order #${order.orderNumber}
            </div>
            <div style="font-size: 14px; color: #666;">
                Status: <span style="color: #3D9B7B; font-weight: bold;">${order.status}</span>
            </div>
        </div>

        <div class="divider"></div>
        <p class="text">If you have any questions about your order, please don't hesitate to contact our support team.</p>
    `;

    return await sendEmail({
        to: email,
        subject: `Order #${order.orderNumber} - ${statusInfo.title} - NutriWell`,
        html: getBaseTemplate(content)
    });
};

module.exports = {
    sendEmail,
    sendPasswordResetEmail,
    sendOrderConfirmationEmail,
    sendOrderStatusEmail
};
