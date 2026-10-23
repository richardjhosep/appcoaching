import { test, expect, type Page } from '@playwright/test'
import { COACH_EMAIL, COACH_PASSWORD } from './helpers'

async function loginComoCoach(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(COACH_EMAIL)
  await page.getByLabel('Contraseña').fill(COACH_PASSWORD)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  // El home del coach es el Panorama (ver homeFor en frontend/src/router/index.ts).
  await page.waitForURL('**/coach/dashboard')
}

test('coach inicia sesión y aterriza en el Panorama', async ({ page }) => {
  await loginComoCoach(page)
  await expect(page.getByRole('heading', { name: 'Panorama' })).toBeVisible()
})

test('coach navega por el menú a Empresas y Coachees', async ({ page }) => {
  await loginComoCoach(page)

  const nav = page.getByRole('navigation', { name: 'Navegación principal' })
  await nav.getByRole('link', { name: 'Empresas' }).click()
  await page.waitForURL('**/coach/empresas')
  await expect(page.getByRole('heading', { name: 'Mantenedor de Empresas' })).toBeVisible()

  await nav.getByRole('link', { name: 'Coachees' }).click()
  await page.waitForURL('**/coach/coachees')
  await expect(page.getByRole('heading', { name: 'Mantenedor de Coachees' })).toBeVisible()
})

test('coach crea una empresa desde el mantenedor y se le ofrece crear su primer coachee', async ({ page }) => {
  const suffix = Date.now().toString()
  await loginComoCoach(page)

  await page.goto('/coach/empresas')
  await expect(page.getByRole('heading', { name: 'Mantenedor de Empresas' })).toBeVisible()

  await page.getByRole('button', { name: '+ Nueva Empresa' }).click()
  const dialogo = page.getByRole('dialog')
  const nombreEmpresa = `Playwright Empresa ${suffix}`
  await dialogo.getByLabel('Nombre').fill(nombreEmpresa)
  await dialogo.getByRole('spinbutton').fill('25000')
  await dialogo.getByRole('button', { name: 'Guardar' }).click()

  // Siguiente paso guiado tras crear la empresa.
  await expect(page.getByRole('link', { name: 'Crear coachee de esta empresa' })).toBeVisible()
  await expect(page.getByRole('cell', { name: nombreEmpresa })).toBeVisible()
})

test('el formulario de coachee marca el campo inválido en línea', async ({ page }) => {
  await loginComoCoach(page)

  await page.goto('/coach/coachees')
  await page.getByRole('button', { name: '+ Nuevo Coachee' }).click()
  const dialogo = page.getByRole('dialog')
  await dialogo.getByRole('button', { name: 'Guardar' }).click()

  await expect(dialogo.getByText('El nombre debe tener al menos 2 caracteres.')).toBeVisible()
  await expect(dialogo.getByLabel('Nombre')).toHaveAttribute('aria-invalid', 'true')
})
