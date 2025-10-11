import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Layout/Navbar';
import { MobileNav } from '@/components/Layout/MobileNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Calendar, PieChart } from 'lucide-react';
import { BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category_id: string;
  categories: { name: string; color: string; icon: string } | null;
}

interface MonthlyData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
  categoryBreakdown: { name: string; value: number; color: string; icon: string }[];
  previousMonth: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
  };
}

export default function Analysis() {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);

  useEffect(() => {
    if (user) {
      fetchMonthlyData();
    }
  }, [user]);

  const fetchMonthlyData = async () => {
    if (!user) return;

    const currentDate = new Date();
    const currentMonthStart = startOfMonth(currentDate);
    const currentMonthEnd = endOfMonth(currentDate);
    const previousMonthStart = startOfMonth(subMonths(currentDate, 1));
    const previousMonthEnd = endOfMonth(subMonths(currentDate, 1));

    try {
      // Fetch current month transactions
      const { data: currentTransactions, error: currentError } = await supabase
        .from('transactions')
        .select('*, categories(name, color, icon)')
        .eq('user_id', user.id)
        .gte('date', format(currentMonthStart, 'yyyy-MM-dd'))
        .lte('date', format(currentMonthEnd, 'yyyy-MM-dd'));

      if (currentError) throw currentError;

      // Fetch previous month transactions
      const { data: previousTransactions, error: previousError } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id)
        .gte('date', format(previousMonthStart, 'yyyy-MM-dd'))
        .lte('date', format(previousMonthEnd, 'yyyy-MM-dd'));

      if (previousError) throw previousError;

      // Calculate current month stats
      const totalIncome = (currentTransactions as Transaction[])
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const totalExpenses = (currentTransactions as Transaction[])
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const balance = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

      // Calculate previous month stats
      const prevIncome = previousTransactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const prevExpenses = previousTransactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const prevBalance = prevIncome - prevExpenses;

      // Category breakdown for expenses
      const categoryMap = new Map<string, { name: string; value: number; color: string; icon: string }>();
      
      (currentTransactions as Transaction[])
        ?.filter(t => t.type === 'expense' && t.categories)
        .forEach(t => {
          if (t.categories) {
            const existing = categoryMap.get(t.categories.name);
            if (existing) {
              existing.value += Number(t.amount);
            } else {
              categoryMap.set(t.categories.name, {
                name: t.categories.name,
                value: Number(t.amount),
                color: t.categories.color || '#057dcd',
                icon: t.categories.icon || '📦',
              });
            }
          }
        });

      const categoryBreakdown = Array.from(categoryMap.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setMonthlyData({
        totalIncome,
        totalExpenses,
        balance,
        savingsRate,
        categoryBreakdown,
        previousMonth: {
          totalIncome: prevIncome,
          totalExpenses: prevExpenses,
          balance: prevBalance,
        },
      });
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEvolutionPercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const generateInsightSummary = () => {
    if (!monthlyData) return '';

    const balanceEvolution = getEvolutionPercentage(
      monthlyData.balance,
      monthlyData.previousMonth.balance
    );

    const topCategory = monthlyData.categoryBreakdown[0];
    const topCategoryPercentage = monthlyData.totalExpenses > 0
      ? ((topCategory?.value || 0) / monthlyData.totalExpenses) * 100
      : 0;

    let message = '';

    if (balanceEvolution > 0) {
      message += `Ce mois-ci, tu as économisé ${Math.abs(balanceEvolution).toFixed(0)}% de plus que le mois dernier. `;
    } else if (balanceEvolution < 0) {
      message += `Ce mois-ci, ton épargne a diminué de ${Math.abs(balanceEvolution).toFixed(0)}% par rapport au mois dernier. `;
    } else {
      message += `Ton niveau d'épargne est stable par rapport au mois dernier. `;
    }

    if (topCategory) {
      message += `Tes principales dépenses : ${topCategory.name} (${topCategoryPercentage.toFixed(0)}%)`;
      
      if (monthlyData.categoryBreakdown.length > 1) {
        const secondCategory = monthlyData.categoryBreakdown[1];
        const secondPercentage = (secondCategory.value / monthlyData.totalExpenses) * 100;
        message += `, ${secondCategory.name} (${secondPercentage.toFixed(0)}%)`;
      }
      
      if (monthlyData.categoryBreakdown.length > 2) {
        const thirdCategory = monthlyData.categoryBreakdown[2];
        const thirdPercentage = (thirdCategory.value / monthlyData.totalExpenses) * 100;
        message += `, ${thirdCategory.name} (${thirdPercentage.toFixed(0)}%)`;
      }
      
      message += '.';
    }

    return message;
  };

  const comparisonData = monthlyData ? [
    {
      name: 'Mois précédent',
      Revenus: monthlyData.previousMonth.totalIncome,
      Dépenses: monthlyData.previousMonth.totalExpenses,
      Solde: monthlyData.previousMonth.balance,
    },
    {
      name: 'Mois actuel',
      Revenus: monthlyData.totalIncome,
      Dépenses: monthlyData.totalExpenses,
      Solde: monthlyData.balance,
    },
  ] : [];

  const COLORS = ['#057dcd', '#23ad59', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <PieChart className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analyse Mensuelle</h1>
            <p className="text-muted-foreground">
              {format(new Date(), 'MMMM yyyy', { locale: fr })}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : monthlyData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {formatAmount(monthlyData.totalIncome)}
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-sm">
                    {getEvolutionPercentage(
                      monthlyData.totalIncome,
                      monthlyData.previousMonth.totalIncome
                    ) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={
                      getEvolutionPercentage(
                        monthlyData.totalIncome,
                        monthlyData.previousMonth.totalIncome
                      ) >= 0 ? 'text-green-500' : 'text-red-500'
                    }>
                      {Math.abs(
                        getEvolutionPercentage(
                          monthlyData.totalIncome,
                          monthlyData.previousMonth.totalIncome
                        )
                      ).toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs mois précédent</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Dépenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {formatAmount(monthlyData.totalExpenses)}
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-sm">
                    {getEvolutionPercentage(
                      monthlyData.totalExpenses,
                      monthlyData.previousMonth.totalExpenses
                    ) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    )}
                    <span className={
                      getEvolutionPercentage(
                        monthlyData.totalExpenses,
                        monthlyData.previousMonth.totalExpenses
                      ) >= 0 ? 'text-red-500' : 'text-green-500'
                    }>
                      {Math.abs(
                        getEvolutionPercentage(
                          monthlyData.totalExpenses,
                          monthlyData.previousMonth.totalExpenses
                        )
                      ).toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">vs mois précédent</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Solde du Mois
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    monthlyData.balance >= 0 ? 'text-primary' : 'text-destructive'
                  }`}>
                    {formatAmount(monthlyData.balance)}
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Taux d'épargne</span>
                      <span className="font-medium">{monthlyData.savingsRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(monthlyData.savingsRate, 100)} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Insight Summary */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Résumé Intelligent du Mois
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground leading-relaxed">
                  {generateInsightSummary()}
                </p>
              </CardContent>
            </Card>

            {/* Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution Mensuelle</CardTitle>
                <CardDescription>Comparaison avec le mois précédent</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => formatAmount(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Revenus" fill="#23ad59" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Dépenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Solde" fill="#057dcd" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            {monthlyData.categoryBreakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des Dépenses</CardTitle>
                  <CardDescription>Top 5 des catégories ce mois-ci</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPie>
                        <Pie
                          data={monthlyData.categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.icon} ${((entry.value / monthlyData.totalExpenses) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {monthlyData.categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatAmount(value)}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>

                    <div className="space-y-3">
                      {monthlyData.categoryBreakdown.map((category, index) => {
                        const percentage = (category.value / monthlyData.totalExpenses) * 100;
                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span>{category.icon}</span>
                                <span className="font-medium">{category.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{formatAmount(category.value)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {percentage.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                            <Progress 
                              value={percentage} 
                              className="h-2"
                              style={{
                                '--progress-background': category.color,
                              } as React.CSSProperties}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Aucune donnée disponible pour ce mois. Ajoutez des transactions pour voir votre analyse.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
