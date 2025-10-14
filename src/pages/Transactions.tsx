import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Navbar } from '@/components/Layout/Navbar';
import { MobileNav } from '@/components/Layout/MobileNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Download, Search } from 'lucide-react';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  note: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'income' | 'expense';
}

const Transactions = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [transactionsRes, categoriesRes] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('categories').select('*'),
      ]);

      if (transactionsRes.data) setTransactions(transactionsRes.data as Transaction[]);
      if (categoriesRes.data) setCategories(categoriesRes.data as Category[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.amount || !formData.category_id) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('transactions')
          .update({
            title: formData.title,
            amount: parseFloat(formData.amount),
            type: formData.type,
            category_id: formData.category_id,
            date: formData.date,
            note: formData.note,
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Transaction mise à jour');
      } else {
        const { error } = await supabase.from('transactions').insert({
          user_id: user?.id,
          title: formData.title,
          amount: parseFloat(formData.amount),
          type: formData.type,
          category_id: formData.category_id,
          date: formData.date,
          note: formData.note,
        });

        if (error) throw error;
        toast.success('Transaction ajoutée');
      }

      fetchData();
      resetForm();
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      toast.success('Transaction supprimée');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setFormData({
      title: transaction.title,
      amount: transaction.amount.toString(),
      type: transaction.type,
      category_id: transaction.category_id,
      date: transaction.date,
      note: transaction.note || '',
    });
    setIsOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      type: 'expense',
      category_id: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    });
    setEditingId(null);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Titre', 'Catégorie', 'Type', 'Montant', 'Note'];
    const rows = transactions.map(t => {
      const category = categories.find(c => c.id === t.category_id);
      return [
        t.date,
        t.title,
        category?.name || '',
        t.type === 'income' ? 'Revenu' : 'Dépense',
        t.amount,
        t.note || '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Export réussi');
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  const filteredTransactions = transactions.filter(transaction => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const category = categories.find(c => c.id === transaction.category_id);
    
    return (
      transaction.title.toLowerCase().includes(query) ||
      transaction.note?.toLowerCase().includes(query) ||
      transaction.amount.toString().includes(query) ||
      category?.name.toLowerCase().includes(query)
    );
  });

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
      <main className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 pb-20 md:pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Transactions</h1>
            <p className="text-sm md:text-base text-muted-foreground">Gérez vos revenus et dépenses</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={exportToCSV} className="flex-1 sm:flex-none">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Nouvelle transaction</span>
                  <span className="sm:hidden">Ajouter</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Modifier' : 'Ajouter'} une transaction</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations de la transaction
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: 'income' | 'expense') => {
                        setFormData({ ...formData, type: value, category_id: '' });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Dépense</SelectItem>
                        <SelectItem value="income">Revenu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Titre</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Courses alimentaires"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Montant</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Note (optionnel)</Label>
                    <Textarea
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      placeholder="Ajoutez une note..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {editingId ? 'Mettre à jour' : 'Ajouter'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setIsOpen(false); resetForm(); }}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Toutes les transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher par titre, catégorie, montant ou note..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2 md:space-y-3">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => {
                  const category = categories.find(c => c.id === transaction.category_id);
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-start sm:items-center justify-between p-3 md:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-smooth gap-2"
                    >
                      <div className="flex items-start sm:items-center gap-2 md:gap-4 flex-1 min-w-0">
                        <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-background flex-shrink-0">
                          <span className="text-xl md:text-2xl">{category?.icon || '💰'}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm md:text-base">{transaction.title}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString('fr-FR')} • {category?.name}
                          </p>
                          {transaction.note && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{transaction.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 flex-shrink-0">
                        <span
                          className={`text-base md:text-lg font-bold whitespace-nowrap ${
                            transaction.type === 'income' ? 'text-success' : 'text-destructive'
                          }`}
                        >
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatAmount(Number(transaction.amount))}
                        </span>
                        <div className="flex gap-1 md:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(transaction)}
                            className="h-8 w-8 md:h-10 md:w-10"
                          >
                            <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(transaction.id)}
                            className="h-8 w-8 md:h-10 md:w-10"
                          >
                            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery ? 'Aucune transaction trouvée.' : 'Aucune transaction. Commencez par en ajouter une !'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <MobileNav />
    </div>
  );
};

export default Transactions;
