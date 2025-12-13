'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface NewPhotoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NewPhotoModal({ isOpen, onClose }: NewPhotoModalProps) {
  const router = useRouter()

  const handleOpenFullPage = () => {
    onClose()
    router.push('/photo')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Photos</DialogTitle>
          <DialogDescription>
            The photo upload feature works best on a full page due to its advanced features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Photo Upload Features:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Batch upload multiple photos at once</li>
              <li>Drag & drop interface</li>
              <li>Image cropping and straightening</li>
              <li>Individual metadata for each photo</li>
              <li>Album management</li>
            </ul>
          </div>

          <Button
            onClick={handleOpenFullPage}
            className="w-full"
          >
            Open Photo Upload Page
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
