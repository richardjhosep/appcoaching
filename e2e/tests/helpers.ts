const API_BASE = `${process.env.APP_BASE_URL ?? 'http://localhost'}/api`

const COACH_EMAIL = process.env.SEED_COACH_EMAIL ?? 'coach@example.com'
const COACH_PASSWORD = process.env.SEED_COACH_PASSWORD ?? 'change-me-please'

async function api<T>(path: string, init?: RequestInit & { token?: string }): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (init?.token) headers.Authorization = `Bearer ${init.token}`
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (!res.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} -> ${res.status}: ${await res.text()}`)
  }
  return res.json() as Promise<T>
}

export async function loginCoach(): Promise<string> {
  const body = await api<{ accessToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: COACH_EMAIL, password: COACH_PASSWORD }),
  })
  return body.accessToken
}

export async function seedEmpresaConCoachee(suffix: string) {
  const coachToken = await loginCoach()
  const empresa = await api<{ id: string }>('/empresas', {
    method: 'POST',
    token: coachToken,
    body: JSON.stringify({ nombre: `E2E Empresa ${suffix}`, tarifaHora: 20000 }),
  })
  const { coachee, temporaryPassword } = await api<{
    coachee: { id: string; nombre: string }
    temporaryPassword: string
  }>('/coachees', {
    method: 'POST',
    token: coachToken,
    body: JSON.stringify({
      nombre: `E2E Coachee ${suffix}`,
      email: `e2e-coachee-${suffix}@example.com`,
      empresaId: empresa.id,
    }),
  })
  return {
    empresaId: empresa.id,
    coacheeId: coachee.id,
    coacheeEmail: `e2e-coachee-${suffix}@example.com`,
    coacheePassword: temporaryPassword,
  }
}

export async function seedEmpresaUser(suffix: string) {
  const coachToken = await loginCoach()
  const empresa = await api<{ id: string }>('/empresas', {
    method: 'POST',
    token: coachToken,
    body: JSON.stringify({ nombre: `E2E Empresa User ${suffix}`, tarifaHora: 20000 }),
  })
  const empresaEmail = `e2e-empresa-${suffix}@example.com`
  const user = await api<{ temporaryPassword: string }>('/users', {
    method: 'POST',
    token: coachToken,
    body: JSON.stringify({ email: empresaEmail, role: 'empresa', empresaId: empresa.id }),
  })
  return { empresaId: empresa.id, empresaEmail, empresaPassword: user.temporaryPassword }
}

export { COACH_EMAIL, COACH_PASSWORD }
