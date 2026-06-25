// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const nodemailer: any = require('nodemailer');

interface OrderNotificationData {
  orderNumber: string;
  ordererName: string;
  ordererPhone: string;
  totalAmount: number;
  items: { productName: string; optionName: string; quantity: number; totalPrice: number }[];
  createdAt: string;
}

const createTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP credentials missing in .env');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 465,
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

export async function sendOrderNotification(toEmails: string[], orderData: OrderNotificationData) {
  if (!toEmails || toEmails.length === 0) return;

  try {
    const transporter = createTransporter();

    const itemsHtml = orderData.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155;">${item.productName}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155;">${item.optionName}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; text-align: right;">KRW ${item.totalPrice.toLocaleString()}</td>
        </tr>`
      )
      .join('');

    const htmlBody = `
      <div style="font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1e293b, #334155); padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0;">🛒 새로운 주문이 접수되었습니다</h1>
        </div>
        <div style="padding: 24px; background: #ffffff;">
          <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <div style="flex: 1;">
              <span style="font-size: 13px; color: #64748b; display: block; margin-bottom: 4px;">주문번호</span>
              <strong style="font-size: 16px; color: #0f172a;">${orderData.orderNumber}</strong>
            </div>
            <div style="flex: 1;">
              <span style="font-size: 13px; color: #64748b; display: block; margin-bottom: 4px;">주문일시</span>
              <strong style="font-size: 14px; color: #0f172a;">${orderData.createdAt}</strong>
            </div>
          </div>

          <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
            <span style="font-size: 13px; color: #64748b; display: block; margin-bottom: 4px;">주문자</span>
            <strong style="font-size: 15px; color: #0f172a;">${orderData.ordererName} (${orderData.ordererPhone})</strong>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="padding: 10px 12px; text-align: left; font-size: 13px; color: #64748b; border-bottom: 2px solid #e2e8f0;">상품</th>
                <th style="padding: 10px 12px; text-align: left; font-size: 13px; color: #64748b; border-bottom: 2px solid #e2e8f0;">옵션</th>
                <th style="padding: 10px 12px; text-align: center; font-size: 13px; color: #64748b; border-bottom: 2px solid #e2e8f0;">수량</th>
                <th style="padding: 10px 12px; text-align: right; font-size: 13px; color: #64748b; border-bottom: 2px solid #e2e8f0;">금액</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; text-align: right;">
            <span style="font-size: 13px; color: #64748b;">결제 예정 금액</span>
            <strong style="font-size: 20px; color: #16a34a; display: block; margin-top: 4px;">KRW ${orderData.totalAmount.toLocaleString()}</strong>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">본 메일은 태평프레시 주문 시스템에서 자동 발송되었습니다.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"태평프레시 주문알림" <${process.env.SMTP_USER}>`,
      to: toEmails.join(', '),
      subject: `[주문접수] ${orderData.ordererName}님 - ${orderData.orderNumber} (KRW ${orderData.totalAmount.toLocaleString()})`,
      html: htmlBody,
    });

    console.log('[MAILER] Order notification sent successfully');
  } catch (error) {
    console.error('[MAILER] Failed to send order notification:', error);
    // Don't throw - email failure shouldn't block the order
  }
}
