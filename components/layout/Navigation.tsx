'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { signOut, useSession } from 'next-auth/react'
import { PlusCircle, Settings, Menu, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { NewNoteModal } from '@/components/modals/NewNoteModal'
import { NewPostModal } from '@/components/modals/NewPostModal'
import { NewStoryModal } from '@/components/modals/NewStoryModal'
import { NewPhotoModal } from '@/components/modals/NewPhotoModal'
import { NewStatusModal } from '@/components/modals/NewStatusModal'

type ModalType = 'note' | 'post' | 'story' | 'photo' | 'status' | null

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { resolvedTheme, setTheme } = useTheme()
  const [openModal, setOpenModal] = useState<ModalType>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/notes', label: 'Notes' },
    { href: '/stories', label: 'Stories' },
    { href: '/posts', label: 'Posts' },
    { href: '/photos', label: 'Photos' },
  ]

  if (!session) {
    return null
  }

  const handleModalOpen = (modal: ModalType) => {
    setOpenModal(modal)
    setMobileMenuOpen(false)
  }

  return (
    <>
      <nav className="border-b bg-background">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xl font-bold">
                drewsiph.dev
              </Link>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px]">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 mt-6">
                    {/* New Actions */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground px-2">Create New</p>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleModalOpen('status')}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        New Status
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleModalOpen('note')}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        New Note
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleModalOpen('post')}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        New Post
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleModalOpen('story')}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        New Story
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleModalOpen('photo')}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        New Photo
                      </Button>
                    </div>

                    {/* Navigation Links */}
                    <div className="space-y-2 pt-4 border-t">
                      <p className="text-sm font-medium text-muted-foreground px-2">Navigate</p>
                      {navItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                            pathname === item.href
                              ? 'bg-accent text-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                      <Link
                        href="/drafts"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                          pathname === '/drafts'
                            ? 'bg-accent text-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        Drafts
                      </Link>
                    </div>

                    {/* User Actions */}
                    <div className="space-y-2 pt-4 border-t">
                      <p className="text-sm font-medium text-muted-foreground px-2">Account</p>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          setMobileMenuOpen(false)
                          router.push('/settings')
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => signOut()}
                      >
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop Navigation */}
              <div className="hidden md:flex gap-4 items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" size="sm" className="gap-1 rounded-full">
                      <PlusCircle className="h-4 w-4" />
                      New
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setOpenModal('status')}>
                      New Status
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenModal('note')}>
                      New Note
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenModal('post')}>
                      New Post
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenModal('story')}>
                      New Story
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenModal('photo')}>
                      New Photo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {navItems.map((item) => (
                  <Button
                    key={item.href}
                    variant="pill"
                    size="sm"
                    asChild
                    className={pathname === item.href ? 'border-[var(--activeColor)] text-[var(--activeColor)]' : 'text-muted-foreground'}
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}

                <Button
                  variant="pill"
                  size="sm"
                  asChild
                  className={pathname === '/drafts' ? 'border-[var(--activeColor)] text-[var(--activeColor)]' : 'text-muted-foreground'}
                >
                  <Link href="/drafts">Drafts</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                aria-label="Toggle dark mode"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-sm">
                    {session.user?.name || session.user?.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Modals - lazy mounted, only rendered while open */}
      {openModal === 'status' && (
        <NewStatusModal
          isOpen
          onClose={() => setOpenModal(null)}
          onSuccess={() => {
            window.location.reload()
          }}
        />
      )}
      {openModal === 'note' && (
        <NewNoteModal
          isOpen
          onClose={() => setOpenModal(null)}
          onSuccess={() => {
            window.location.reload()
          }}
        />
      )}
      {openModal === 'post' && (
        <NewPostModal
          isOpen
          onClose={() => setOpenModal(null)}
          onSuccess={() => {
            window.location.reload()
          }}
        />
      )}
      {openModal === 'story' && (
        <NewStoryModal
          isOpen
          onClose={() => setOpenModal(null)}
          onSuccess={() => {
            window.location.reload()
          }}
        />
      )}
      {openModal === 'photo' && (
        <NewPhotoModal
          isOpen
          onClose={() => setOpenModal(null)}
        />
      )}
    </>
  )
}
