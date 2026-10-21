import { useState } from 'react'
import HeaderActions from './HeaderActions'
import HeaderNavigation from './HeaderNavigation'
import CartAccess from './CartAccess'

interface HeaderProps {
  onOpenLogin: () => void
}

export default function Header({ onOpenLogin }: HeaderProps) {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <>
      <header className="header">
        <HeaderNavigation
          onOpenLogin={onOpenLogin}
          navOpen={navOpen}
          onClose={() => setNavOpen(false)}
        />
        <HeaderActions
          onOpenLogin={onOpenLogin}
          navOpen={navOpen}
          onToggleNavigation={() => setNavOpen((current) => !current)}
        />
      </header>
      <CartAccess />
    </>
  )
}
