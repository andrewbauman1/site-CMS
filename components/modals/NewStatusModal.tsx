'use client'

import { useState, useEffect } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'

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
  const [currentStatus, setCurrentStatus] = useState<{ statusText: string; date: string } | null>(null)
  const [fetchingStatus, setFetchingStatus] = useState(false)

  useEffect(() => {
    if (isOpen && session) {
      fetchCurrentStatus()
    }
  }, [isOpen, session])

  const fetchCurrentStatus = async () => {
    setFetchingStatus(true)
    try {
      const response = await fetch('/api/status')
      if (response.ok) {
        const data = await response.json()
        setCurrentStatus({
          statusText: data.statusText,
          date: data.date
        })
      } else {
        setCurrentStatus(null)
      }
    } catch (error) {
      console.error('Failed to fetch current status:', error)
      setCurrentStatus(null)
    } finally {
      setFetchingStatus(false)
    }
  }

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

  const handleClearStatus = async () => {
    if (!confirm('Are you sure you want to clear your status?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statusText: '',
          date: new Date()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to clear status')
      }

      alert('Status cleared successfully!')
      setCurrentStatus(null)
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
          {fetchingStatus ? (
            <Alert>
              <AlertDescription>Loading current status...</AlertDescription>
            </Alert>
          ) : currentStatus ? (
            <Alert>
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Current Status:</p>
                  <p className="text-sm">{currentStatus.statusText}</p>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(currentStatus.date).toLocaleString()}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertDescription>No status currently set</AlertDescription>
            </Alert>
          )}

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
            {currentStatus && (
              <Button
                onClick={handleClearStatus}
                disabled={loading}
                variant="destructive"
              >
                {loading ? 'Clearing...' : 'Clear Status'}
              </Button>
            )}
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
