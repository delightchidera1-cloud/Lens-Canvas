import React, { useState, useEffect } from 'react';
import { ShoppingBag, TrendingUp, UserCheck, CreditCard, X } from 'lucide-react';

interface NotificationData {
  id: string;
  type: 'sale' | 'withdrawal' | 'signup' | 'purchase';
  name: string;
  message: string;
  amount?: string;
  timeAgo: string;
}

// Huge data sets for millions of combinations
const firstNames = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Mayor", "Alex", "Sam", "Chris", "Jordan", "Taylor", "Morgan", "Riley", "Cameron", "Dakota"];
const lastInitials = ["A.", "B.", "C.", "D.", "E.", "F.", "G.", "H.", "J.", "K.", "L.", "M.", "N.", "P.", "R.", "S.", "T.", "W.", "Y.", "Z."];
const artworks = ["Neon Cyberpunk", "Mountain Silhouette", "Abstract Void", "Vintage Portrait", "Ocean Breeze", "Urban Decay", "Golden Hour", "Midnight Symphony", "Crimson Flow", "Lunar Escape", "Desert Mirage", "Ethereal Glow", "Shattered Reality", "Serene Valley", "Galactic Drift"];
const locations = ["New York", "London", "Tokyo", "Berlin", "Paris", "Toronto", "Sydney", "Dubai", "Singapore", "Los Angeles", "Chicago", "Miami", "Austin", "San Francisco", "Seattle"];
const methods = ["PayPal", "Bitcoin", "Bank Transfer", "Apple Pay"];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomAmount = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
const getRandomTime = () => `${Math.floor(Math.random() * 59) + 1} sec ago`;

const generateNotification = (): NotificationData => {
  const types: Array<'sale' | 'withdrawal' | 'signup' | 'purchase'> = ['sale', 'withdrawal', 'signup', 'purchase'];
  const type = getRandomItem(types);
  const name = `${getRandomItem(firstNames)} ${getRandomItem(lastInitials)}`;
  
  let message = '';
  let amount = '';

  switch (type) {
    case 'sale':
      amount = `$${getRandomAmount(150, 1500)}`;
      message = `just sold "${getRandomItem(artworks)}" for ${amount}`;
      break;
    case 'withdrawal':
      amount = `$${getRandomAmount(500, 5000)}`;
      message = `just withdrew ${amount} using ${getRandomItem(methods)}`;
      break;
    case 'signup':
      message = `from ${getRandomItem(locations)} just became a Verified Seller!`;
      break;
    case 'purchase':
      amount = `$${getRandomAmount(50, 800)}`;
      message = `Someone in ${getRandomItem(locations)} just bought "${getRandomItem(artworks)}"`;
      break;
  }

  return {
    id: `notif-${Date.now()}-${Math.random()}`,
    type,
    name: type === 'purchase' ? 'New Order' : name,
    message,
    amount,
    timeAgo: getRandomTime()
  };
};

export const SocialProofNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    // Start generating after a short delay
    const initialDelay = setTimeout(() => {
      triggerBurst();
    }, 2000);

    return () => clearTimeout(initialDelay);
  }, []);

  const triggerBurst = () => {
    // 1 to 3 notifications in a burst
    const numNotifications = Math.floor(Math.random() * 3) + 1;
    const newNotifs: NotificationData[] = [];
    
    for (let i = 0; i < numNotifications; i++) {
      newNotifs.push(generateNotification());
    }

    setNotifications(prev => {
      const combined = [...newNotifs, ...prev];
      return combined.slice(0, 5); // Keep max 5 on screen
    });

    // Remove them after 5-8 seconds
    const displayTime = getRandomAmount(5000, 8000);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => !newNotifs.find(nn => nn.id === n.id)));
    }, displayTime);

    // Schedule next burst (between 6 and 18 seconds)
    const nextBurstDelay = getRandomAmount(6000, 18000);
    setTimeout(triggerBurst, nextBurstDelay);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'sale': return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'withdrawal': return <CreditCard className="w-5 h-5 text-sky-400" />;
      case 'signup': return <UserCheck className="w-5 h-5 text-[#FF854D]" />;
      case 'purchase': return <ShoppingBag className="w-5 h-5 text-[#E040FB]" />;
      default: return null;
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3 pointer-events-none w-80">
      {notifications.map((notif) => (
        <div 
          key={notif.id}
          className="pointer-events-auto bg-[#0a0a0e]/80 backdrop-blur-md border border-zinc-800/80 p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-slide-up hover:border-zinc-700 transition-colors group relative"
        >
          <div className="mt-1 bg-zinc-900 border border-zinc-800 p-2 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
            {getIcon(notif.type)}
          </div>
          
          <div className="flex-1 pr-4">
            <p className="text-xs text-white font-bold mb-0.5">
              {notif.name}
            </p>
            <p className="text-[11px] text-zinc-400 leading-tight">
              {notif.message}
            </p>
            <p className="text-[9px] text-zinc-500 mt-1.5 font-mono uppercase tracking-wider">
              {notif.timeAgo}
            </p>
          </div>

          <button 
            onClick={() => removeNotification(notif.id)}
            className="absolute top-2 right-2 text-zinc-600 hover:text-white p-1 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
};
