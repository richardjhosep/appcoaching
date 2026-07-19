import { test, expect } from '@playwright/test'
import { COACH_EMAIL, COACH_PASSWORD } from './helpers'

test('coach logs in and creates a new empresa from Administración', async ({ page }) => {
  const suffix = Date.now().toString()

  await page.goto('/login')
  await page.getByLabel('Email').fill(COACH_EMAIL)
  await page.getByLabel('Contraseña').fill(COACH_PASSWORD)
  await page.getByRole('button', { name: 'Ingresar' }).click()

  await page.waitForURL('**/coach/planes')

  await page.goto('/coach/administracion')
  await expect(page.getByRole('heading', { name: 'Administración' })).toBeVisible()

  const nombreEmpresa = `Playwright Empresa ${suffix}`
  await page.getByLabel('Nombre').first().fill(nombreEmpresa)
  await page.getByLabel('Tarifa/hora (CLP)').fill('25000')
  await page.getByRole('button', { name: 'Crear empresa' }).click()

  await expect(page.getByText(nombreEmpresa)).toBeVisible()
})
