import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const ContactForm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          ...formData,
          user_id: user?.id || null
        });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible."
      });

      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-foreground font-semibold mb-2">
            First Name
          </label>
          <Input 
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            placeholder="Enter your first name"
            className="bg-mtrix-black border-mtrix-gray"
            required
          />
        </div>
        <div>
          <label className="block text-foreground font-semibold mb-2">
            Last Name
          </label>
          <Input 
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            placeholder="Enter your last name"
            className="bg-mtrix-black border-mtrix-gray"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-foreground font-semibold mb-2">
          Email Address
        </label>
        <Input 
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Enter your email"
          className="bg-mtrix-black border-mtrix-gray"
          required
        />
      </div>
      
      <div>
        <label className="block text-foreground font-semibold mb-2">
          Subject
        </label>
        <Input 
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="What can we help you with?"
          className="bg-mtrix-black border-mtrix-gray"
          required
        />
      </div>
      
      <div>
        <label className="block text-foreground font-semibold mb-2">
          Message
        </label>
        <Textarea 
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Please describe your issue or question in detail..."
          rows={6}
          className="bg-mtrix-black border-mtrix-gray resize-none"
          required
        />
      </div>
      
      <Button 
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-gold text-mtrix-black hover:shadow-gold transition-all duration-300"
      >
        {loading ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
};

export default ContactForm;