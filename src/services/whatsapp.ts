import { supabase } from '@/lib/supabase';

interface SendMessageResponse {
    messageId?: string;
    error?: string;
    status: 'success' | 'error';
}

export const whatsappService = {
    async sendMessage(phone: string, text: string): Promise<SendMessageResponse> {
        try {
            // Call Supabase Edge Function instead of direct Uazapi call
            const { data, error } = await supabase.functions.invoke('whatsapp-notify', {
                body: {
                    phone,
                    message: text
                }
            });

            if (error) {
                console.error('Edge Function Error:', error);
                throw new Error(error.message || 'Failed to trigger Edge Function');
            }

            return {
                status: 'success',
                messageId: data.key?.id || 'sent'
            };
        } catch (error: any) {
            console.error('WhatsApp Service Error:', error);
            return { status: 'error', error: error.message };
        }
    }
};
