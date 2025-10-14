import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { handleError } from '@/lib/errorHandler';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  user_id: string;
}

const COLOR_OPTIONS = [
  { name: 'Bleu Savya', value: '#057DCD' },
  { name: 'Vert Savya', value: '#23AD59' },
  { name: 'Rouge', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Rose', value: '#EC4899' },
  { name: 'Jaune', value: '#EAB308' },
  { name: 'Indigo', value: '#6366F1' }
];

export const CategoryManager = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    icon: '💰',
    color: '#057DCD',
    type: 'expense' as 'income' | 'expense'
  });

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories((data || []) as Category[]);
    } catch (error) {
      toast.error(handleError(error, 'Erreur lors du chargement des catégories'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name.trim(),
            icon: formData.icon,
            color: formData.color,
            type: formData.type
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Catégorie mise à jour avec succès');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({
            name: formData.name.trim(),
            icon: formData.icon,
            color: formData.color,
            type: formData.type,
            user_id: user?.id
          });

        if (error) throw error;
        toast.success('Catégorie créée avec succès');
      }

      fetchCategories();
      resetForm();
      setIsOpen(false);
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Une catégorie avec ce nom existe déjà');
      } else {
        toast.error(handleError(error, 'Erreur lors de la sauvegarde'));
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Catégorie supprimée avec succès');
      fetchCategories();
    } catch (error: any) {
      if (error.code === '23503') {
        toast.error('Impossible de supprimer cette catégorie car elle est utilisée dans des transactions');
      } else {
        toast.error(handleError(error, 'Erreur lors de la suppression'));
      }
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color,
      type: category.type
    });
    setIsOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      icon: '💰',
      color: '#057DCD',
      type: 'expense'
    });
    setEditingId(null);
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Gestion des Catégories</h2>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Catégorie
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Modifier' : 'Créer'} une catégorie
              </DialogTitle>
              <DialogDescription>
                Personnalisez vos catégories de transactions avec des icônes et couleurs.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'income' | 'expense') => 
                    setFormData({ ...formData, type: value })
                  }
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
                <Label>Nom de la catégorie</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Restaurants, Transport..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icône</Label>
                  <div className="flex items-center gap-2">
                    <EmojiPicker
                      selectedEmoji={formData.icon}
                      onEmojiSelect={(emoji) => setFormData({ ...formData, icon: emoji })}
                    />
                    <span className="text-sm text-muted-foreground">
                      Cliquez pour choisir
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Couleur</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => setFormData({ ...formData, color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_OPTIONS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: color.value }}
                            />
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingId ? 'Mettre à jour' : 'Créer'}
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

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-success">📈</span>
              Catégories de Revenus ({incomeCategories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {incomeCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${category.color}20`, border: `1px solid ${category.color}` }}
                    >
                      {category.icon}
                    </div>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {incomeCategories.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  Aucune catégorie de revenu
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-destructive">📉</span>
              Catégories de Dépenses ({expenseCategories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expenseCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${category.color}20`, border: `1px solid ${category.color}` }}
                    >
                      {category.icon}
                    </div>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {expenseCategories.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  Aucune catégorie de dépense
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};