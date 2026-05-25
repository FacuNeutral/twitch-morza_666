import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tv, VolumeX, Palette, Video, Image, Check, X, RotateCcw, Edit, Plus, Trash2, Settings } from 'lucide-react';
import mainBg from './assets/main.png';
import mainVideo from './assets/main.mp4';

// Pasos por defecto del menú central
const DEFAULT_STEPS = [
  { label: "Poner la pava", duration: 30 },
  { label: "Se me desinfla perrito", duration: 5 },
  { label: "Sacar al Aurelio", duration: 40 },
  { label: "Hacer la montañita", duration: 60 },
  { label: "Hervir a 80° mas o menos", duration: 120 },
  { label: "Apagar la pava", duration: 10 },
  { label: "Llenar el termo", duration: 20 },
  { label: "Sevar el matecito", duration: 10 },
  { label: "Entrar al Aurelio", duration: 30 },
  { label: "Te escucho Morza...", duration: 100 },
];

// ─── Círculo de progreso retro (SVG puro + Framer Motion) ───────────────────
function RetroRing({ timeLeft, total, size = 64, textColor = '#FF2E2E' }: { timeLeft: number; total: number; size?: number; textColor?: string }) {
  const stroke = 3.5;
  const margin = size * 0.07;
  const armLen = size * 0.3;
  const cx = size / 2;
  const progress = total > 0 ? timeLeft / total : 0;

  // Los brazos se acortan conforme avanza el tiempo (de armLen a armLen*0.4)
  const arm = armLen * (0.4 + 0.6 * progress);

  const x0 = margin, x1 = size - margin;
  const y0 = margin, y1 = size - margin;

  const corners = [
    `M ${x0} ${y0 + arm} L ${x0} ${y0} L ${x0 + arm} ${y0}`,
    `M ${x1 - arm} ${y0} L ${x1} ${y0} L ${x1} ${y0 + arm}`,
    `M ${x0} ${y1 - arm} L ${x0} ${y1} L ${x0 + arm} ${y1}`,
    `M ${x1 - arm} ${y1} L ${x1} ${y1} L ${x1} ${y1 - arm}`,
  ];

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {corners.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke={textColor}
          strokeWidth={stroke}
          strokeLinecap="square"
          style={{ filter: `drop-shadow(0 0 4px ${textColor}b3)` }}
          animate={{ opacity: [1, 0.55, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.08 }}
        />
      ))}
      <text
        x={cx} y={cx + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textColor}
        fontSize={size * 0.26}
        fontFamily="'Press Start 2P', monospace"
        style={{ letterSpacing: '-0.5px' }}
      >
        {timeLeft}
      </text>
    </svg>
  );
}

// Efecto de escritura rápida con ... parpadeante al final
function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 45);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {displayed}
      {done ? (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        ></motion.span>
      ) : (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: 'linear' }}
        >_</motion.span>
      )}
    </span>
  );
}

