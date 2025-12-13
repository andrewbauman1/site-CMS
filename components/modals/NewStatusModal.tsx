'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DateTimePicker } from '@/components/ui/datetime-picker'

interface NewStatusModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function NewStatusModal({ isOpen, onClose, onSuccess }: NewStatusModalProps) {
  const { data: session } = useSession()

  const [statusText, setStatusText] = useState('')
  const [statusDate, setStatusDate] = useState(new Date())
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setStatusText('')
    setStatusDate(new Date())
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSetStatus = async () => {
    if (!statusText.trim()) {
      alert('Please enter a status message')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statusText,
          date: statusDate
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to set status')
      }

      alert('Status updated successfully!')
      resetForm()
      onSuccess?.()
      onClose()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Set Status</DialogTitle>
          <DialogDescription>
            Update your current status message
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Date & Time</Label>
            <DateTimePicker date={statusDate} setDate={setStatusDate} />
            <p className="text-xs text-muted-foreground">
              When you want this status to be timestamped
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status Message *</Label>
            <Textarea
              id="status"
              placeholder="is feeling festive 🎄"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Your status message (emojis supported!)
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleSetStatus}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Updating...' : 'Set Status'}
            </Button>
            <Button
              onClick={handleClose}
              disabled={loading}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
