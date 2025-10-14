-- Create user_badges table for tracking user achievements
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  badge_color TEXT NOT NULL DEFAULT '#057DCD',
  amount_achieved NUMERIC,
  date_earned DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- User badges RLS policies
CREATE POLICY "Users can view own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (true);

-- Create index for faster badge queries
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_type ON public.user_badges(badge_type);

-- Function to automatically award badges based on savings
CREATE OR REPLACE FUNCTION public.check_and_award_savings_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  total_savings NUMERIC;
  monthly_savings NUMERIC;
  user_uuid UUID;
BEGIN
  user_uuid := COALESCE(NEW.user_id, OLD.user_id);
  
  -- Calculate total savings (positive balance from all transactions)
  SELECT COALESCE(
    SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 
    0
  ) INTO total_savings
  FROM transactions 
  WHERE user_id = user_uuid;
  
  -- Calculate monthly savings for current month
  SELECT COALESCE(
    SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 
    0
  ) INTO monthly_savings
  FROM transactions 
  WHERE user_id = user_uuid 
    AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE);

  -- Award badges for total savings milestones
  IF total_savings >= 1000 AND NOT EXISTS (
    SELECT 1 FROM user_badges WHERE user_id = user_uuid AND badge_type = 'savings_1k'
  ) THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description, badge_icon, amount_achieved)
    VALUES (user_uuid, 'savings_1k', 'Premier Millier', 'Félicitations ! Vous avez épargné vos premiers 1 000 FCFA', '🥉', total_savings);
  END IF;

  IF total_savings >= 10000 AND NOT EXISTS (
    SELECT 1 FROM user_badges WHERE user_id = user_uuid AND badge_type = 'savings_10k'
  ) THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description, badge_icon, amount_achieved)
    VALUES (user_uuid, 'savings_10k', 'Épargnant Sérieux', 'Impressionnant ! 10 000 FCFA d''épargne atteints', '🥈', total_savings);
  END IF;

  IF total_savings >= 50000 AND NOT EXISTS (
    SELECT 1 FROM user_badges WHERE user_id = user_uuid AND badge_type = 'savings_50k'
  ) THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description, badge_icon, amount_achieved)
    VALUES (user_uuid, 'savings_50k', 'Maître de l''Épargne', 'Exceptionnel ! 50 000 FCFA d''épargne', '🥇', total_savings);
  END IF;

  IF total_savings >= 100000 AND NOT EXISTS (
    SELECT 1 FROM user_badges WHERE user_id = user_uuid AND badge_type = 'savings_100k'
  ) THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description, badge_icon, amount_achieved, badge_color)
    VALUES (user_uuid, 'savings_100k', 'Expert Financier', 'Légendaire ! 100 000 FCFA d''épargne', '👑', total_savings, '#FFD700');
  END IF;

  -- Award monthly consistency badges
  IF monthly_savings > 0 AND monthly_savings >= 5000 AND NOT EXISTS (
    SELECT 1 FROM user_badges 
    WHERE user_id = user_uuid 
      AND badge_type = 'monthly_saver'
      AND EXTRACT(MONTH FROM date_earned) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM date_earned) = EXTRACT(YEAR FROM CURRENT_DATE)
  ) THEN
    INSERT INTO user_badges (user_id, badge_type, badge_name, badge_description, badge_icon, amount_achieved, badge_color)
    VALUES (user_uuid, 'monthly_saver', 'Épargnant du Mois', 'Bravo ! Plus de 5 000 FCFA épargnés ce mois', '⚜️', monthly_savings, '#23AD59');
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to check badges after transaction changes
CREATE TRIGGER trigger_check_savings_badges
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_award_savings_badges();