import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden selection:bg-gold/30">
      {/* Background Grid/Matrix Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Glitchy 404 */}
      <div className="relative z-10 text-center space-y-8 p-6">
        <motion.div
          animate={{
            x: mousePosition.x,
            y: mousePosition.y,
            textShadow: [
              "2px 2px 0px #FFD700",
              "-2px -2px 0px #00FFFF",
              "2px -2px 0px #FF00FF",
              "-2px 2px 0px #FFD700"
            ]
          }}
          transition={{
            textShadow: {
              repeat: Infinity,
              duration: 2,
              ease: "linear",
              repeatType: "reverse"
            },
            x: { type: "spring", stiffness: 50, damping: 20 },
            y: { type: "spring", stiffness: 50, damping: 20 }
          }}
          className="relative"
        >
          <h1 className="text-[150px] md:text-[200px] font-black font-orbitron leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 select-none">
            404
          </h1>
          <div className="absolute inset-0 text-[150px] md:text-[200px] font-black font-orbitron leading-none tracking-tighter text-gold/20 blur-sm select-none pointer-events-none">
            404
          </div>
        </motion.div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 text-gold font-mono text-lg"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>SYSTEM_MALFUNCTION</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl md:text-3xl font-bold text-gray-300 max-w-md mx-auto"
          >
            The page you are looking for has been disconnected from the MTRIX.
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link to="/">
            <Button className="bg-gradient-gold text-black hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all duration-300 px-8 py-6 text-lg font-bold rounded-none [clip-path:polygon(10%_0,100%_0,100%_70%,90%_100%,0_100%,0_30%)]">
              <Home className="mr-2 w-5 h-5" />
              RETURN TO BASE
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Decorative Code Snippets */}
      <div className="absolute top-10 left-10 text-xs font-mono text-green-500/20 hidden md:block select-none pointer-events-none">
        {`> INITIATING SEARCH_PROTOCOL...`}
        <br />
        {`> TARGET_NOT_FOUND`}
        <br />
        {`> ERROR_CODE: 0x404`}
        <br />
        {`> REROUTING... FAILED`}
      </div>

      <div className="absolute bottom-10 right-10 text-xs font-mono text-green-500/20 hidden md:block select-none pointer-events-none text-right">
        {`> SYSTEM_STATUS: CRITICAL`}
        <br />
        {`> MEMORY_DUMP: COMPLETE`}
        <br />
        {`> CONNECTION_LOST`}
      </div>
    </div>
  );
};

export default NotFound;
