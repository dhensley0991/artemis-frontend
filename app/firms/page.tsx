return (
  <div className="min-h-screen bg-slate-100 text-slate-950">
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

      <div className="mb-6 rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Firms</h1>
            <p className="mt-2 text-sm text-slate-500">
              View Pertinent Information about the Management Company or Create a New Entity.
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {showCreateFirm && (
        <div className="mb-6 rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Create New Firm</h2>

          <form
            onSubmit={handleCreateFirm}
            className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >

            {/* ALL YOUR FORM FIELDS STAY EXACTLY THE SAME */}

            <div className="md:col-span-2 xl:col-span-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Firm"}
              </button>
            </div>

          </form>
        </div>
      )}

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">All Firms</h2>
          <div className="text-sm text-slate-500">Count: {firms.length}</div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading firms...</p>
        ) : firms.length === 0 ? (
          <p className="text-sm text-slate-500">No firms found yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Primary Admin</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">EIN</th>
                  <th className="px-4 py-3">Account Number</th>
                </tr>
              </thead>

              <tbody>
                {firms.map((firm) => (
                  <tr key={firm.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3">{firm.id}</td>
                    <td className="px-4 py-3 font-medium">{firm.name}</td>
                    <td className="px-4 py-3">{firm.primary_admin_name || "-"}</td>
                    <td className="px-4 py-3">{firm.email || "-"}</td>
                    <td className="px-4 py-3">{firm.phone || "-"}</td>
                    <td className="px-4 py-3">{firm.city || "-"}</td>
                    <td className="px-4 py-3">{firm.state_province || "-"}</td>
                    <td className="px-4 py-3">{firm.country || "-"}</td>
                    <td className="px-4 py-3">{firm.ein || "-"}</td>
                    <td className="px-4 py-3">{firm.account_number || "-"}</td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </div>

    </div>
  </div>
);