import { supabase } from '@/lib/supabase';

interface SendMessageResponse {
    messageId?: string;
    error?: string;
    status: 'success' | 'error';
}

export const whatsappService = {
    async sendMessage(phone: string, text: string): Promise<SendMessageResponse> {
        try {
            // Direct fetch to bypass potential supabase-js client issues
            const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-notify`;
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            console.log('[WhatsApp] Sending to:', functionUrl);

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${anonKey}`
                },
                body: JSON.stringify({
                    phone,
                    message: text
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[WhatsApp] Fetch Error:', response.status, errorText);
                throw new Error(`HTTP Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            if (data.status === 'error') {
                throw new Error(data.message || 'Unknown error from Edge Function');
            }

            return {
                status: 'success',
                messageId: data.messageId || 'sent'
            };
        } catch (error: any) {
            console.error('WhatsApp Service Error:', error);
            // Return specific error message to UI
            return { status: 'error', error: error.message };
        }
    }
};
