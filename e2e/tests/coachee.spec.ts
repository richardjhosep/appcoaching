import { test, expect } from '@playwright/test'
import { seedEmpresaConCoachee } from './helpers'

test('coachee logs in and registers a logro in Mi progreso', async ({ page }) => {
  const suffix = Date.now().toString()
  const { coacheeEmail, coacheePassword } = await seedEmpresaConCoachee(suffix)

  await page.goto('/login')
  await page.getByLabel('Email').fill(coacheeEmail)
  await page.getByLabel('Contraseña').fill(coacheePassword)
  await page.getByRole('button', { name: 'Ingresar' }).click()

  await page.waitForURL('**/coachee/plan')

  await page.goto('/coachee/progreso')
  await expect(page.getByRole('heading', { name: 'Mi progreso' })).toBeVisible()

  const descripcion = `Logro Playwright ${suffix}`
  await page.locator('input[type="date"]').fill('2026-07-01')
  await page.getByPlaceholder('Describe tu logro').fill(descripcion)
  await page.getByRole('button', { name: 'Agregar' }).click()

  await expect(page.getByText(descripcion)).toBeVisible()
})
