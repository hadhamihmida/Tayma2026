import React, { useState, useEffect } from 'react';
import { Database, Search, X } from 'lucide-react';
import { api } from '../services/api';
import Badge from './Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './Table';

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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] rounded-xl max-w-4xl w-full h-[640px] shadow-xl border border-[var(--border)] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#1E3A8A] text-white flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white text-[#1E3A8A] flex items-center justify-center font-bold shadow-xs">
              <Database className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Catalogue Référentiel SAP S/4HANA (Master Data)</h3>
              <p className="text-[11px] text-blue-200">Consultation des fiches fournisseurs agréées et actives dans l'ERP</p>
            </div>
          </div>

          <button onClick={onClose} className="text-blue-200 hover:text-white font-bold p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-4 bg-slate-50 border-b border-[var(--border)] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              placeholder="Rechercher par nom, TVA, code SAP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-1.5 rounded-lg border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
          <span className="text-xs text-[var(--text-muted)] font-medium">{filtered.length} tiers répertoriés</span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Code SAP</TableHead>
                <TableHead>Raison Sociale</TableHead>
                <TableHead>N° TVA</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>IBAN Validé</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Risque</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono font-bold text-[var(--primary)]">{v.sap_vendor_id || v.id}</TableCell>
                  <TableCell className="font-semibold text-[var(--text)]">{v.legal_name}</TableCell>
                  <TableCell className="font-mono text-[var(--text-muted)]">{v.tax_id_vat}</TableCell>
                  <TableCell>{v.country}</TableCell>
                  <TableCell className="font-mono text-[11px] truncate max-w-[140px] text-[var(--text)]">{v.iban}</TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-50 text-[var(--primary)] border border-blue-200">
                      {v.segment}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-[var(--success)]">{v.risk_score || 12}/100</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

      </div>
    </div>
  );
}
