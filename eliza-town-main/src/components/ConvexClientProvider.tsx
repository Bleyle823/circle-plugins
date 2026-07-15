import { ReactNode } from 'react';
import { ConvexReactClient, ConvexProvider } from 'convex/react';
// import { ConvexProviderWithClerk } from 'convex/react-clerk';
// import { ClerkProvider, useAuth } from '@clerk/clerk-react';

function convexUrl(): string | null {
  const url = import.meta.env.VITE_CONVEX_URL as string | undefined;
  return url?.trim() || null;
}

function ConvexSetupRequired() {
  return (
    <div className="min-h-screen bg-[#23263a] text-white flex items-center justify-center p-8 font-dialog">
      <div className="max-w-lg space-y-4 text-center">
        <h1 className="text-2xl text-[#a395b8] uppercase tracking-wide">Convex not configured</h1>
        <p className="text-[#e0dce6] leading-relaxed">
          The game needs a Convex backend. In a new terminal, run:
        </p>
        <pre className="text-left bg-[#1a1821] border-2 border-[#4a3b5b] p-4 text-sm overflow-x-auto">
          {`npx convex dev`}
        </pre>
        <p className="text-[#a395b8] text-sm">
          Follow the login prompts. Convex will create <code>.env.local</code> with{' '}
          <code>VITE_CONVEX_URL</code>, then restart <code>npm run dev</code>.
        </p>
      </div>
    </div>
  );
}

const convexUrlValue = convexUrl();
const convex = convexUrlValue
  ? new ConvexReactClient(convexUrlValue, { unsavedChangesWarning: false })
  : null;

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return <ConvexSetupRequired />;
  }

  return (
    // <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string}>
    // <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
    <ConvexProvider client={convex}>{children}</ConvexProvider>
    // </ConvexProviderWithClerk>
    // </ClerkProvider>
  );
}
