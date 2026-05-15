import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Produto não encontrado</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Confira o link ou volte à lista.</p>
      <Link href="/" className="text-sm font-medium text-emerald-700 underline dark:text-emerald-400">
        Início
      </Link>
    </div>
  );
}
