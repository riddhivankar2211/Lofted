'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Briefcase, Users, MessageSquare, LogOut, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'
import Avatar from './ui/Avatar'

const navItems = [
  { href: '/feed',      label: 'Home',     icon: Home },
  { href: '/network',   label: 'Network',  icon: Users },
  { href: '/jobs',      label: 'Jobs',     icon: Briefcase },
  { href: '/messaging', label: 'Messages', icon: MessageSquare },
]

interface NavbarProps {
  profile: Profile
}

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link href="/feed" className="text-xl font-bold text-brand-600 mr-2 flex-shrink-0">
          Lofted
        </Link>

        <div className="flex-1 max-w-xs relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-100 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <nav className="flex items-center gap-1 ml-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'text-brand-600 bg-brand-50'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden sm:block">{label}</span>
            </Link>
          ))}

          <Link href={`/profile/${profile.id}`} className="ml-1">
            <Avatar src={profile.avatar_url} name={profile.full_name} size="sm" />
          </Link>

          <button
            onClick={handleSignOut}
            className="ml-1 p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </header>
  )
}
