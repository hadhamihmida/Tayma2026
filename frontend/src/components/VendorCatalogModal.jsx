import React, { useState, useEffect } from 'react';
import { Database, Search, X, Building, CheckCircle2, Shield } from 'lucide-react';
import { api } from '../services/api';

export default function VendorCatalogModal({ isOpen, onClose }) {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadCatalog();
    }
  }, [isOpen]);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const data = await api.getVendors();
      if (data.success) {
        setVendors(data.vendors);
      }
    } catch (err) {
      console.warn('Erreur chargement catalogue :', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = vendors.filter(v => 
    v.legal_name.toLowerCase().includes(search.toLowerCase()) ||
    v.tax_id_vat.toLowerCase().includes(search.toLowerCase()) ||
    (v.sap_vendor_id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[640px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Catalogue Référentiel SAP S/4HANA (Master Data)</h3>
              <p className="text-[11px] text-slate-400">Consultation des fiches fournisseurs agréées et actives dans l'ERP</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher par nom, TVA, code SAP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">{filtered.length} tiers répertoriés</span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Code SAP</th>
                <th className="py-2.5 px-3">Raison Sociale</th>
                <th className="py-2.5 px-3">N° TVA</th>
                <th className="py-2.5 px-3">Pays</th>
                <th className="py-2.5 px-3">IBAN Validé</th>
                <th className="py-2.5 px-3">Segment</th>
                <th className="py-2.5 px-3">Risque</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-mono font-bold text-amber-700">{v.sap_vendor_id || v.id}</td>
                  <td className="py-2.5 px-3 font-semibold">{v.legal_name}</td>
                  <td className="py-2.5 px-3 font-mono">{v.tax_id_vat}</td>
                  <td className="py-2.5 px-3">{v.country}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] truncate max-w-[140px]">{v.iban}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-indigo-50 text-indigo-700">
                      {v.segment}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-emerald-600">{v.risk_score || 12}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
