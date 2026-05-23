import Link from "next/link";

export default function ProfilingPage() {
  return (
    <main>
      <h1 className="text-2xl font-bold">Profiling Module</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/profiling/bulk-upload"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Bulk Upload
        </Link>

        <Link
          href="/profiling/my-profile"
          className="rounded border px-4 py-2"
        >
          My Profile
        </Link>

        <Link
          href="/profiling/register-tenant"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Register Tenant
        </Link>
      </div>
    </main>
  );
}