import { Regal } from '../types';

interface WebhookPayload {
  source_file: string;
  regale: Regal[];
}

export async function sendToWebhook(payload: WebhookPayload): Promise<boolean> {
  try {
    const response = await fetch('YOUR_WEBHOOK_URL_HERE', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('Webhook error:', error);
    return false;
  }
}
