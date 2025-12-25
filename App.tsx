
import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  FileCheck, 
  RefreshCcw, 
  ShieldCheck, 
  LayoutDashboard,
  BookOpen,
  Keyboard,
  FileUp,
  AlertCircle
} from 'lucide-react';
import { Transaction, AccountLedger, LedgerEntry } from './types';
import { extractAccountingData } from './services/gemini';
import FileUploader from './components/FileUploader';
import LedgerTable from './components/LedgerTable';
import TopSheet from './components/TopSheet';
import ManualInput from './components/ManualInput';

type ViewMode = 'capture' | 'topsheet' | 'ledgers';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ViewMode>('capture');
  const [inputMode, setInputMode] = useState<'upload' | 'manual'>('upload');

  const handleFileUpload = async (text: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const extracted = await extractAccountingData(text);
      setTransactions(prev => [...prev, ...extracted]);
      setActiveTab('ledgers');
    } catch (err) {
      console.error(err);
      setError("AI analysis failed. Please check your data or try manual entry.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualEntry = (newTxs: Transaction[]) => {
    setTransactions(prev => [...prev, ...newTxs]);
    setActiveTab('ledgers');
  };

  const ledgers = useMemo(() => {
    const parties = Array.from(new Set(transactions.map(t => t.party)));
    
    return parties.map(party => {
      const partyTxs = transactions
        .filter(t => t.party === party)
        .sort((a, b) => a.date.localeCompare(b.date));
      
      let runningBalance = 0;
      let totalDebit = 0;
      let totalCredit = 0;
      
      const entries: LedgerEntry[] = partyTxs.map(tx => {
        totalDebit += tx.debit;
        totalCredit += tx.credit;
        
        const isAssetOrExpense = tx.accountType === 'Asset' || tx.accountType === 'Expense';
        
        if (isAssetOrExpense) {
          runningBalance += (tx.debit - tx.credit);
        } else {
          runningBalance += (tx.credit - tx.debit);
        }

        return {
          ...tx,
          balance: runningBalance,
          balanceType: runningBalance >= 0 
            ? (isAssetOrExpense ? 'Dr' : 'Cr') 
            : (isAssetOrExpense ? 'Cr' : 'Dr')
        };
      });

      const firstTx = partyTxs[0];
      const isAssetOrExpense = firstTx?.accountType === 'Asset' || firstTx?.accountType === 'Expense';

      return {
        accountName: party,
        entries,
        openingBalance: 0,
        closingBalance: runningBalance,
        closingBalanceType: runningBalance >= 0 
            ? (isAssetOrExpense ? 'Dr' : 'Cr') 
            : (isAssetOrExpense ? 'Cr' : 'Dr'),
        totalDebit,
        totalCredit
      } as AccountLedger;
    });
  }, [transactions]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Calculator className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">CA-Insight AI</h1>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Digital Audit Engine</p>
            </div>
          </div>

          {/* Tab Navigation */}
          {transactions.length > 0 && (
            <nav className="hidden md:flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('capture')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'capture' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <FileCheck size={14} /> Entry
              </button>
              <button 
                onClick={() => setActiveTab('topsheet')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'topsheet' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <LayoutDashboard size={14} /> Top Sheet
              </button>
              <button 
                onClick={() => setActiveTab('ledgers')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'ledgers' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <BookOpen size={14} /> Ledgers
              </button>
            </nav>
          )}

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase border border-green-100">
              <ShieldCheck size={14} /> Audit Compliant
            </div>
            {transactions.length > 0 && (
              <button 
                onClick={() => {
                  if (confirm("Clear all accounting data?")) {
                    setTransactions([]);
                    setActiveTab('capture');
                  }
                }}
                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                title="Reset Workspace"
              >
                <RefreshCcw size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Intro view if empty */}
        {transactions.length === 0 && activeTab === 'capture' && (
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Professional <span className="text-blue-600">Accounting</span> Automation
            </h2>
            <p className="text-lg text-slate-600">
              Upload bank statements, messy CSVs, or enter transactions manually. Our engine handles the double-entry logic and generates a professional Trial Balance.
            </p>
          </div>
        )}

        {/* Dynamic Views */}
        {activeTab === 'capture' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex gap-2 p-1 bg-slate-200 rounded-xl w-fit mx-auto mb-8">
              <button 
                onClick={() => setInputMode('upload')}
                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all ${inputMode === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                <FileUp size={16} /> AI Smart Upload
              </button>
              <button 
                onClick={() => setInputMode('manual')}
                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all ${inputMode === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                <Keyboard size={16} /> Manual Voucher
              </button>
            </div>

            {inputMode === 'upload' ? (
              <FileUploader onDataExtracted={handleFileUpload} isProcessing={isProcessing} />
            ) : (
              <ManualInput onAddTransactions={handleManualEntry} />
            )}

            {transactions.length > 0 && (
              <div className="flex justify-center mt-12">
                <button 
                  onClick={() => setActiveTab('topsheet')}
                  className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold flex items-center gap-3 hover:bg-slate-800 transition-all shadow-lg"
                >
                  View Financial Summary <LayoutDashboard size={18} />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'topsheet' && (
          <TopSheet ledgers={ledgers} />
        )}

        {activeTab === 'ledgers' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Account Ledger Statements</h3>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Total Accounts</p>
                  <p className="text-lg font-bold text-slate-900 leading-none">{ledgers.length}</p>
                </div>
              </div>
            </div>
            
            {ledgers.map((ledger, idx) => (
              <LedgerTable key={idx} ledger={ledger} />
            ))}
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto mt-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
            <AlertCircle className="flex-shrink-0" />
            {error}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 opacity-40">
            <Calculator size={18} />
            <span className="text-sm font-bold text-slate-900 uppercase tracking-tighter">CA-Insight</span>
          </div>
          <p className="text-xs text-slate-400">Professional Charted Accountant Assistant Tool. Powered by Gemini AI.</p>
          <div className="flex gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-600 transition-colors">Audit Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Data Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
