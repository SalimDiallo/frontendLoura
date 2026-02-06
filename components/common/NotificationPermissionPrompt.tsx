"use client";

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useNotifications } from '@/lib/contexts/NotificationContext';

export function NotificationPermissionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const { requestNotificationPermission, hasPermission } = useNotifications();

  useEffect(() => {
    // Vérifier si on doit afficher le prompt
    const hasDeclined = localStorage.getItem('notification_permission_declined');
    const isSupported = typeof window !== 'undefined' && 'Notification' in window;

    if (
      isSupported &&
      !hasPermission &&
      !hasDeclined &&
      Notification.permission === 'default'
    ) {
      // Afficher le prompt après 3 secondes
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [hasPermission]);

  const handleAccept = async () => {
    await requestNotificationPermission();
    setShowPrompt(false);
  };

  const handleDecline = () => {
    localStorage.setItem('notification_permission_declined', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom-5">
      <Card className="w-80 p-4 shadow-xl border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Activer les notifications</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Recevez des notifications pour rester informé même lorsque vous n'êtes pas sur l'application.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAccept} className="flex-1 h-8">
                Activer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDecline}
                className="flex-1 h-8"
              >
                Plus tard
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleDecline}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
