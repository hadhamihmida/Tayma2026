import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  BookOpen, 
  CheckCircle2, 
  FileCheck, 
  X, 
  MessageSquare,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import { api } from '../services/api';

export default function RagAssistantModal({ isOpen, onClose }) {
  const [queryText, setQueryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Bonjour ! Je suis l'Assistant Réglementaire Master Data IA de TUI Group Finance. Je peux vous éclairer sur nos politiques de conformité, nos protocoles anti-fraude RIB, ou les spécificités des zones Western et Nordic.",
      citations: []
    }
  ]);

  if (!isOpen) return null;

  const quickQuestions = [
    "Quelles sont les règles de validation d'un RIB pour la zone Nordic ?",
    "Quelle est la procédure en cas de discordance entre l'IBAN et le siège social ?",
    "Quelles sont les conditions de blocage de paiement dans SAP S/4HANA ?",
    "Quels justificatifs sont obligatoires pour la France et l'Espagne ?"
  ];

  const handleSend = async (textToSend) => {
    const q = textToSend || queryText;
    if (!q.trim()) return;

    const userMsg = { role: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setQueryText('');
    setLoading(true);

    try {
      const res = await api.queryRag(q);
      const botMsg = {
        role: 'assistant',
        text: res.answer || "Conformément aux directives de conformité TUI Finance...",
        citations: res.citations || [],
        confidence: res.confidence_score
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "Désolé, une erreur est survenue lors de l'interrogation de la base documentaire.",
        citations: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full h-[620px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow">
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Assistant Conversationnel RAG (Axe 7)</h3>
              <p className="text-[11px] text-slate-400">Interrogation en langage naturel des politiques financières TUI Group</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50 text-xs">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Citations block */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] space-y-2">
                    <span className="font-bold text-blue-600 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Citations Documentaires Officielles :</span>
                    </span>
                    {msg.citations.map((c, cIdx) => (
                      <div key={cIdx} className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-600">
                        <div className="font-semibold text-slate-900">{c.source} — {c.article}</div>
                        <p className="text-[10px] text-slate-500 italic mt-0.5">« {c.snippet} »</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Génération de la réponse contextualisée par le RAG...</span>
            </div>
          )}
        </div>

        {/* Quick prompt pills */}
        <div className="px-6 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Suggestions :
          </span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full shrink-0 truncate max-w-[240px] transition-colors"
              title={q}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            placeholder="Posez votre question sur les procédures Master Data..."
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !queryText.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Envoyer</span>
          </button>
        </div>

      </div>
    </div>
  );
}
