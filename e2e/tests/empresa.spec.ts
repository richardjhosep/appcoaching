import { test, expect } from '@playwright/test'
import { seedEmpresaUser } from './helpers'

test('empresa logs in and submits a satisfaction survey', async ({ page }) => {
  const suffix = Date.now().toString()
  const { empresaEmail, empresaPassword } = await seedEmpresaUser(suffix)

  await page.goto('/login')
  await page.getByLabel('Email').fill(empresaEmail)
  await page.getByLabel('Contraseña').fill(empresaPassword)
  await page.getByRole('button', { name: 'Ingresar' }).click()

  await page.waitForURL('**/empresa/coachees')

  await page.goto('/empresa/satisfaccion')
  await expect(page.getByRole('heading', { name: 'Satisfacción y procesos' })).toBeVisible()

  const comentario = `Comentario Playwright ${suffix}`
  await page.locator('select').first().selectOption('5')
  await page.getByRole('textbox').first().fill(comentario)
  await page.getByRole('button', { name: 'Enviar encuesta' }).click()

  await expect(page.getByText(comentario)).toBeVisible()
})
