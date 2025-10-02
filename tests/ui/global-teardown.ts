import { FullConfig } from "@playwright/test";
import { execSync } from "child_process";

async function globalTeardown(_config: FullConfig) {
  console.log("🐳 Stopping Docker Compose services...");

  try {
    // Stop and remove containers, networks, volumes
    execSync("docker compose -f docker/docker-compose.yml down -v", {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    console.log("✅ Docker services stopped successfully");
  } catch (error) {
    console.error("❌ Failed to stop Docker services:", error);
    // Don't throw here to avoid blocking other cleanup
  }
}

export default globalTeardown;
