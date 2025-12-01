import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, User, ShoppingCart, Home, Bookmark, Package, Tag, HelpCircle, LogOut, MapPin, Edit, Heart, X, ChevronRight, CreditCard, Settings, Crown, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCart } from '@/hooks/useCart';
import { GlobalSearch } from '@/components/GlobalSearch';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { cartItems } = useCart();
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/catalog', label: 'Catalogs', icon: Bookmark },
    { href: '/bundles', label: 'Bundles', icon: Package },
    { href: '/promotions', label: 'Promotions', icon: Tag },
    { href: '/community', label: 'Community', icon: Users },
    { href: '/support', label: 'Support', icon: HelpCircle },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
          isScrolled
            ? "bg-mtrix-black/80 backdrop-blur-xl border-white/10 py-3 shadow-lg"
            : "bg-transparent border-transparent py-5"
        )}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <a href="/" className="group relative">
                <h1 className="text-2xl font-orbitron font-bold text-gradient-gold tracking-wider group-hover:opacity-80 transition-opacity">
                  MTRIX
                </h1>
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-gold transition-all duration-300 group-hover:w-full" />
              </a>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "relative text-sm font-medium transition-all duration-300 hover:bg-white/5",
                        isActive(link.href)
                          ? "text-primary"
                          : "text-muted-foreground hover:text-primary"
                      )}
                    >
                      <link.icon className={cn("w-4 h-4 mr-2", isActive(link.href) && "text-primary")} />
                      {link.label}
                      {isActive(link.href) && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
                      )}
                    </Button>
                  </a>
                ))}
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <div className="hidden md:block mr-2">
                <GlobalSearch />
              </div>

              <a href="/wishlist">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary hover:bg-white/5 transition-colors"
                >
                  <Heart className="w-5 h-5" />
                </Button>
              </a>

              <a href="/cart">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary hover:bg-white/5 transition-colors relative"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-mtrix-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </a>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 min-w-[2.5rem] aspect-square rounded-full border border-primary/30 hover:border-primary hover:shadow-[0_0_15px_-3px_rgba(234,179,8,0.4)] transition-all duration-500 overflow-hidden shrink-0 p-0 group"
                      title={user.user_metadata?.full_name || user.email}
                    >
                      <Avatar className="h-full w-full">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email || ''} className="object-cover" />
                        <AvatarFallback className="w-full h-full bg-zinc-950 text-primary font-orbitron font-bold flex items-center justify-center text-sm leading-none pb-0.5 group-hover:bg-zinc-900 transition-colors">
                          {user.user_metadata?.full_name
                            ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                            : user.email?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 bg-mtrix-black/95 backdrop-blur-2xl border-white/10 text-foreground p-0 overflow-hidden shadow-2xl" align="end" forceMount>

                    {/* User Header */}
                    <div className="relative p-6 bg-gradient-to-br from-gold/20 via-black to-black border-b border-white/10">
                      <div className="absolute top-0 right-0 p-2">
                        <div className="bg-gold/10 border border-gold/20 rounded-full px-2 py-0.5 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-gold" />
                          <span className="text-[10px] font-bold text-gold uppercase tracking-wider">Member</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-gold/30 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                          <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email || ''} />
                          <AvatarFallback className="bg-zinc-800 text-white font-bold">
                            {user.user_metadata?.full_name
                              ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                              : <User className="w-5 h-5" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{user.user_metadata?.full_name || 'User'}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => navigate('/my-orders')} className="group p-3 cursor-pointer focus:bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3 w-full">
                            <div className="p-2 rounded-md bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20 transition-colors">
                              <Package className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <span className="font-medium text-sm">My Orders</span>
                              <p className="text-xs text-muted-foreground">Track & manage orders</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
                          </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => navigate('/wishlist')} className="group p-3 cursor-pointer focus:bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3 w-full">
                            <div className="p-2 rounded-md bg-pink-500/10 text-pink-500 group-hover:bg-pink-500/20 transition-colors">
                              <Heart className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <span className="font-medium text-sm">Wishlist</span>
                              <p className="text-xs text-muted-foreground">Saved items</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
                          </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => navigate('/profile')} className="group p-3 cursor-pointer focus:bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3 w-full">
                            <div className="p-2 rounded-md bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20 transition-colors">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <span className="font-medium text-sm">Addresses</span>
                              <p className="text-xs text-muted-foreground">Manage delivery locations</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>

                      <DropdownMenuSeparator className="bg-white/10 my-2" />

                      <DropdownMenuItem onClick={() => navigate('/profile')} className="group p-3 cursor-pointer focus:bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Settings className="w-4 h-4 text-muted-foreground group-hover:text-white" />
                          <span className="text-sm">Account Settings</span>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => signOut()} className="group p-3 cursor-pointer focus:bg-red-500/10 rounded-lg text-red-400 focus:text-red-400">
                        <div className="flex items-center gap-3">
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Sign Out</span>
                        </div>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-gold text-mtrix-black hover:shadow-gold transition-all duration-300 font-semibold ml-2"
                >
                  Sign In
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-muted-foreground hover:text-primary"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-mtrix-black/95 backdrop-blur-2xl transition-all duration-500 md:hidden",
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-orbitron font-bold text-gradient-gold">MTRIX</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
              className="text-muted-foreground hover:text-primary"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6">
            <div className="space-y-2">
              {navLinks.map((link, index) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl transition-all duration-300 group",
                    isActive(link.href)
                      ? "bg-white/10 text-primary"
                      : "hover:bg-white/5 text-muted-foreground hover:text-primary"
                  )}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      isActive(link.href) ? "bg-primary/20" : "bg-white/5 group-hover:bg-primary/10"
                    )}>
                      <link.icon className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-medium">{link.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </a>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            {!user ? (
              <Button
                onClick={() => navigate('/auth')}
                className="w-full bg-gradient-gold text-mtrix-black hover:shadow-gold py-6 text-lg font-semibold"
              >
                Sign In / Register
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                  <Avatar className="h-10 w-10 border border-gold/30">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email || ''} className="object-cover" />
                    <AvatarFallback className="bg-gradient-gold text-mtrix-black font-bold">
                      {user.user_metadata?.full_name
                        ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                        : user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">Signed in as</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <Button
                  onClick={() => signOut()}
                  variant="destructive"
                  className="w-full py-6 text-lg"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;