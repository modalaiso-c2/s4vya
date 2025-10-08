import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

const Dashboard = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [transactionsRes, categoriesRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false }),
        supabase
          .from('categories')
          .select('*'),
      ]);

      if (transactionsRes.data) setTransactions(transactionsRes.data as Transaction[]);
      if (categoriesRes.data) setCategories(categoriesRes.data as Category[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  const categoryData = categories
    .filter(c => c.type === 'expense')
    .map(category => {
      const total = transactions
        .filter(t => t.category_id === category.id)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return {
        name: category.name,
        value: total,
        color: category.color,
      };
    })
    .filter(d => d.value > 0);

  const COLORS = categoryData.map(d => d.color);

  const recentTransactions = transactions.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Vue d'ensemble de vos finances</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-elegant transition-smooth hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solde Total</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{balance.toFixed(2)} €</div>
              <p className="text-xs text-muted-foreground mt-1">
                {balance >= 0 ? 'Situation positive' : 'Attention aux dépenses'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant transition-smooth hover:shadow-lg border-l-4 border-l-success">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{totalIncome.toFixed(2)} €</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ce mois
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant transition-smooth hover:shadow-lg border-l-4 border-l-destructive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dépenses</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{totalExpense.toFixed(2)} €</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ce mois
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Dépenses par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Aucune dépense enregistrée
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Transactions récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => {
                    const category = categories.find(c => c.id === transaction.category_id);
                    return (
                      <div key={transaction.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <span className="text-lg">{category?.icon || '💰'}</span>
                          </div>
                          <div>
                            <p className="font-medium">{transaction.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-semibold ${
                            transaction.type === 'income'
                              ? 'text-success'
                              : 'text-destructive'
                          }`}
                        >
                          {transaction.type === 'income' ? '+' : '-'}
                          {Number(transaction.amount).toFixed(2)} €
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    Aucune transaction
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
