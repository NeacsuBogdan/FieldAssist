import { expect, type Page } from "@playwright/test";

type DemoRole = "SUPERVISOR" | "TECHNICIAN";

const roleConfig: Record<
  DemoRole,
  {
    landingPath: string;
    loginButton: string;
  }
> = {
  SUPERVISOR: {
    landingPath: "/app/dashboard",
    loginButton: "Use supervisor demo account",
  },
  TECHNICIAN: {
    landingPath: "/app/work-orders",
    loginButton: "Use technician demo account",
  },
};

export const loginAsDemoUser = async (page: Page, role: DemoRole) => {
  const config = roleConfig[role];

  await page.goto("/login");
  await page.getByRole("button", { name: config.loginButton }).click();
  await page.getByRole("button", { name: "Sign in to FieldAssist" }).click();

  await expect(page).toHaveURL(new RegExp(`${config.landingPath}$`));
};
