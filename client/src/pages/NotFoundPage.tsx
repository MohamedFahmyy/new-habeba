import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Heart } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="text-8xl mb-6 animate-float">💔</div>
        <h1 className="text-4xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
        <p className="text-white/50 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/" className="btn-primary flex items-center gap-2">
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link to="/dashboard" className="btn-secondary flex items-center gap-2">
            <Heart className="w-4 h-4" /> My Gifts
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
