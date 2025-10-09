import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export type Currency = 'XAF' | 'USD' | 'EUR' | 'GBP' | 'XOF';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => Promise<void>;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  XAF: 'FCFA',
  XOF: 'FCFA',
  USD: '$',
  EUR: '€',
  GBP: '£'
};

const CURRENCY_NAMES: Record<Currency, string> = {
  XAF: 'Franc CFA (BEAC)',
  XOF: 'Franc CFA (UEMOA)',
  USD: 'Dollar US',
  EUR: 'Euro',
  GBP: 'Livre Sterling'
};

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>('XAF');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserCurrency();
    }
  }, [user]);

  const fetchUserCurrency = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('currency')
      .eq('id', user.id)
      .single();

    if (data && !error) {
      setCurrencyState(data.currency as Currency);
    }
  };

  const setCurrency = async (newCurrency: Currency) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ currency: newCurrency })
      .eq('id', user.id);

    if (!error) {
      setCurrencyState(newCurrency);
    }
  };

  const formatAmount = (amount: number): string => {
    const symbol = CURRENCY_SYMBOLS[currency];
    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);

    // For FCFA, put symbol after the amount
    if (currency === 'XAF' || currency === 'XOF') {
      return `${formatted} ${symbol}`;
    }
    // For other currencies, put symbol before
    return `${symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
};

export { CURRENCY_NAMES };
