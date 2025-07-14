"use client"

import { useCreditsContext } from '@/components/credits-context'
import { useEffect, memo } from 'react'
import { Gem, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface CreditsDisplayProps {
  showRefresh?: boolean
  compact?: boolean
  className?: string
}

export function CreditsDisplay() {
  const { balance, loading } = useCreditsContext();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-yellow-200 dark:bg-yellow-700 rounded w-16"></div>
      </div>
    );
  }

  return (
    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
      {balance?.current || 0} 积分
    </span>
  );
} 