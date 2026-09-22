'use client';

import { motion } from 'framer-motion';
import MainHeader from './header/MainHeader';
import CategoryMenu from './CategoryMenu';

const headerVariants = {
  hidden: { 
    y: -100, 
    opacity: 0,
    scale: 0.95
  },
  visible: { 
    y: 0, 
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      duration: 0.8,
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { 
    y: -50, 
    opacity: 0,
    scale: 0.9
  },
  visible: { 
    y: 0, 
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 15
    }
  }
};

export default function Navigation() {
  return (
    <motion.header 
      className="sticky top-0 z-50"
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <MainHeader />
      </motion.div>
      <motion.div variants={itemVariants}>
        <CategoryMenu />
      </motion.div>
    </motion.header>
  );
}
