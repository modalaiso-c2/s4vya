import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Layout/Navbar';
import { MobileNav } from '@/components/Layout/MobileNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Target, Plus, Calendar, TrendingUp, CheckCircle2, XCircle, Edit } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { format, differenceInDays, differenceInWeeks, differenceInMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SavingsGoal {
  id: string;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  deadline: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

interface FormData {
  title: string;
  description: string;
  target_amount: string;
  current_amount: string;
  deadline: string;
}

export default function SavingsPlan() {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    target_amount: '',
    current_amount: '0',
    deadline: '',
  });

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals((data as SavingsGoal[]) || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Erreur lors du chargement des objectifs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!formData.title || !formData.target_amount || !formData.deadline) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    const targetAmount = parseFloat(formData.target_amount);
    const currentAmount = parseFloat(formData.current_amount);

    if (targetAmount <= 0) {
      toast.error('Le montant cible doit être positif');
      return;
    }

    if (currentAmount < 0 || currentAmount > targetAmount) {
      toast.error('Le montant actuel doit être entre 0 et le montant cible');
      return;
    }

    try {
      if (editingGoal) {
        const { error } = await supabase
          .from('savings_goals')
          .update({
            title: formData.title,
            description: formData.description || null,
            target_amount: targetAmount,
            current_amount: currentAmount,
            deadline: formData.deadline,
          })
          .eq('id', editingGoal.id);

        if (error) throw error;
        toast.success('Objectif mis à jour avec succès');
      } else {
        const { error } = await supabase
          .from('savings_goals')
          .insert({
            user_id: user.id,
            title: formData.title,
            description: formData.description || null,
            target_amount: targetAmount,
            current_amount: currentAmount,
            deadline: formData.deadline,
            status: 'active',
          });

        if (error) throw error;
        toast.success('Objectif créé avec succès');
      }

      setDialogOpen(false);
      setEditingGoal(null);
      setFormData({
        title: '',
        description: '',
        target_amount: '',
        current_amount: '0',
        deadline: '',
      });
      fetchGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const updateGoalProgress = async (goalId: string, newAmount: number) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const status = newAmount >= goal.target_amount ? 'completed' : 'active';

      const { error } = await supabase
        .from('savings_goals')
        .update({ current_amount: newAmount, status })
        .eq('id', goalId);

      if (error) throw error;

      if (status === 'completed') {
        toast.success('🎉 Félicitations ! Objectif atteint !');
      } else {
        toast.success('Progression mise à jour');
      }
      
      fetchGoals();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      toast.success('Objectif supprimé');
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const calculateTimeRemaining = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const days = differenceInDays(end, now);
    const weeks = differenceInWeeks(end, now);
    const months = differenceInMonths(end, now);

    if (days < 0) return 'Échéance dépassée';
    if (months > 0) return `${months} mois restant${months > 1 ? 's' : ''}`;
    if (weeks > 0) return `${weeks} semaine${weeks > 1 ? 's' : ''} restante${weeks > 1 ? 's' : ''}`;
    return `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`;
  };

  const calculateSavingsRate = (goal: SavingsGoal) => {
    const now = new Date();
    const start = new Date(goal.created_at);
    const end = new Date(goal.deadline);
    
    const totalDays = differenceInDays(end, start);
    const daysElapsed = differenceInDays(now, start);
    const remainingDays = differenceInDays(end, now);
    
    const remaining = goal.target_amount - goal.current_amount;
    
    if (remainingDays <= 0 || remaining <= 0) return null;

    const perDay = remaining / remainingDays;
    const perWeek = perDay * 7;
    const perMonth = perDay * 30;

    return {
      perDay: Math.ceil(perDay),
      perWeek: Math.ceil(perWeek),
      perMonth: Math.ceil(perMonth),
    };
  };

  const openEditDialog = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      deadline: goal.deadline,
    });
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Plans d'Épargne</h1>
              <p className="text-muted-foreground">Définissez et suivez vos objectifs</p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingGoal(null);
              setFormData({
                title: '',
                description: '',
                target_amount: '',
                current_amount: '0',
                deadline: '',
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvel Objectif
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingGoal ? 'Modifier l\'objectif' : 'Créer un objectif d\'épargne'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Acheter un smartphone"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Détails sur votre objectif..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target_amount">Montant Cible *</Label>
                    <Input
                      id="target_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.target_amount}
                      onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                      placeholder="150000"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="current_amount">Montant Actuel</Label>
                    <Input
                      id="current_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.current_amount}
                      onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="deadline">Date Limite *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingGoal ? 'Mettre à jour' : 'Créer l\'objectif'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun objectif pour le moment</h3>
              <p className="text-muted-foreground mb-4">
                Commencez à créer des objectifs d'épargne pour mieux gérer votre argent
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              const savingsRate = calculateSavingsRate(goal);
              const isCompleted = goal.status === 'completed';
              const isPastDeadline = new Date(goal.deadline) < new Date() && !isCompleted;

              return (
                <Card key={goal.id} className={`${
                  isCompleted ? 'border-green-500/50 bg-green-500/5' : 
                  isPastDeadline ? 'border-destructive/50' : ''
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {goal.title}
                          {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                          {isPastDeadline && <XCircle className="h-5 w-5 text-destructive" />}
                        </CardTitle>
                        {goal.description && (
                          <CardDescription className="mt-1">{goal.description}</CardDescription>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(goal)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Progression</span>
                        <span className="text-sm font-semibold">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={Math.min(progress, 100)} className="h-3" />
                      <div className="flex justify-between mt-2 text-sm">
                        <span className="font-medium">{formatAmount(goal.current_amount)}</span>
                        <span className="text-muted-foreground">{formatAmount(goal.target_amount)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className={isPastDeadline ? 'text-destructive' : 'text-muted-foreground'}>
                        {calculateTimeRemaining(goal.deadline)}
                      </span>
                    </div>

                    {savingsRate && !isCompleted && (
                      <div className="bg-primary/5 rounded-lg p-3 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-primary">
                          <TrendingUp className="h-3 w-3" />
                          Pour atteindre l'objectif :
                        </div>
                        <div className="text-sm space-y-0.5">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Par jour :</span>
                            <span className="font-medium">{formatAmount(savingsRate.perDay)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Par semaine :</span>
                            <span className="font-medium">{formatAmount(savingsRate.perWeek)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Par mois :</span>
                            <span className="font-medium">{formatAmount(savingsRate.perMonth)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {!isCompleted && (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min={goal.current_amount}
                          placeholder="Nouveau montant"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const value = parseFloat((e.target as HTMLInputElement).value);
                              if (value > goal.current_amount) {
                                updateGoalProgress(goal.id, value);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => deleteGoal(goal.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {isCompleted && (
                      <Badge className="w-full justify-center bg-green-500">
                        Objectif Atteint ! 🎉
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
