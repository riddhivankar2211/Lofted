import Image from 'next/image'
import { getInitials, cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm:  { px: 32,  cls: 'w-8 h-8 text-xs' },
  md:  { px: 40,  cls: 'w-10 h-10 text-sm' },
  lg:  { px: 56,  cls: 'w-14 h-14 text-base' },
  xl:  { px: 96,  cls: 'w-24 h-24 text-xl' },
}

export default function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const { px, cls } = sizes[size]

  if (src) {
    return (
      <div className={cn('relative rounded-full overflow-hidden flex-shrink-0', cls, className)}>
        <Image src={src} alt={name} width={px} height={px} className="object-cover w-full h-full" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex-shrink-0 bg-brand-100 text-brand-700 flex items-center justify-center font-semibold',
        cls,
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
