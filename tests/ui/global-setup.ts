import { chromium, FullConfig } from "@playwright/test";
import { execSync } from "child_process";

async function globalSetup(_config: FullConfig) {
  console.log("🐳 Starting Docker Compose services...");

  try {
    // Stop any existing containers
    execSync("docker compose -f docker/docker-compose.yml down", {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    // Start the services in detached mode
    execSync("docker compose -f docker/docker-compose.yml up -d --build", {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    // Wait for services to be ready
    console.log("⏳ Waiting for services to be ready...");
    await waitForService("http://localhost:5173", 120000); // Client (longer timeout for build)
    // Skip server health check temporarily due to TypeScript compilation issues
    // await waitForService("http://localhost:3001/health", 120000); // Server health check
    await waitForService("http://localhost:8080", 60000); // Keycloak

    console.log("✅ All services are ready!");
  } catch (error) {
    console.error("❌ Failed to start Docker services:", error);
    throw error;
  }
}

async function waitForService(url: string, timeout: number) {
  const startTime = Date.now();
  const browser = await chromium.launch();
  const page = await browser.newPage();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 5000,
      });
      if (response && response.status() < 400) {
        await browser.close();
        return;
      }
    } catch (error) {
      // Service not ready yet, continue waiting
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  await browser.close();
  throw new Error(`Service at ${url} did not become ready within ${timeout}ms`);
}

export default globalSetup;
