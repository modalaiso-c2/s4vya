import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Award, Calendar } from 'lucide-react';

interface UserBadge {
  id: string;
  badge_type: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_color: string;
  amount_achieved: number | null;
  date_earned: string;
}

export const UserBadges = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserBadges();
    }
  }, [user]);

  const fetchUserBadges = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('user_badges')
        .select('*')
        .order('date_earned', { ascending: false });

      if (error) throw error;
      setBadges((data as UserBadge[]) || []);
    } catch (error) {
      console.error('Error fetching user badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgesByType = () => {
    const savingsBadges = badges.filter(b => b.badge_type.startsWith('savings_'));
    const monthlyBadges = badges.filter(b => b.badge_type === 'monthly_saver');
    const otherBadges = badges.filter(b => !b.badge_type.startsWith('savings_') && b.badge_type !== 'monthly_saver');

    return { savingsBadges, monthlyBadges, otherBadges };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const { savingsBadges, monthlyBadges, otherBadges } = getBadgesByType();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Award className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Mes Badges d'Achievement</h2>
        <Badge variant="secondary" className="ml-2">
          {badges.length} badge{badges.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {badges.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun badge pour le moment</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Commencez à épargner pour débloquer vos premiers badges ! 
                Le premier badge s'obtient à partir de 1 000 FCFA d'épargne.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Badges d'épargne */}
          {savingsBadges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  💰 Badges d'Épargne
                  <Badge variant="outline">{savingsBadges.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savingsBadges.map((badge) => (
                    <TooltipProvider key={badge.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="group cursor-pointer">
                            <div 
                              className="relative p-4 rounded-lg border-2 bg-gradient-to-br from-background to-muted/50 hover:shadow-md transition-all duration-200 group-hover:scale-105"
                              style={{ borderColor: badge.badge_color }}
                            >
                              <div className="text-center space-y-2">
                                <div className="text-3xl">{badge.badge_icon}</div>
                                <h3 className="font-semibold text-sm">{badge.badge_name}</h3>
                                {badge.amount_achieved && (
                                  <p className="text-xs font-mono" style={{ color: badge.badge_color }}>
                                    {formatAmount(badge.amount_achieved)}
                                  </p>
                                )}
                              </div>
                              <div className="absolute top-2 right-2">
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs h-5"
                                  style={{ backgroundColor: `${badge.badge_color}20` }}
                                >
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {formatDate(badge.date_earned)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-xs p-2">
                            <p className="font-medium">{badge.badge_name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {badge.badge_description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Obtenu le {formatDate(badge.date_earned)}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Badges mensuels */}
          {monthlyBadges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  ⚜️ Badges de Consistance
                  <Badge variant="outline">{monthlyBadges.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {monthlyBadges.map((badge) => (
                    <TooltipProvider key={badge.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="group cursor-pointer">
                            <div 
                              className="relative p-3 rounded-lg border-2 bg-gradient-to-br from-background to-muted/50 hover:shadow-md transition-all duration-200 group-hover:scale-105"
                              style={{ borderColor: badge.badge_color }}
                            >
                              <div className="text-center space-y-1">
                                <div className="text-2xl">{badge.badge_icon}</div>
                                <h3 className="font-medium text-xs">{badge.badge_name}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(badge.date_earned).toLocaleDateString('fr-FR', { 
                                    month: 'short', 
                                    year: '2-digit' 
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-xs p-2">
                            <p className="font-medium">{badge.badge_name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {badge.badge_description}
                            </p>
                            {badge.amount_achieved && (
                              <p className="text-xs font-mono mt-1" style={{ color: badge.badge_color }}>
                                {formatAmount(badge.amount_achieved)} épargnés
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Autres badges */}
          {otherBadges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🎯 Autres Accomplissements
                  <Badge variant="outline">{otherBadges.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {otherBadges.map((badge) => (
                    <TooltipProvider key={badge.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="group cursor-pointer">
                            <div 
                              className="relative p-4 rounded-lg border-2 bg-gradient-to-br from-background to-muted/50 hover:shadow-md transition-all duration-200 group-hover:scale-105"
                              style={{ borderColor: badge.badge_color }}
                            >
                              <div className="text-center space-y-2">
                                <div className="text-3xl">{badge.badge_icon}</div>
                                <h3 className="font-semibold text-sm">{badge.badge_name}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(badge.date_earned)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-xs p-2">
                            <p className="font-medium">{badge.badge_name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {badge.badge_description}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Progression vers le prochain badge */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🎯 Prochains Objectifs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {!savingsBadges.some(b => b.badge_type === 'savings_1k') && (
              <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                <span>🥉</span>
                <span>Épargnez 1 000 FCFA pour débloquer "Premier Millier"</span>
              </div>
            )}
            {!savingsBadges.some(b => b.badge_type === 'savings_10k') && (
              <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                <span>🥈</span>
                <span>Épargnez 10 000 FCFA pour débloquer "Épargnant Sérieux"</span>
              </div>
            )}
            {!savingsBadges.some(b => b.badge_type === 'savings_50k') && (
              <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                <span>🥇</span>
                <span>Épargnez 50 000 FCFA pour débloquer "Maître de l'Épargne"</span>
              </div>
            )}
            {!savingsBadges.some(b => b.badge_type === 'savings_100k') && (
              <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                <span>👑</span>
                <span>Épargnez 100 000 FCFA pour débloquer "Expert Financier"</span>
              </div>
            )}
            <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
              <span>⚜️</span>
              <span>Épargnez 5 000 FCFA par mois pour obtenir "Épargnant du Mois"</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};