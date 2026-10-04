import React from 'react';
import { Shield, Globe, UserCheck, Sparkles, Database } from 'lucide-react';
import { DEMO_PERSONAS } from '../services/api';

export default function RoleSwitcher({ activePersona, onSelectPersona, onOpenRag, onOpenCatalog }) {
  return (
    <header className="bg-slate-900 text-slate-200 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md sticky top-0 z-50">
      {/* Left branding & scope */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded border border-blue-500/30 font-semibold tracking-wider">
          <Shield className="w-3.5 h-3.5" />
          <span>TUI FINANCE • RBAC SECURITY</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Périmètre :</span>
          <span className="font-semibold text-white">{activePersona.scope}</span>
        </div>
      </div>

      {/* Center: Persona buttons */}
      <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
        <span className="text-slate-400 font-medium px-2 flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Persona :
        </span>
        {DEMO_PERSONAS.map((p) => {
          const isActive = p.id === activePersona.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPersona(p)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <span>{p.avatar}</span>
              <span className="hidden sm:inline">{p.role.replace('_', ' ')}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Quick actions (RAG and SAP catalog) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenCatalog}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded border border-slate-700 transition-colors"
          title="Consulter le référentiel SAP S/4HANA"
        >
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span>Catalogue SAP</span>
        </button>

        <button
          onClick={onOpenRag}
          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded shadow transition-all font-medium"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span>Assistant IA (RAG)</span>
        </button>
      </div>
    </header>
  );
}
