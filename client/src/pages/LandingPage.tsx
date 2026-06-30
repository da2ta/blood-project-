import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Droplets,
  Shield,
  Zap,
  BarChart3,
  Building2,
  ArrowRight,
  CheckCircle2,
  Clock,
  Globe2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassDock, GlassButton, GlassFilter, type DockIcon } from '../components/ui/liquid-glass';
import { ROUTES } from '../constants';

const features = [
  {
    icon: <Building2 className="w-6 h-6" />,
    title: 'Inter-Hospital Network',
    description:
      'Connect with hospitals nationwide. Share and request blood units seamlessly across your network.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Emergency Exchange',
    description:
      'Critical blood requests reach nearby hospitals in real-time. Save lives when every second counts.',
    gradient: 'from-red-500 to-orange-500',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Enterprise Security',
    description:
      'DPDP Act 2023 compliant. End-to-end audit trails, role-based access, and encrypted data storage.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'AI-Powered Insights',
    description:
      'Predict shortages, reduce wastage, and optimize inventory with intelligent analytics.',
    gradient: 'from-violet-500 to-purple-500',
  },
];

const stats = [
  { value: '99.9%', label: 'Uptime SLA', icon: <Clock className="w-5 h-5" /> },
  { value: '< 30s', label: 'Alert Delivery', icon: <Zap className="w-5 h-5" /> },
  { value: '100%', label: 'Audit Coverage', icon: <Shield className="w-5 h-5" /> },
  { value: 'Pan-India', label: 'Network Reach', icon: <Globe2 className="w-5 h-5" /> },
];

const benefits = [
  'Real-time blood inventory tracking across all 8 blood groups',
  'Automated expiry detection and low-stock alerts',
  'Complete audit trail for regulatory compliance',
  'QR code and barcode generation for every blood unit',
  'Role-based access control with multi-tier permissions',
  'PDF and Excel report generation',
];

export function LandingPage() {
  const navigate = useNavigate();

  const dockIcons: DockIcon[] = [
    { icon: <Building2 className="w-8 h-8" />, alt: "Hospitals", onClick: () => navigate(ROUTES.ABOUT) },
    { icon: <Droplets className="w-8 h-8 text-red-500" />, alt: "Blood", onClick: () => navigate(ROUTES.REGISTER) },
    { icon: <Zap className="w-8 h-8 text-yellow-400" />, alt: "Emergency", onClick: () => navigate(ROUTES.ABOUT) },
    { icon: <Shield className="w-8 h-8 text-emerald-400" />, alt: "Security", onClick: () => navigate(ROUTES.ABOUT) },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden"
         style={{
           backgroundImage: 'url("https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=2000&auto=format&fit=crop")',
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundAttachment: 'fixed',
           animation: 'moveBackground 120s linear infinite alternate'
         }}
    >
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-0" />
      <GlassFilter />
      <div className="relative z-10">
      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">HemoExchange</span>
          </Link>
          <div className="flex items-center gap-4 md:gap-8">
            <Link to={ROUTES.ABOUT} className="hidden md:block text-sm text-slate-300 hover:text-white transition-colors">
              About
            </Link>
            <Link to={ROUTES.CONTACT} className="hidden md:block text-sm text-slate-300 hover:text-white transition-colors">
              Contact
            </Link>
            <Link to={ROUTES.LOGIN}>
              <Button variant="ghost" size="sm" className="!text-slate-300 hover:!text-white px-2 md:px-4">
                Sign In
              </Button>
            </Link>
            <div className="hidden sm:block">
              <Link to={ROUTES.REGISTER}>
                <Button size="sm">Register Hospital</Button>
              </Link>
            </div>
            <div className="sm:hidden">
              <Link to={ROUTES.REGISTER}>
                <Button size="sm">Register</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        {/* Background effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-red-600/15 rounded-full blur-[128px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-blue-300">Enterprise Blood Management Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              Connecting Hospitals.
              <br />
              <span className="bg-gradient-to-r from-red-400 via-rose-400 to-orange-400 bg-clip-text text-transparent">
                Saving Lives.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              The secure, AI-powered platform for inter-hospital blood inventory management 
              and emergency blood exchange across India.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <GlassButton to={ROUTES.REGISTER}>
                <div className="flex items-center gap-2 text-lg text-white">
                  Register Your Hospital
                  <ArrowRight className="w-5 h-5" />
                </div>
              </GlassButton>
              <Link to={ROUTES.ABOUT}>
                <Button variant="outline" size="lg" className="!border-slate-600 !text-slate-300 hover:!bg-white/5 py-4">
                  Learn More
                </Button>
              </Link>
            </div>
            
            <div className="mt-10 md:mt-16 flex justify-center">
               <GlassDock icons={dockIcons} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-2 text-slate-400">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Healthcare Excellence
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Every feature designed with patient safety, regulatory compliance, 
              and operational efficiency in mind.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative p-8 rounded-2xl border border-white/5 bg-white/[0.02]
                  hover:bg-white/[0.04] transition-all duration-300"
              >
                <div
                  className={`
                    inline-flex items-center justify-center w-12 h-12 rounded-xl
                    bg-gradient-to-br ${feature.gradient} text-white mb-5
                    shadow-lg group-hover:scale-110 transition-transform duration-300
                  `}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Everything you need to manage blood inventory at scale
              </h2>
              <p className="text-lg text-slate-400 mb-8">
                From a single hospital to a national network — HemoExchange AI 
                scales with your organization.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-600/20 to-red-600/20 border border-white/5 p-8 flex items-center justify-center">
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-600">
                    <Droplets className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <p className="text-4xl font-bold">8</p>
                    <p className="text-slate-400">Blood Groups Tracked</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'].map((bg) => (
                      <div
                        key={bg}
                        className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-center text-sm font-mono"
                      >
                        {bg}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative text-center py-16 px-8 rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 -z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] -z-10" />

            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to transform your blood bank operations?
            </h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">
              Join India&apos;s most advanced inter-hospital blood management network. 
              Registration is free and takes less than 5 minutes.
            </p>
            <Link to={ROUTES.REGISTER}>
              <Button
                size="lg"
                className="!bg-white !text-blue-700 hover:!bg-blue-50"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Register Your Hospital Now
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
                <Droplets className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-300">HemoExchange AI</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to={ROUTES.ABOUT} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                About
              </Link>
              <Link to={ROUTES.CONTACT} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Contact
              </Link>
            </div>
            <p className="text-sm text-slate-600">
              © {new Date().getFullYear()} HemoExchange AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
