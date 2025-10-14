import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingDown, TrendingUp, AlertTriangle, Lightbulb, Target, Calendar, PieChart, BarChart3, Zap, Shield, Trophy } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

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

interface FinancialInsightsProps {
  transactions: Transaction[];
  categories: Category[];
  balance: number;
  totalExpense: number;
  totalIncome: number;
}

interface Insight {
  type: 'warning' | 'success' | 'tip' | 'info';
  icon: any;
  title: string;
  description: string;
  color: string;
  priority?: number;
}

export const FinancialInsights = ({ 
  transactions, 
  categories, 
  balance, 
  totalExpense, 
  totalIncome 
}: FinancialInsightsProps) => {
  const { formatAmount } = useCurrency();

  // Système d'insights IA avancé basé sur les données
  const generateInsights = () => {
    const insights = [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Données pour analyses temporelles
    const currentMonthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    });
    
    const previousMonthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === (currentMonth - 1 + 12) % 12 && 
             tDate.getFullYear() === (currentMonth === 0 ? currentYear - 1 : currentYear);
    });

    // Analyse du ratio revenus/dépenses
    if (totalIncome > 0) {
      const expenseRatio = (totalExpense / totalIncome) * 100;
      if (expenseRatio > 80) {
        insights.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'Attention aux dépenses',
          description: `Vous dépensez ${expenseRatio.toFixed(0)}% de vos revenus ce mois. L'idéal serait de rester sous 70%.`,
          color: 'text-destructive'
        });
      } else if (expenseRatio < 50) {
        insights.push({
          type: 'success',
          icon: TrendingUp,
          title: 'Excellente gestion',
          description: `Vos dépenses ne représentent que ${expenseRatio.toFixed(0)}% de vos revenus. Continuez ainsi !`,
          color: 'text-success'
        });
      }
    }

    // Analyse des catégories de dépenses
    const expensesByCategory = categories
      .filter(c => c.type === 'expense')
      .map(category => {
        const total = transactions
          .filter(t => t.category_id === category.id)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return { ...category, total, percentage: (total / totalExpense) * 100 };
      })
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total);

    if (expensesByCategory.length > 0) {
      const topCategory = expensesByCategory[0];
      if (topCategory.percentage > 40) {
        insights.push({
          type: 'tip',
          icon: Lightbulb,
          title: 'Optimisation possible',
          description: `${topCategory.name} représente ${topCategory.percentage.toFixed(0)}% de vos dépenses. Analysez cette catégorie pour des économies potentielles.`,
          color: 'text-primary'
        });
      }
    }

    // Analyse du potentiel d'épargne
    if (balance > 0) {
      const savingsRate = (balance / totalIncome) * 100;
      if (savingsRate > 20) {
        insights.push({
          type: 'success',
          icon: Target,
          title: 'Objectif d\'épargne atteint',
          description: `Vous épargnez ${savingsRate.toFixed(0)}% de vos revenus, soit ${formatAmount(balance)}. Bravo !`,
          color: 'text-success'
        });
      } else {
        insights.push({
          type: 'tip',
          icon: Target,
          title: 'Potentiel d\'épargne',
          description: `Vous pourriez épargner ${formatAmount(totalIncome * 0.2 - balance)} de plus pour atteindre l'objectif de 20%.`,
          color: 'text-primary'
        });
      }
    }

    // Analyse des transactions récentes
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    
    const recentExpenses = recentTransactions.filter(t => t.type === 'expense');
    if (recentExpenses.length > 0) {
      const averageExpense = recentExpenses.reduce((sum, t) => sum + Number(t.amount), 0) / recentExpenses.length;
      const largeExpenses = recentExpenses.filter(t => Number(t.amount) > averageExpense * 2);
      
      if (largeExpenses.length > 0) {
        insights.push({
          type: 'info',
          icon: Brain,
          title: 'Analyse des habitudes',
          description: `${largeExpenses.length} dépense(s) importante(s) détectée(s) récemment. Vérifiez si elles étaient prévues.`,
          color: 'text-muted-foreground'
        });
      }
    }

    // Analyse comparative mensuelle
    if (previousMonthTransactions.length > 0) {
      const currentMonthExpenses = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const previousMonthExpenses = previousMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const expenseChange = ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100;
      
      if (expenseChange > 20) {
        insights.push({
          type: 'warning',
          icon: TrendingUp,
          title: 'Augmentation des dépenses',
          description: `Vos dépenses ont augmenté de ${expenseChange.toFixed(0)}% par rapport au mois dernier. Analysez vos habitudes récentes.`,
          color: 'text-destructive',
          priority: 9
        });
      } else if (expenseChange < -10) {
        insights.push({
          type: 'success',
          icon: TrendingDown,
          title: 'Excellente réduction',
          description: `Félicitations ! Vous avez réduit vos dépenses de ${Math.abs(expenseChange).toFixed(0)}% ce mois-ci.`,
          color: 'text-success',
          priority: 8
        });
      }
    }

    // Analyse des habitudes de dépenses par jour de la semaine
    const expensesByDayOfWeek = Array(7).fill(0);
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const dayOfWeek = new Date(t.date).getDay();
      expensesByDayOfWeek[dayOfWeek] += Number(t.amount);
    });
    
    const maxExpenseDay = expensesByDayOfWeek.indexOf(Math.max(...expensesByDayOfWeek));
    if (Math.max(...expensesByDayOfWeek) > 0) {
      insights.push({
        type: 'info',
        icon: Calendar,
        title: 'Jour de dépense max',
        description: `Vous dépensez le plus le ${dayNames[maxExpenseDay]}. Planifiez vos achats pour mieux contrôler votre budget.`,
        color: 'text-primary',
        priority: 6
      });
    }

    // Détection des dépenses récurrentes suspectes
    const expensesByTitle = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const key = t.title.toLowerCase().trim();
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
      }, {} as Record<string, Transaction[]>);
    
    const suspiciousDuplicates = Object.entries(expensesByTitle)
      .filter(([_, txs]) => txs.length > 3 && txs[0].amount > 1000)
      .map(([title, txs]) => ({ title, count: txs.length, amount: txs[0].amount }));
    
    if (suspiciousDuplicates.length > 0) {
      const duplicate = suspiciousDuplicates[0];
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Dépenses répétitives détectées',
        description: `"${duplicate.title}" apparaît ${duplicate.count} fois. Vérifiez qu'il ne s'agit pas de doublons.`,
        color: 'text-destructive',
        priority: 7
      });
    }

    // Analyse intelligente des catégories sous-utilisées
    const unusedCategories = categories.filter(c => {
      return c.type === 'expense' && !transactions.some(t => t.category_id === c.id);
    });
    
    if (unusedCategories.length > 3) {
      insights.push({
        type: 'tip',
        icon: PieChart,
        title: 'Catégories non utilisées',
        description: `Vous avez ${unusedCategories.length} catégories inutilisées. Supprimez-les pour simplifier votre interface.`,
        color: 'text-primary',
        priority: 3
      });
    }

    // Conseil personnalisé basé sur les habitudes
    const totalDays = Math.max(1, Math.ceil((new Date().getTime() - new Date(Math.min(...transactions.map(t => new Date(t.date).getTime()))).getTime()) / (1000 * 60 * 60 * 24)));
    const dailyAverageExpense = totalExpense / totalDays;
    
    if (dailyAverageExpense > 5000) {
      insights.push({
        type: 'tip',
        icon: Target,
        title: 'Défi d\'épargne',
        description: `Réduisez vos dépenses quotidiennes de 1000 FCFA. Cela vous ferait économiser ${formatAmount(365 * 1000)} par an !`,
        color: 'text-primary',
        priority: 5
      });
    }

    // Analyse de la volatilité des dépenses
    const dailyExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const date = t.date;
        acc[date] = (acc[date] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);
    
    const expenseValues = Object.values(dailyExpenses);
    if (expenseValues.length > 7) {
      const mean = expenseValues.reduce((a, b) => a + b) / expenseValues.length;
      const variance = expenseValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / expenseValues.length;
      const stdDev = Math.sqrt(variance);
      const volatility = (stdDev / mean) * 100;
      
      if (volatility > 80) {
        insights.push({
          type: 'info',
          icon: BarChart3,
          title: 'Dépenses irrégulières',
          description: `Vos dépenses varient beaucoup d'un jour à l'autre. Une planification pourrait vous aider à stabiliser votre budget.`,
          color: 'text-muted-foreground',
          priority: 4
        });
      }
    }

    // Conseil sur l'épargne d'urgence
    const monthlyExpenseAverage = totalExpense;
    const emergencyFundNeeded = monthlyExpenseAverage * 3; // 3 mois d'urgence
    
    if (balance < emergencyFundNeeded && balance > 0) {
      insights.push({
        type: 'tip',
        icon: Shield,
        title: 'Fonds d\'urgence incomplet',
        description: `Votre épargne couvre ${(balance / monthlyExpenseAverage).toFixed(1)} mois. Visez 3 mois minimum (${formatAmount(emergencyFundNeeded)}).`,
        color: 'text-primary',
        priority: 6
      });
    }

    // Motivation basée sur les progrès
    if (balance > totalIncome * 0.1 && balance < totalIncome * 0.2) {
      insights.push({
        type: 'success',
        icon: Trophy,
        title: 'Bon départ !',
        description: `Vous épargnez déjà ${((balance / totalIncome) * 100).toFixed(0)}% de vos revenus. Plus que quelques efforts pour atteindre 20% !`,
        color: 'text-success',
        priority: 7
      });
    }

    // Intelligence contextuelle : conseils selon la période
    const currentDay = new Date().getDate();
    if (currentDay >= 25 && currentDay <= 31) {
      const remainingBudget = totalIncome - totalExpense;
      if (remainingBudget < totalIncome * 0.1) {
        insights.push({
          type: 'warning',
          icon: Zap,
          title: 'Attention fin de mois',
          description: `Il ne vous reste que ${formatAmount(remainingBudget)} pour finir le mois. Limitez les dépenses non essentielles.`,
          color: 'text-destructive',
          priority: 10
        });
      }
    }

    // Trier les insights par priorité et limiter à 5
    return insights
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, 5);
  };

  const insights = generateInsights();

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="text-base md:text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Insights IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const IconComponent = insight.icon;
            return (
              <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                <div className={`flex-shrink-0 ${insight.color}`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <Badge 
                      variant={insight.type === 'warning' ? 'destructive' : insight.type === 'success' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {insight.type === 'warning' ? 'Attention' : insight.type === 'success' ? 'Bravo' : insight.type === 'tip' ? 'Conseil' : 'Info'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};