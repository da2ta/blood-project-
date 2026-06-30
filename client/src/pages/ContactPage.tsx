import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplets, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ROUTES } from '../constants';
import { useState } from 'react';
import { useNotificationStore } from '../store/notificationStore';

export function ContactPage() {
  const { addToast } = useNotificationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      addToast({
        type: 'success',
        title: 'Message Sent',
        message: 'We will get back to you within 24 hours.',
      });
      setIsSubmitting(false);
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">HemoExchange</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to={ROUTES.ABOUT} className="text-sm text-slate-300 hover:text-white transition-colors">
              About
            </Link>
            <Link to={ROUTES.LOGIN}>
              <Button size="sm">Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
              <p className="text-lg text-slate-400 mb-10">
                Have questions about HemoExchange AI? We&apos;re here to help.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Email</p>
                    <p className="text-slate-400">support@hemoexchange.ai</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Phone</p>
                    <p className="text-slate-400">+91 1800-XXX-XXXX (Toll Free)</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Address</p>
                    <p className="text-slate-400">
                      HemoExchange AI Pvt. Ltd.<br />
                      Mumbai, Maharashtra, India
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <form
                onSubmit={handleSubmit}
                className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 space-y-5"
              >
                <Input
                  label="Name"
                  placeholder="Your name"
                  required
                  className="!bg-white/5 !border-white/10 !text-white !placeholder:text-slate-500"
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@hospital.org"
                  required
                  className="!bg-white/5 !border-white/10 !text-white !placeholder:text-slate-500"
                />
                <Input
                  label="Organization"
                  placeholder="Hospital / Blood Bank name"
                  className="!bg-white/5 !border-white/10 !text-white !placeholder:text-slate-500"
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-300">Message</label>
                  <textarea
                    placeholder="How can we help?"
                    rows={4}
                    required
                    className="w-full rounded-xl border bg-white/5 border-white/10 px-4 py-2.5 text-sm text-white
                      placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500
                      transition-all duration-200 resize-none"
                  />
                </div>
                <Button type="submit" isLoading={isSubmitting} className="w-full">
                  Send Message
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
