import { expect, test } from "@playwright/test";

import { loginAsDemoUser } from "./auth";

test("seeded supervisor sees work order progress update in near real-time", async ({
  browser,
}) => {
  const supervisorContext = await browser.newContext();
  const technicianContext = await browser.newContext();
  const supervisorPage = await supervisorContext.newPage();
  const technicianPage = await technicianContext.newPage();

  try {
    await loginAsDemoUser(supervisorPage, "SUPERVISOR");
    await supervisorPage.goto("/app/work-orders/work-order-pump-2403");

    await expect(
      supervisorPage.getByText("Current step: Inspect seals and vibration"),
    ).toBeVisible();
    await expect(supervisorPage.getByText("33%")).toBeVisible();

    await loginAsDemoUser(technicianPage, "TECHNICIAN");
    await technicianPage.goto("/app/work-orders/work-order-pump-2403");

    await technicianPage
      .getByRole("textbox", { name: "Current step notes" })
      .fill("Seal housing wear confirmed. Escalated for supervisor follow-up.");
    await technicianPage
      .getByRole("button", { name: "Complete Inspect seals and vibration" })
      .click();

    await expect(
      supervisorPage.getByText("Current step: Capture findings and restore"),
    ).toBeVisible();
    await expect(supervisorPage.getByText("67%")).toBeVisible();
  } finally {
    await technicianContext.close();
    await supervisorContext.close();
  }
});
