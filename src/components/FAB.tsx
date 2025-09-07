
import React, { useState } from 'react';
  import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import QuickAdd from './QuickAdd';
export default function FAB(){
  const [open, setOpen] = useState(false);
  return (
    <>
      <motion.button aria-label="Neu anlegen" onClick={()=>setOpen(true)} className="fixed z-40 bottom-20 right-4 md:right-6 rounded-full w-14 h-14 bg-gc-accent text-black shadow-lg" initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} whileHover={{scale:1.05}} whileTap={{scale:0.95}} transition={{type:'spring',stiffness:280,damping:20}}>
        <Plus className="mx-auto" />
      </motion.button>
      {open && <QuickAdd onClose={()=>setOpen(false)}/>}
    </>
  );
}
