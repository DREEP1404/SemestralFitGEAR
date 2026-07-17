import { UserProfile } from '@clerk/tanstack-react-start'
import { clerkDarkAppearance } from '../lib/clerkAppearance'

export function AccountPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-lime-400">Cuenta personal</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">Perfil y seguridad</h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Gestiona tu información personal, seguridad y preferencias de sesión.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Editar perfil</h3>
        <div className="[&_*]:!text-slate-100">
          <UserProfile routing="path" path="/account" appearance={clerkDarkAppearance} />
        </div>
      </div>
    </section>
  )
}

