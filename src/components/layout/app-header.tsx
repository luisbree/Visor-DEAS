import { Logo } from '@/components/icons/logo';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-center">
          <Logo className="h-6 w-6 mr-2 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Genesis Canvas</h1>
        </div>
        {/* Add navigation or user profile section here if needed in the future */}
      </div>
    </header>
  );
}
