import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  selectedEmoji?: string;
  disabled?: boolean;
}

const EMOJI_CATEGORIES = {
  finance: {
    name: 'Finance',
    emojis: ['💰', '💵', '💴', '💶', '💷', '💳', '🏦', '📊', '📈', '📉', '💎', '🪙']
  },
  food: {
    name: 'Alimentation',
    emojis: ['🍎', '🍔', '🍕', '☕', '🥗', '🍽️', '🛒', '🥖', '🧀', '🍖', '🥕', '🍺']
  },
  transport: {
    name: 'Transport',
    emojis: ['🚗', '🚙', '🚌', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚲', '🛵', '🏍️', '✈️', '🚂', '⛽']
  },
  home: {
    name: 'Logement',
    emojis: ['🏠', '🏡', '🏢', '🏬', '🏭', '🏗️', '🏘️', '🛏️', '🛋️', '🚿', '🔌', '💡', '🔧']
  },
  entertainment: {
    name: 'Loisirs',
    emojis: ['🎮', '🎬', '🎭', '🎪', '🎨', '🎯', '🎳', '⚽', '🏀', '🎸', '📚', '📺', '🎧']
  },
  health: {
    name: 'Santé',
    emojis: ['💊', '🏥', '⚕️', '🩺', '💉', '🦷', '👨‍⚕️', '👩‍⚕️', '🧘', '🏃‍♂️', '🏋️‍♀️', '🥗']
  },
  shopping: {
    name: 'Shopping',
    emojis: ['🛍️', '👗', '👕', '👖', '👠', '👟', '👜', '💄', '💍', '👓', '🎁', '🧴']
  },
  education: {
    name: 'Éducation',
    emojis: ['📚', '✏️', '🖊️', '📝', '📐', '🎓', '🏫', '👨‍🎓', '👩‍🎓', '💻', '📱', '🖥️']
  },
  travel: {
    name: 'Voyage',
    emojis: ['✈️', '🗺️', '🧳', '🏖️', '🏔️', '🎿', '🏕️', '📷', '🎒', '🧭', '🎡', '🗽']
  },
  special: {
    name: 'Spéciaux',
    emojis: ['⚜️', '🔥', '⭐', '🌟', '💫', '✨', '🎯', '🏆', '👑', '💝', '🎊', '🎉']
  }
};

export const EmojiPicker = ({ onEmojiSelect, selectedEmoji, disabled }: EmojiPickerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredCategories = Object.entries(EMOJI_CATEGORIES).reduce((acc, [key, category]) => {
    if (!searchTerm) {
      acc[key] = category;
    } else {
      const filteredEmojis = category.emojis.filter(emoji => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filteredEmojis.length > 0) {
        acc[key] = { ...category, emojis: filteredEmojis };
      }
    }
    return acc;
  }, {} as typeof EMOJI_CATEGORIES);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="w-12 h-12 p-0 text-lg"
        >
          {selectedEmoji || '😊'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un emoji..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <ScrollArea className="h-64">
          <div className="p-3 space-y-4">
            {Object.entries(filteredCategories).map(([key, category]) => (
              <div key={key}>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {category.name}
                </h4>
                <div className="grid grid-cols-8 gap-1">
                  {category.emojis.map((emoji) => (
                    <Button
                      key={emoji}
                      variant={selectedEmoji === emoji ? "default" : "ghost"}
                      size="sm"
                      className="w-8 h-8 p-0 text-base hover:bg-muted"
                      onClick={() => handleEmojiClick(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};