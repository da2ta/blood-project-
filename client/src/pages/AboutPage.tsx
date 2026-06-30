import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Droplets,
  Shield,
  Users,
  Target,
  Award,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ROUTES } from '../constants';

const values = [
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Patient Safety First',
    description: 'Every feature is designed with patient safety as the non-negotiable priority.',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Collaboration Over Competition',
    description: 'Hospitals working together to ensure no patient is denied life-saving blood.',
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: 'Data-Driven Decisions',
    description: 'AI-powered insights to reduce wastage and predict demand — advisory only, never autonomous.',
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: 'Regulatory Compliance',
    description: 'Built for DPDP Act 2023 compliance with complete audit trails and data residency in India.',
  },
];

export function AboutPage() {
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
            <Link to={ROUTES.CONTACT} className="text-sm text-slate-300 hover:text-white transition-colors">
              Contact
            </Link>
            <Link to={ROUTES.LOGIN}>
              <Button size="sm">Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/3 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[128px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About HemoExchange AI
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed max-w-3xl mx-auto">
              HemoExchange AI is an enterprise-grade SaaS platform built exclusively for hospitals, 
              blood banks, medical colleges, and government health organizations to manage blood 
              inventory and exchange blood units across institutional networks.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              To ensure that no patient in India is denied a blood transfusion due to 
              hospital-level inventory gaps. By connecting hospitals digitally and enabling 
              instant blood exchange, we aim to bridge the critical gap between blood supply 
              and demand across the country.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, idx) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-5 p-6 rounded-2xl border border-white/5 bg-white/[0.02]"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex-shrink-0">
                  {value.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-slate-400">{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Join the Network</h2>
          <p className="text-slate-400 mb-6">Register your hospital today and be part of India&apos;s blood exchange ecosystem.</p>
          <Link to={ROUTES.REGISTER}>
            <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Register Your Hospital
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
