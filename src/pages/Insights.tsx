import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, AlertCircle, Award } from 'lucide-react';

interface Transaction {
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category_id: string;
}

interface Insight {
  type: 'tip' | 'warning' | 'achievement';
  title: string;
  description: string;
  icon: any;
}

const Insights = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (data) {
        setTransactions(data as Transaction[]);
        generateInsights(data as Transaction[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (trans: Transaction[]) => {
    const newInsights: Insight[] = [];

    const totalIncome = trans
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = trans
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    // Insight 1: Taux d'épargne
    if (savingsRate >= 20) {
      newInsights.push({
        type: 'achievement',
        title: 'Excellent taux d\'épargne ! 🎉',
        description: `Vous épargnez ${savingsRate.toFixed(1)}% de vos revenus. C'est remarquable !`,
        icon: Award,
      });
    } else if (savingsRate < 10 && totalIncome > 0) {
      newInsights.push({
        type: 'warning',
        title: 'Taux d\'épargne faible',
        description: `Vous épargnez seulement ${savingsRate.toFixed(1)}%. Essayez de réduire certaines dépenses non essentielles.`,
        icon: AlertCircle,
      });
    }

    // Insight 2: Moyenne des dépenses
    const avgExpense = trans.length > 0 ? totalExpense / trans.filter(t => t.type === 'expense').length : 0;
    if (avgExpense > 100) {
      newInsights.push({
        type: 'tip',
        title: 'Optimisez vos dépenses',
        description: `Votre dépense moyenne est de ${avgExpense.toFixed(2)}€. Identifiez les achats récurrents que vous pourriez réduire.`,
        icon: Lightbulb,
      });
    }

    // Insight 3: Tendance
    const recentTrans = trans.slice(0, 10);
    const recentExpenses = recentTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    const olderTrans = trans.slice(10, 20);
    const olderExpenses = olderTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

    if (recentExpenses < olderExpenses && olderExpenses > 0) {
      newInsights.push({
        type: 'achievement',
        title: 'Tendance positive ! 📈',
        description: `Vos dépenses récentes ont diminué de ${(((olderExpenses - recentExpenses) / olderExpenses) * 100).toFixed(1)}%. Continuez comme ça !`,
        icon: TrendingUp,
      });
    }

    // Conseils généraux
    if (newInsights.length < 3) {
      newInsights.push(
        {
          type: 'tip',
          title: 'Créez un budget mensuel',
          description: 'Définissez des limites pour chaque catégorie de dépenses pour mieux contrôler vos finances.',
          icon: Lightbulb,
        },
        {
          type: 'tip',
          title: 'Automatisez votre épargne',
          description: 'Mettez en place un virement automatique vers votre compte épargne chaque mois.',
          icon: Lightbulb,
        },
        {
          type: 'tip',
          title: 'Suivez vos objectifs',
          description: 'Définissez des objectifs financiers clairs et suivez vos progrès régulièrement.',
          icon: Lightbulb,
        }
      );
    }

    setInsights(newInsights.slice(0, 6));
  };

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

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Conseils IA</h1>
          <p className="text-muted-foreground">
            Analyse intelligente de vos finances et recommandations personnalisées
          </p>
        </div>

        <Card className="shadow-elegant gradient-primary text-white">
          <CardHeader>
            <CardTitle className="text-white">Résumé du mois</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/80 text-sm">Revenus totaux</p>
                <p className="text-2xl font-bold">{totalIncome.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-white/80 text-sm">Dépenses totales</p>
                <p className="text-2xl font-bold">{totalExpense.toFixed(2)} €</p>
              </div>
            </div>
            <div className="pt-4 border-t border-white/20">
              <p className="text-white/80 text-sm">Solde</p>
              <p className="text-3xl font-bold">{(totalIncome - totalExpense).toFixed(2)} €</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <Card
                key={index}
                className={`shadow-elegant transition-smooth hover:shadow-lg ${
                  insight.type === 'achievement'
                    ? 'border-l-4 border-l-success'
                    : insight.type === 'warning'
                    ? 'border-l-4 border-l-destructive'
                    : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        insight.type === 'achievement'
                          ? 'bg-success/10 text-success'
                          : insight.type === 'warning'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{insight.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Besoin d'aide ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Ces conseils sont générés automatiquement en analysant vos transactions.
              Pour des recommandations plus personnalisées, continuez à enregistrer vos dépenses régulièrement.
            </p>
            <Button onClick={fetchData}>
              <Lightbulb className="mr-2 h-4 w-4" />
              Actualiser les conseils
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Insights;
