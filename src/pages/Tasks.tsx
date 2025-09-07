import React from "react";
import { motion, AnimatePresence } from "framer-motion";

type AnyTask = { [k: string]: any };

export default function Tasks() {
  const tasks: AnyTask[] = Array.isArray((window as any).__TASKS__)
    ? (window as any).__TASKS__
    : [];

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-3">Tasks</h2>
      <AnimatePresence initial={false}>
        {tasks.map((t, i) => (
          <motion.div
            key={t.id ?? i}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border rounded-xl p-3 mb-2"
          >
            <div className="font-medium">{t.title ?? "Task"}</div>
            <div className="text-sm opacity-70">{t.description ?? ""}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}