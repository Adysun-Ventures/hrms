import { useCallback, useState } from 'react';
import Editor from './components/Editor.jsx';
import { demoStatement } from './lib/demo.js';
import { loadAll, saveAll } from './lib/storage.js';
import { Page } from './shared/ui.jsx';
import { Toaster } from './shared/toast.jsx';
import './styles.css';

const normalizeBankName = bank => (String(bank || '').toLowerCase().includes('hdfc') ? 'HDFC Bank' : 'Kotak Mahindra Bank');

export default function App() {
  const [activeBank, setActiveBank] = useState('Kotak Mahindra Bank');
  const [bankStores, setBankStores] = useState(() => {
    const loaded = loadAll();
    const kotakLoaded = loaded.find(s => s.bank === 'Kotak Mahindra Bank' || s.account?.bank === 'Kotak Mahindra Bank');
    const hdfcLoaded = loaded.find(s => s.bank === 'HDFC Bank' || s.account?.bank === 'HDFC Bank');
    return {
      'Kotak Mahindra Bank': kotakLoaded || demoStatement(new Date(), 'Kotak Mahindra Bank'),
      'HDFC Bank': hdfcLoaded || demoStatement(new Date(), 'HDFC Bank'),
    };
  });

  const statement = bankStores[activeBank] || bankStores['Kotak Mahindra Bank'];

  // Saves changes to the active bank's isolated statement without cross-contaminating other banks
  const handleChange = useCallback((st, explicitBank = null) => {
    const bankKey = normalizeBankName(explicitBank || st.account?.bank || st.bank || activeBank);
    const updatedSt = {
      ...st,
      bank: bankKey,
      account: { ...st.account, bank: bankKey },
      updatedAt: Date.now(),
    };

    setBankStores(prev => {
      const next = { ...prev, [bankKey]: updatedSt };
      saveAll(Object.values(next));
      return next;
    });

    if (bankKey !== activeBank) {
      setActiveBank(bankKey);
    }
  }, [activeBank]);

  // Switches active bank without moving the previous bank's data into the new bank
  const handleSwitchBank = useCallback(newBank => {
    const bankKey = normalizeBankName(newBank);
    setBankStores(prev => {
      if (!prev[bankKey]) {
        return {
          ...prev,
          [bankKey]: demoStatement(new Date(), bankKey),
        };
      }
      return prev;
    });
    setActiveBank(bankKey);
  }, []);

  return (
    <Page crumbs={[['Statements']]}>
      <Toaster />
      <div className="statement-root">
        <Editor
          statement={statement}
          onChange={handleChange}
          onSwitchBank={handleSwitchBank}
          onBack={null}
        />
      </div>
    </Page>
  );
}
