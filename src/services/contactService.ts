import { supabase } from '../lib/supabase';
import { ContactMessage } from '../types';

export async function submitContactMessage(data: {
  name: string;
  email?: string;
  phone: string;
  message: string;
}): Promise<void> {
  const { error } = await supabase.from('contact_messages').insert({
    name: data.name,
    phone: data.phone,
    message: data.message,
    ...(data.email ? { email: data.email } : {})
  });
  if (error) throw error;
}

export async function subscribeNewsletter(email: string): Promise<void> {
  const { error } = await supabase
    .from('newsletter_subscribers')
    .upsert({ email }, { onConflict: 'email' });
  if (error) throw error;
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching contact messages:', error);
    throw error;
  }

  return data as ContactMessage[];
}
