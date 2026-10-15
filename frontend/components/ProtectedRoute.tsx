"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";

type ProtectedRouteProps = {
children: ReactNode;
};

export default function ProtectedRoute({
children,
}: ProtectedRouteProps) {
const router = useRouter();
const pathname = usePathname();
const { user, loading } = useAuth();

useEffect(() => {
if (!loading && !user) {
const returnTo = encodeURIComponent(pathname);
router.replace(`/login?returnTo=${returnTo}`);
}
}, [loading, user, router, pathname]);

if (loading) {
return ( <main
     aria-busy="true"
     className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
   > <section className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white px-7 py-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-10"> <div className="mx-auto flex items-center justify-center gap-2"> <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
O </span> <span className="text-lg font-bold tracking-tight">
OpenShelf </span> </div>


      <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-indigo-100 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-400" />
      </div>

      <h1 className="mt-6 text-lg font-bold tracking-tight">
        Checking your session
      </h1>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Please wait while we verify your access and prepare your page.
      </p>

      <div className="mx-auto mt-5 inline-flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
        Verifying authentication
      </div>
    </section>
  </main>
);


}

if (!user) {
return null;
}

return <>{children}</>;
}
