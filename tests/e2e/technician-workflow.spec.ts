import { expect, test } from "@playwright/test";

import { loginAsDemoUser } from "./auth";

test("seeded technician can complete the first step on an assigned work order", async ({
  page,
}) => {
  await loginAsDemoUser(page, "TECHNICIAN");

  await page
    .getByRole("link", { name: /recover sensor rack communications/i })
    .click();

  await page.getByRole("button", { name: "Start work order" }).click();
  await expect(
    page.getByRole("button", { name: "Complete Confirm fault scope" }),
  ).toBeVisible();

  await page
    .getByRole("textbox", { name: "Current step notes" })
    .fill("Cabinet fault confirmed and line segment isolated for recovery.");
  await page
    .getByRole("button", { name: "Complete Confirm fault scope" })
    .click();

  await expect(page.getByText("33%")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Complete Restore rack communications" }),
  ).toBeVisible();
});