// Sega Genesis/Megadrive style interactive menu component
function SegaMenu({ textColor, resetKey, steps }: { textColor: string; resetKey: number; steps: typeof DEFAULT_STEPS }) {

  const resolvedSteps = useMemo(() => {
    const useReducer = import.meta.env.VITE_SPEED_REDUCER === 'true';
    return steps.map(s => ({
      ...s,
      duration: useReducer ? 2 : s.duration
    }));
  }, [steps]);

  const [currentStep, setCurrentStep] = useState(0);
  const [stepTimes, setStepTimes] = useState(() => resolvedSteps.map(s => s.duration));
  const [allCompleted, setAllCompleted] = useState(false);

  // Refs para evitar closures estancados y saltos de pasos
  const currentStepRef = useRef(0);
  const stepTimesRef = useRef(resolvedSteps.map(s => s.duration));

  // Sincronizar refs cuando cambia resolvedSteps (p.ej. al montar)
  useEffect(() => {
    stepTimesRef.current = resolvedSteps.map(s => s.duration);
    setStepTimes([...stepTimesRef.current]);
    currentStepRef.current = 0;
    setCurrentStep(0);
    setAllCompleted(false);
  }, [resolvedSteps]);

  // Countdown: usa refs para garantizar secuencia sin saltos
  useEffect(() => {
    if (allCompleted) return;

    const timer = setInterval(() => {
      const step = currentStepRef.current;
      const times = [...stepTimesRef.current];

      if (times[step] <= 1) {
        times[step] = 0;
        stepTimesRef.current = times;
        setStepTimes([...times]);

        const next = step + 1;
        if (next >= steps.length) {
          setAllCompleted(true);
        } else {
          currentStepRef.current = next;
          setCurrentStep(next);
        }
      } else {
        times[step] -= 1;
        stepTimesRef.current = times;
        setStepTimes([...times]);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [allCompleted, steps.length]);

  // Reinicio inmediato al completar todos los pasos
  const handleReset = useCallback(() => {
    const fresh = resolvedSteps.map(s => s.duration);
    stepTimesRef.current = fresh;
    setStepTimes([...fresh]);
    currentStepRef.current = 0;
    setCurrentStep(0);
    setAllCompleted(false);
  }, [resolvedSteps]);

  useEffect(() => {
    if (!allCompleted) return;
    const resetTimeout = setTimeout(() => handleReset(), 1000);
    return () => clearTimeout(resetTimeout);
  }, [allCompleted, handleReset]);

  // Reset externo (botón o atajo de teclado)
  useEffect(() => {
    if (resetKey === 0) return;
    handleReset();
  }, [resetKey, handleReset]);

  return (
    <div 
      className="flex flex-col items-center justify-center gap-14 select-none w-full max-w-full"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        textAlign: 'center'
      }}
    >
      {/* Menu Options (No black box container, items in soft pastel white and light grays) */}
      <div
        className="w-full flex flex-col items-center justify-center"
        style={{ 
          fontFamily: "'Press Start 2P', monospace",
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div 
          className="flex flex-col gap-6 text-left w-fit max-w-full px-4"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start'
          }}
        >
          {resolvedSteps.map((step, index) => {
            const isActive = index === currentStep && !allCompleted;
            const isCompleted = stepTimes[index] === 0;
            const timeLeft = stepTimes[index];

            const color = isActive ? textColor : isCompleted ? textColor : '#737373';

            return (
              <motion.div
                key={index}
                className="flex items-center gap-4 text-base md:text-lg lg:text-2xl tracking-wide uppercase px-4 py-2 rounded-md w-full transition-colors duration-300"
                style={{ color, fontWeight: isActive ? 'bold' : 'normal' }}
                animate={isActive ? {
                  backgroundColor: [
                    "rgba(0, 0, 0, 0.2)",
                    "rgba(0, 0, 0, 0.6)",
                    "rgba(0, 0, 0, 0.2)"
                  ]
                } : isCompleted ? {
                  backgroundColor: "rgba(0, 0, 0, 0.5)"
                } : {
                  backgroundColor: "rgba(0, 0, 0, 0)"
                }}
                transition={isActive ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : {}}
              >
                {/* Label (animated only if active) */}
                {isActive ? (
                  <motion.span
                    animate={{ x: [0, 6, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block flex-1"
                    style={{ color: textColor }}
                  >
                    {step.label}
                  </motion.span>
                ) : isCompleted ? (
                  <span className="flex-1" style={{ color: textColor }}>{step.label}</span>
                ) : (
                  <span className="flex-1" style={{ color: '#737373' }}>{step.label}</span>
                )}

                {/* Timer: anillo retro si activo, punto si completado, texto si pendiente */}
                {isActive ? (
                  <RetroRing timeLeft={timeLeft} total={step.duration} size={56} textColor={textColor} />
                ) : isCompleted ? (
                  <div className="w-5 h-5 flex-none" style={{ backgroundColor: textColor }} />
                ) : (
                  <span className="tabular-nums text-xs md:text-base font-normal flex-none" style={{ color: '#737373' }}>
                    [{timeLeft}]
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Paleta de presets estéticos para el selector de color
const COLOR_PRESETS = [
  { name: 'Retro Red', value: '#FF2E2E' },
  { name: 'Classic Amber', value: '#FFB000' },
  { name: 'Matrix Green', value: '#39FF14' },
  { name: 'Vapor Wave', value: '#FF007F' },
  { name: 'Electric Blue', value: '#00E5FF' },
  { name: 'Neon Purple', value: '#BD00FF' },
  { name: 'GitHub Blue', value: '#58a6ff' },
  { name: 'Blanco Crema', value: '#FDF6E3' },
  { name: 'Amarillo', value: '#FFEE55' },
];

export default function App() {
  // Sincronización con Local Storage al inicio
  const [textColor, setTextColor] = useState(() => {
    return localStorage.getItem('mc_textColor') || '#FF2E2E';
  });
  const [useVideoBg, setUseVideoBg] = useState(() => {
    const val = localStorage.getItem('mc_useVideoBg');
    return val !== null ? val === 'true' : false;
  });

  const [steps, setSteps] = useState<typeof DEFAULT_STEPS>(() => {
    const saved = localStorage.getItem('mc_steps');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_STEPS;
  });

  useEffect(() => {
    localStorage.setItem('mc_steps', JSON.stringify(steps));
  }, [steps]);

  const [showStepsModal, setShowStepsModal] = useState(false);
  const [tempSteps, setTempSteps] = useState<typeof DEFAULT_STEPS>([]);

  const [titleSize, setTitleSize] = useState<'S' | 'M' | 'L'>(() => {
    const val = localStorage.getItem('mc_titleSize');
    return (val === 'S' || val === 'M' || val === 'L') ? val : 'M';
  });

  const shakeAndFlash = useMemo(() => {
    const val = localStorage.getItem('mc_shakeAndFlash');
    return val !== null ? val === 'true' : true;
  }, []);

  const signalGlitch = useMemo(() => {
    const val = localStorage.getItem('mc_signalGlitch');
    return val !== null ? val === 'true' : true;
  }, []);

  // Guardar automáticamente en Local Storage tras cada cambio
  useEffect(() => {
    localStorage.setItem('mc_textColor', textColor);
  }, [textColor]);

  useEffect(() => {
    localStorage.setItem('mc_useVideoBg', String(useVideoBg));
  }, [useVideoBg]);

  useEffect(() => {
    localStorage.setItem('mc_titleSize', titleSize);
  }, [titleSize]);

  const titleSizeClass = titleSize === 'S'
    ? 'text-xs md:text-sm lg:text-base'
    : titleSize === 'L'
    ? 'text-2xl md:text-6xl lg:text-8xl'
    : 'text-base md:text-3xl lg:text-4xl';

  // Live ticking values for VCR/CRT overlay
  const [resetKey, setResetKey] = useState(0);

  const [timeStr, setTimeStr] = useState('00:00:00');
  const [dateStr, setDateStr] = useState('20 MAY 2026');
  const [phrase, setPhrase] = useState('REGRESO EN UN MOMENTO...');

  useEffect(() => {
    const phrases = ['REGRESO EN UN MOMENTO...', 'ME FUI A HACER UN MATECITO'];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % phrases.length;
      setPhrase(phrases[index]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Custom states for TV control
  const [isTvOn, setIsTvOn] = useState(true);
  const [showVcrMenu, setShowVcrMenu] = useState(true);
  const [isGlitching, setIsGlitching] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [tempColor, setTempColor] = useState(textColor);

  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Control core of loop-to-end with off-and-on screen glitch effect on video end
  useEffect(() => {
    if (!useVideoBg) return;

    const video = videoRef.current;
    if (!video) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const triggerGlitchLoop = () => {
      if (timeoutId) return; // Prevent multiple concurrent triggers

      setIsGlitching(true);
      video.pause();

      timeoutId = setTimeout(() => {
        video.currentTime = 0;
        setIsGlitching(false);
        timeoutId = null;
        if (isTvOn) {
          video.play().catch(() => {});
        }
      }, 350); // Glitch duration matching the restored CRT turn-off delay
    };

    const handleEnded = () => {
      triggerGlitchLoop();
    };

    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime >= video.duration - 0.08) {
        triggerGlitchLoop();
      }
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isTvOn, useVideoBg]);

  // Synchronize playing/pausing of video with isTvOn and isGlitching state
  useEffect(() => {
    if (!useVideoBg) {
      if (videoRef.current) videoRef.current.pause();
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    if (isTvOn && !isGlitching) {
      video.play().catch((err) => {
        console.log("Auto-play was prevented or video not ready", err);
      });
    } else {
      video.pause();
    }
  }, [isTvOn, isGlitching, useVideoBg]);

  // Efecto de pérdida de señal / glitch de apagado rápido cada 20 segundos (solo para imagen de fondo)
  useEffect(() => {
    if (useVideoBg || !signalGlitch) return;

    const glitchInterval = setInterval(() => {
      setIsGlitching(true);
      const restoreTimeout = setTimeout(() => {
        setIsGlitching(false);
      }, Math.random() * 300 + 300);
      return () => clearTimeout(restoreTimeout);
    }, 20000);

    return () => clearInterval(glitchInterval);
  }, [useVideoBg, signalGlitch]);

  // Manejar visibilidad del botón de configuración superior (desvanece tras inactividad)
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
      const hideDelay = showConfigMenu || showColorModal || showStepsModal ? 10000 : 2500;
      hideControlsTimer.current = setTimeout(() => {
        if (!showConfigMenu && !showColorModal && !showStepsModal) {
          setShowControls(false);
        }
      }, hideDelay);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [showColorModal, showConfigMenu, showStepsModal]);

  // Atajo de teclado Ctrl+Shift+R para resetear el contador
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        setResetKey(k => k + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update Clock
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0]);

      const day = now.getDate();
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      setDateStr(`${day < 10 ? '0' + day : day} ${month} ${year}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 flex flex-col justify-between font-mono select-none">

      {/* CONTENEDOR DE LA TV DE TUBO (CRT) */}
      <div className="absolute inset-0 w-full h-full crt-container bg-black">

        {/* Pantalla CRT física con temblequeo/parpadeo de brillo y glitch de señal condicionales */}
        <div className={`w-full h-full crt-screen relative flex items-center justify-center transition-all duration-500 ${!isTvOn || isGlitching ? 'screen-off' : 'screen-on'
          } ${shakeAndFlash && isTvOn && !isGlitching ? 'crt-shake-and-flash' : ''}`}>

          {/* 1. IMAGEN O VIDEO DE FONDO: 100% de la pantalla, NO RECORTADA */}
          <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden rounded-[2.5rem]">
            {/* Animación de vibración de distorsión cromática / temblor analógico de TV antigua usando Framer motion */}
            {useVideoBg ? (
              <motion.video
                ref={videoRef}
                src={mainVideo}
                className="w-full h-full object-cover pointer-events-none opacity-85 select-none rounded-[2.5rem]"
                muted
                playsInline
                autoPlay
                animate={isTvOn ? {
                  x: [-0.5, 0.5, -0.3, 0.3, 0],
                  y: [0.3, -0.3, 0.5, -0.5, 0],
                  filter: [
                    "brightness(1) contrast(1.02) hue-rotate(0deg)",
                    "brightness(0.99) contrast(0.99) hue-rotate(1deg)",
                    "brightness(1.02) contrast(1.02) hue-rotate(-1deg)",
                    "brightness(1) contrast(1.01) hue-rotate(0deg)"
                  ]
                } : {}}
                transition={{
                  duration: 0.18,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "linear"
                }}
              />
            ) : (
              <motion.img
                src={mainBg}
                alt="Main Background"
                className="w-full object-container pointer-events-none opacity-85 select-none rounded-[1rem]"
                style={{borderRadius: '1rem'}}
                animate={isTvOn ? {
                  x: [-0.5, 0.5, -0.3, 0.3, 0],
                  y: [0.3, -0.3, 0.5, -0.5, 0],
                  filter: [
                    "brightness(1) contrast(1.02) hue-rotate(0deg)",
                    "brightness(0.99) contrast(0.99) hue-rotate(1deg)",
                    "brightness(1.02) contrast(1.02) hue-rotate(-1deg)",
                    "brightness(1) contrast(1.01) hue-rotate(0deg)"
                  ]
                } : {}}
                transition={{
                  duration: 0.18,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "linear"
                }}
              />
            )}
          </div>

          {/* 2. EFECTOS RETRO CRT SOBRE LA IMAGEN */}
          {isTvOn && (
            <>
              {/* Reflejos de cristal curvo de la TV */}
              <div className="crt-glare" />
              {/* Líneas de escaneo / scanlines */}
              <div className="crt-scanlines opacity-75" />
              {/* Ruido estático analógico animado */}
              <div className="crt-static opacity-[0.14]" />
              {/* Barra de escaneo descendente */}
              <div className="crt-roll-bar opacity-80" />
              {/* Parpadeo sutil de fósforo */}
              <div className="absolute inset-0 bg-transparent crt-flicker-effect pointer-events-none z-6" />
              {/* Viñeteado retro de esquinas oscuras */}
              <div className="vignette" />
            </>
          )}

          {/* 3. CAPA DE INTERFAZ DE VIDRIO (GLASSMORPHISM) POR ENCIMA */}
          <AnimatePresence>
            {isTvOn && (
              <div className="relative z-30 w-full h-full flex flex-col items-center justify-center p-4">

                {/* OSD (On-Screen Display) Menu en las esquinas */}
                {showVcrMenu && (
                  <div className="absolute inset-0 p-6 md:p-10 pointer-events-none flex flex-col justify-between text-xs md:text-sm tracking-widest leading-relaxed uppercase" style={{ fontFamily: "'Press Start 2P', monospace", color: textColor, textShadow: `0 0 4px ${textColor}` }}>
                    <div className="flex justify-between w-full items-start">
                      <div className="flex items-center gap-2.5 font-bold">
                        <div className="w-4 h-4 mb-0.5 rounded-full shrink-0" style={{ backgroundColor: textColor, boxShadow: `0 0 6px ${textColor}` }}></div>
                        <span>REC</span>
                      </div>
                      <div className={`flex-1 text-center px-4 animate-pulse ${titleSizeClass}`}>
                        <TypewriterText key={phrase} text={phrase} />
                      </div>
                      <div className="flex items-center gap-2.5 font-bold">
                        <VolumeX className="w-4 h-4 shrink-0 mb-0.5" strokeWidth={3} style={{ filter: `drop-shadow(0 0 6px ${textColor})` }} />
                        <span>MUTE</span>
                      </div>
                    </div>

                    <div className="flex justify-between w-full items-end">
                      <div className="flex flex-col gap-1">
                        <div>COCINA DEL MORZA</div>
                        <div>{dateStr}</div>
                      </div>
                      <div className="text-right flex flex-col gap-1">
                        <div className="tabular-nums">{timeStr}</div>
                        <div>CH 03</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* EL CARTEL DE VIDRIO EN EL CENTRO EXACTO (ESTILO SEGA) */}
                <div className="relative z-40 flex flex-col items-center justify-center gap-6">
                  {/* Menú Sega */}
                  <SegaMenu textColor={textColor} resetKey={resetKey} steps={steps} />
                </div>

              </div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* PANEL DE CONFIGURACIÓN / BOTÓN SUPERIOR FLOTANTE - Dibujado al final para quedar encima de la TV */}
      <div
        className="absolute top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300"
        style={{
          opacity: showControls || showConfigMenu ? 1 : 0,
          pointerEvents: showControls || showConfigMenu ? 'auto' : 'none',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
        onMouseEnter={() => {
          if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
        }}
      >
        <button
          onClick={() => setShowConfigMenu(true)}
          className="flex items-center gap-3 px-8 py-4 text-sm md:text-base font-bold bg-black border rounded-lg shadow-2xl transition-all duration-200 cursor-pointer"
          style={{
            borderColor: textColor,
            color: textColor,
            boxShadow: `0 0 15px ${textColor}44`
          }}
        >
          <Settings className="w-5 h-5 animate-spin-slow animate-pulse" />
          <span>MENÚ DE CONFIGURACIÓN</span>
        </button>
      </div>

      {/* MENÚ CENTRAL DE CONFIGURACIÓN DIRECTO (CON FONDO OSCURECIDO Y DISEÑO DOS COLORES) */}
      <AnimatePresence>
        {showConfigMenu && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="border p-6 w-full max-w-lg rounded-2xl shadow-2xl bg-black"
              style={{
                borderColor: textColor,
                color: textColor,
                boxShadow: `0 0 25px ${textColor}40`,
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: `${textColor}33` }}>
                <div className="flex items-center gap-2 text-base font-bold tracking-wider">
                  <Settings className="w-5 h-5" />
                  <span>SISTEMA DE CONFIGURACIÓN</span>
                </div>
                <button
                  onClick={() => setShowConfigMenu(false)}
                  className="p-1.5 rounded-md border transition-all cursor-pointer bg-black"
                  style={{
                    borderColor: textColor,
                    color: textColor
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid de opciones principales */}
              <div className="flex flex-col gap-4 mb-6">
                
                {/* TV Power y OSD Menú */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setIsTvOn(!isTvOn);
                    }}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-bold tracking-wider transition-all cursor-pointer bg-black"
                    style={{
                      borderColor: textColor,
                      color: isTvOn ? '#000000' : textColor,
                      backgroundColor: isTvOn ? textColor : 'transparent',
                    }}
                  >
                    <Tv className="w-4 h-4" />
                    <span>TV POWER: {isTvOn ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    onClick={() => setShowVcrMenu(!showVcrMenu)}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-bold tracking-wider transition-all cursor-pointer bg-black"
                    style={{
                      borderColor: textColor,
                      color: showVcrMenu ? '#000000' : textColor,
                      backgroundColor: showVcrMenu ? textColor : 'transparent',
                    }}
                  >
                    <span>OSD MENU: {showVcrMenu ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                {/* Fondo (Video/Foto) y Reset Contador */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setUseVideoBg(!useVideoBg)}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-bold tracking-wider transition-all cursor-pointer bg-black"
                    style={{
                      borderColor: textColor,
                      color: textColor,
                    }}
                  >
                    {useVideoBg ? <Video className="w-4 h-4" /> : <Image className="w-4 h-4" />}
                    <span>FONDO: {useVideoBg ? 'VIDEO' : 'FOTO'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setResetKey(k => k + 1);
                      setShowConfigMenu(false);
                    }}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-bold tracking-wider transition-all cursor-pointer bg-black"
                    style={{
                      borderColor: textColor,
                      color: textColor,
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>REINICIAR (RESET)</span>
                  </button>
                </div>

                {/* Selector de escala de título */}
                <div className="border p-4 rounded-xl flex flex-col gap-2" style={{ borderColor: `${textColor}33` }}>
                  <span className="text-xs font-bold uppercase tracking-wider block text-center">TAMAÑO DEL TÍTULO</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['S', 'M', 'L'] as const).map((size) => {
                      const isSelected = titleSize === size;
                      return (
                        <button
                          key={size}
                          onClick={() => setTitleSize(size)}
                          className="py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer bg-black"
                          style={{
                            borderColor: textColor,
                            color: isSelected ? '#000000' : textColor,
                            backgroundColor: isSelected ? textColor : 'transparent',
                          }}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Botonera de Modales Subordinados */}
              <div className="flex gap-4 border-t pt-5" style={{ borderColor: `${textColor}33` }}>
                <button
                  type="button"
                  onClick={() => {
                    setTempColor(textColor);
                    setShowColorModal(true);
                    setShowConfigMenu(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-bold tracking-wider transition-all cursor-pointer bg-black"
                  style={{
                    borderColor: textColor,
                    color: textColor
                  }}
                >
                  <Palette className="w-4 h-4" />
                  <span>AJUSTAR COLOR</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTempSteps(JSON.parse(JSON.stringify(steps)));
                    setShowStepsModal(true);
                    setShowConfigMenu(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-bold tracking-wider transition-all cursor-pointer bg-black"
                  style={{
                    borderColor: textColor,
                    color: textColor
                  }}
                >
                  <Edit className="w-4 h-4" />
                  <span>EDITAR PASOS</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE SELECCIÓN DE COLOR SOFISTICADO */}
      <AnimatePresence>
        {showColorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="border p-6 w-full max-w-sm rounded-2xl shadow-2xl bg-black"
              style={{
                borderColor: textColor,
                color: textColor,
                boxShadow: `0 0 25px ${textColor}40`,
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: `${textColor}33` }}>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Palette className="w-4 h-4" />
                  <span>AJUSTES DE COLORES TV</span>
                </div>
                <button
                  onClick={() => setShowColorModal(false)}
                  className="p-1 rounded-md border transition-all cursor-pointer bg-black"
                  style={{
                    borderColor: textColor,
                    color: textColor
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selector de Presets */}
              <div className="mb-4">
                <span className="block text-xs font-semibold mb-2.5 uppercase tracking-wider">
                  PALETAS PREDEFINIDAS
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_PRESETS.map((preset) => {
                    const isSelected = tempColor === preset.value;
                    return (
                      <button
                        key={preset.value}
                        onClick={() => setTempColor(preset.value)}
                        className="group relative flex flex-col items-center justify-center p-2 rounded-md border bg-black transition-all cursor-pointer"
                        style={{
                          borderColor: isSelected ? textColor : `${textColor}33`,
                        }}
                        title={preset.name}
                      >
                        <div
                          className="w-5 h-5 rounded-full border border-white/15 shadow-inner transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: preset.value,
                            boxShadow: `0 0 8px ${preset.value}40`
                          }}
                        />
                        <span className="text-[9px] font-medium truncate w-full text-center mt-1" style={{ color: textColor }}>
                          {preset.name}
                        </span>
                        {isSelected && (
                          <div className="absolute top-1 right-1 p-0.5 rounded-full" style={{ backgroundColor: textColor }}>
                            <Check className="w-2 h-2 text-black" strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Personalizado */}
              <div className="mb-5 border-t pt-3.5" style={{ borderColor: `${textColor}33` }}>
                <span className="block text-xs font-semibold mb-2 uppercase tracking-wider">
                  COLOR HEX PERSONALIZADO
                </span>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      className="w-full pl-8 pr-3 py-1.5 bg-black border rounded-md text-xs font-mono focus:outline-none"
                      style={{
                        borderColor: textColor,
                        color: textColor
                      }}
                      value={tempColor.toUpperCase()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.startsWith('#') || val.length <= 7) {
                          setTempColor(val);
                        }
                      }}
                      placeholder="#FF2E2E"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono" style={{ color: `${textColor}88` }}>
                      #
                    </span>
                  </div>
                  
                  {/* Color Picker Nativo estilizado */}
                  <div className="relative w-8 h-8 rounded-md overflow-hidden border bg-black" style={{ borderColor: textColor }}>
                    <input
                      type="color"
                      className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] cursor-pointer"
                      value={tempColor.startsWith('#') && tempColor.length === 7 ? tempColor : '#FF2E2E'}
                      onChange={(e) => setTempColor(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-2 border-t pt-3" style={{ borderColor: `${textColor}33` }}>
                <button
                  type="button"
                  onClick={() => setShowColorModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border transition duration-150 cursor-pointer bg-black"
                  style={{
                    borderColor: textColor,
                    color: textColor
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTextColor(tempColor);
                    setShowColorModal(false);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition duration-150 cursor-pointer text-black"
                  style={{
                    backgroundColor: textColor,
                    color: '#000000'
                  }}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aplicar Cambio</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE EDICIÓN DE PASOS DEL MENÚ CENTRAL */}
      <AnimatePresence>
        {showStepsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="border p-6 w-full max-w-xl rounded-2xl shadow-2xl bg-black"
              style={{
                borderColor: textColor,
                color: textColor,
                boxShadow: `0 0 25px ${textColor}40`,
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: `${textColor}33` }}>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Edit className="w-4 h-4" />
                  <span>AJUSTES DEL MENÚ CENTRAL (Max. 10)</span>
                </div>
                <button
                  onClick={() => setShowStepsModal(false)}
                  className="p-1 rounded-md border transition-all cursor-pointer bg-black"
                  style={{
                    borderColor: textColor,
                    color: textColor
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Lista de Pasos */}
              <div className="max-h-[50vh] overflow-y-auto flex flex-col gap-3 pr-2 scrollbar-thin scrollbar-thumb-neutral-800">
                {tempSteps.map((step, index) => (
                  <div key={index} className="flex gap-2 items-center border p-2.5 rounded-md bg-black" style={{ borderColor: `${textColor}22` }}>
                    <span className="font-mono text-xs w-6 text-center font-bold">
                      {index + 1}
                    </span>
                    
                    <input
                      type="text"
                      className="flex-1 min-w-0 px-2.5 py-1.5 bg-black border rounded-md text-xs focus:outline-none"
                      style={{
                        borderColor: textColor,
                        color: textColor
                      }}
                      value={step.label}
                      onChange={(e) => {
                        const newTemp = [...tempSteps];
                        newTemp[index] = { ...newTemp[index], label: e.target.value };
                        setTempSteps(newTemp);
                      }}
                      placeholder="Nombre de la acción..."
                    />

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="3600"
                        className="w-16 px-2 py-1.5 bg-black border rounded-md text-xs text-center focus:outline-none font-mono"
                        style={{
                          borderColor: textColor,
                          color: textColor
                        }}
                        value={step.duration}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 1;
                          const newTemp = [...tempSteps];
                          newTemp[index] = { ...newTemp[index], duration: val };
                          setTempSteps(newTemp);
                        }}
                      />
                      <span className="text-[10px] font-semibold font-mono pr-1">s</span>
                    </div>

                    <button
                      type="button"
                      disabled={tempSteps.length <= 1}
                      onClick={() => {
                        const newTemp = tempSteps.filter((_, i) => i !== index);
                        setTempSteps(newTemp);
                      }}
                      className="p-1.5 rounded disabled:opacity-40 transition-colors cursor-pointer bg-black border"
                      style={{
                        borderColor: textColor,
                        color: textColor
                      }}
                      title="Eliminar paso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Botón Añadir Paso */}
              <div className="mt-3.5 flex justify-between items-center">
                <span className="text-xs">
                  Pasos: <strong>{tempSteps.length}</strong> / 10
                </span>
                {tempSteps.length < 10 && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempSteps([...tempSteps, { label: "Nuevo Paso", duration: 10 }]);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md transition duration-150 cursor-pointer bg-black border"
                    style={{
                      borderColor: textColor,
                      color: textColor
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir Paso</span>
                  </button>
                )}
              </div>

              {/* Acciones del Modal */}
              <div className="flex justify-between items-center gap-2 border-t pt-3.5 mt-4" style={{ borderColor: `${textColor}33` }}>
                <button
                  type="button"
                  onClick={() => setTempSteps(JSON.parse(JSON.stringify(DEFAULT_STEPS)))}
                  className="px-3 py-1.5 text-xs rounded-md transition duration-150 cursor-pointer bg-black border border-red-500/50 hover:bg-red-500/10"
                  style={{
                    color: textColor
                  }}
                  title="Restablecer a pasos originales"
                >
                  Restablecer
                </button>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStepsModal(false)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md transition duration-150 cursor-pointer bg-black border"
                    style={{
                      borderColor: textColor,
                      color: textColor
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSteps(tempSteps);
                      setResetKey(k => k + 1); // Forzar reinicio de cuenta regresiva
                      setShowStepsModal(false);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition duration-150 cursor-pointer text-black"
                    style={{
                      backgroundColor: textColor,
                      color: '#000000'
                    }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aplicar Cambios</span>
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
