'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeedbackPage() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const questions = [
    {
      title: "Desafío Principal",
      description: "¿Cuál es el mayor 'dolor de cabeza' o proceso más lento que enfrenta su empresa hoy en día, y que espera que nuestra plataforma solucione definitivamente?",
      type: "textarea",
      placeholder: "Ej: Mucho tiempo perdido conciliando cobros..."
    },
    {
      title: "El Pasado",
      description: "Antes de conocer nuestra plataforma, ¿cómo resolvía la organización de sus finanzas, inventarios o tareas atrasadas?",
      type: "options",
      options: [
        "Excel / Hojas de cálculo", 
        "Papel y lápiz", 
        "Otro software (difícil de usar)", 
        "No teníamos un sistema definido"
      ]
    },
    {
      title: "El Agente IA",
      description: "Sabiendo que la plataforma cuenta con un Agente IA, ¿qué tarea administrativa o financiera específica le gustaría delegarle por completo para ahorrar tiempo?",
      type: "textarea",
      placeholder: "Ej: Que cobre automáticamente las facturas vencidas..."
    },
    {
      title: "Alertas y Notificaciones",
      description: "En cuanto a los registros y pagos atrasados, ¿cómo le gustaría que el sistema se lo comunicara?",
      type: "options",
      options: [
        "Alertas en el celular (WhatsApp/Notificación)", 
        "Un resumen diario al correo", 
        "Notificación sutil en la pantalla", 
        "Que el Agente lo gestione automáticamente"
      ]
    },
    {
      title: "Adopción de Equipo",
      description: "Al pensar en su equipo de trabajo utilizando esta nueva herramienta, ¿cuál es su mayor preocupación?",
      type: "options",
      options: [
        "Curva de aprendizaje difícil", 
        "Migración de datos inicial", 
        "Resistencia al cambio del personal", 
        "Ninguna, confío en la plataforma"
      ]
    },
    {
      title: "Su Éxito es Nuestro Éxito",
      description: "Para considerar que la adopción de esta plataforma ha sido un éxito total en sus primeros meses, ¿qué deberíamos lograr juntos?",
      type: "textarea",
      placeholder: "Ej: Reducir mis tiempos administrativos a la mitad."
    }
  ];

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(prev => prev + 1);
    } else {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setCompleted(true);
      }, 1500);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(prev => prev - 1);
  };

  return (
    <div className="max-w-3xl mx-auto w-full pt-8 pb-20">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500 mb-2 drop-shadow-sm">
          Ayúdanos a Mejorar tu Experiencia
        </h1>
        <p className="text-slate-600 dark:text-slate-300">Queremos que ATM Agent sea tu mejor aliado. Cuéntanos más sobre tu negocio.</p>
      </div>

      <div className="glass-panel rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        {/* Progress Bar */}
        {!completed && (
          <div className="absolute top-0 left-0 w-full h-1 bg-black/5 dark:bg-white/5">
            <motion.div 
              className="h-full bg-blue-500"
              initial={{ width: '0%' }}
              animate={{ width: `${((step) / questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {!completed ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-[250px] flex flex-col justify-center"
            >
              <div className="mb-2 text-sm font-semibold text-sky-600 dark:text-sky-400">Pregunta {step + 1} de {questions.length}</div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{questions[step].title}</h2>
              <p className="text-slate-700 dark:text-slate-300 mb-8">{questions[step].description}</p>

              {questions[step].type === 'textarea' ? (
                <textarea 
                  className="w-full bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none min-h-[120px] transition-all"
                  placeholder={questions[step].placeholder}
                />
              ) : (
                <div className="space-y-3">
                  {questions[step].options?.map((opt, i) => (
                    <label key={i} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-sky-500/10 dark:hover:bg-sky-900/20 hover:border-sky-400 dark:hover:border-sky-500/30 cursor-pointer transition-all group">
                      <input type="radio" name={`q-${step}`} className="w-5 h-5 text-sky-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-white/20 focus:ring-sky-500 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-slate-900" />
                      <span className="text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-medium">{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="min-h-[250px] flex flex-col items-center justify-center text-center py-10"
            >
              <div className="w-20 h-20 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¡Gracias por tus respuestas!</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-md mx-auto">Tus aportes son fundamentales para que nuestra Inteligencia Artificial se adapte perfectamente a las necesidades de tu empresa.</p>
              
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="px-6 py-3 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-500 transition-colors shadow-lg shadow-sky-900/20"
              >
                Volver al Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!completed && (
          <div className="mt-10 flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-6">
            <button
              onClick={handleBack}
              disabled={step === 0 || isSubmitting}
              className={`px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 ${step === 0 ? 'opacity-0 pointer-events-none' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>
            
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-500 transition-colors shadow-lg shadow-sky-900/30 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : step === questions.length - 1 ? (
                'Finalizar Encuesta'
              ) : (
                <>
                  Siguiente
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
