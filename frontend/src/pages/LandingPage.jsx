import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import '@fontsource/geist-sans';
import { 
  Play, Activity, PlayCircle, Settings, CheckCircle2, Cloud, ArrowRight, Video
} from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-md border-b border-gray-200 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C63FF] to-[#8B5CF6] flex items-center justify-center shadow-sm">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">VideoVault</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Sign In</Link>
          <Link to="/register" className="text-sm font-medium bg-[#0B1020] text-white px-4 py-2 rounded-full hover:bg-slate-800 transition-colors shadow-md">Get Started</Link>
        </div>
      </div>
    </nav>
  );
};

const FloatingDashboardMockup = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, rotateX: 20 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="relative w-full max-w-lg aspect-square"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#6C63FF]/20 to-[#8B5CF6]/20 blur-3xl rounded-full" />
      
      {/* Main Glass Panel */}
      <motion.div 
        animate={{ y: [-10, 10, -10] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        className="absolute inset-4 rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-xl shadow-2xl p-6 flex flex-col gap-4 overflow-hidden"
      >
        {/* Header Mock */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#8B5CF6] p-0.5">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#6C63FF]" />
              </div>
            </div>
            <div>
              <div className="h-3 w-24 bg-slate-200 rounded-full mb-2" />
              <div className="h-2 w-16 bg-slate-100 rounded-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
            <div className="w-2 h-2 rounded-full bg-slate-200" />
            <div className="w-2 h-2 rounded-full bg-slate-200" />
          </div>
        </div>

        {/* Video Player Mock */}
        <div className="relative w-full h-40 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
          <PlayCircle className="w-12 h-12 text-white/50" />
          <div className="absolute bottom-3 left-3 right-3 flex gap-2 items-center">
            <div className="w-2 h-2 rounded-full bg-[#6C63FF]" />
            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="w-1/3 h-full bg-gradient-to-r from-[#6C63FF] to-[#8B5CF6]" />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-50 p-4 border border-gray-100">
            <div className="h-2 w-12 bg-slate-200 rounded-full mb-3" />
            <div className="text-2xl font-bold text-slate-800">2.4M</div>
            <div className="h-1 w-full bg-green-100 rounded-full mt-2 overflow-hidden">
              <div className="w-3/4 h-full bg-green-500" />
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 border border-gray-100">
            <div className="h-2 w-16 bg-slate-200 rounded-full mb-3" />
            <div className="text-2xl font-bold text-slate-800">99.9%</div>
            <div className="h-1 w-full bg-[#6C63FF]/20 rounded-full mt-2 overflow-hidden">
              <div className="w-[99%] h-full bg-[#6C63FF]" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Elements */}
      <motion.div 
        animate={{ y: [10, -10, 10] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
        className="absolute -right-8 top-20 rounded-xl bg-white/95 backdrop-blur-lg border border-gray-200 p-4 flex items-center gap-3 shadow-xl"
      >
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <div className="text-xs text-slate-500">Moderation</div>
          <div className="text-sm font-semibold text-slate-900">Clean Video</div>
        </div>
      </motion.div>

      <motion.div 
        animate={{ y: [-15, 15, -15] }}
        transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 0.5 }}
        className="absolute -left-10 bottom-24 rounded-xl bg-white/95 backdrop-blur-lg border border-gray-200 p-4 flex items-center gap-3 shadow-xl"
      >
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Cloud className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <div className="text-xs text-slate-500">Upload</div>
          <div className="text-sm font-semibold text-slate-900">100% Complete</div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-surface text-slate-900 selection:bg-[#6C63FF]/30 font-body-md overflow-x-hidden flex flex-col">
      
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <Navbar />

      {/* Hero Section */}
      <main className="flex-grow flex items-center pt-20">
        <section className="relative px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 z-10 w-full py-16">
          <motion.div className="flex-1 flex flex-col items-start"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]" style={{ fontFamily: '"Geist Sans", sans-serif' }}>
              Manage videos with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C63FF] to-[#8B5CF6]">AI precision.</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-xl leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              The world's most advanced video infrastructure. Secure streaming, automated AI moderation, and real-time analytics designed for scale.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/register" className="flex items-center gap-2 bg-gradient-to-r from-[#6C63FF] to-[#8B5CF6] text-white px-6 py-3 rounded-full font-medium shadow-lg shadow-[#6C63FF]/30 transition-all transform hover:-translate-y-0.5">
                Start Building <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="flex items-center gap-2 bg-white border border-gray-200 text-slate-700 px-6 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors shadow-sm">
                <Play className="w-4 h-4" /> View Demo
              </Link>
            </div>
          </motion.div>

          <div className="flex-1 flex justify-center lg:justify-end w-full">
            <FloatingDashboardMockup />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 px-6 relative z-10 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[#6C63FF] to-[#8B5CF6] flex items-center justify-center">
              <Video className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-slate-900">VideoVault</span>
          </div>
          <div className="text-sm text-slate-500">
            © 2026 VideoVault Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
