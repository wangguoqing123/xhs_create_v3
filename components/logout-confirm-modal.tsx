"use client"

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { LogOut, AlertTriangle } from 'lucide-react'

interface LogoutConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
}

export function LogoutConfirmModal({ open, onClose, onConfirm, loading = false }: LogoutConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
        <DialogHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            确认退出登录
          </DialogTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            您确定要退出当前账户吗？
          </p>
        </DialogHeader>

        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
            <LogOut className="h-4 w-4" />
            <span className="text-sm">退出后需要重新登录才能使用完整功能</span>
          </div>
        </div>

        <DialogFooter className="flex gap-3 pt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-11 rounded-xl border-gray-200 dark:border-slate-600"
          >
            取消
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-11 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                退出中...
              </div>
            ) : (
              '确认退出'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 