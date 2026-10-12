const address = process.argv.slice(2).find((arg) => !arg.startsWith("--")) ?? "http://127.0.0.1:3000";
// With --wait, keep trying for 60 seconds. That gives the containers time to start.
const deadline = Date.now() + (process.argv.includes("--wait") ? 60_000 : 0);

while (true) {
  let detail = "";
  try {
    const response = await fetch(`${address}/health`);
    if (response.ok) {
      console.log(`The API at ${address} answered.`);
      break;
    }
    detail = `HTTP ${response.status}`;
  } catch (error) {
    detail = error instanceof Error ? error.message : String(error);
  }
  if (Date.now() > deadline) {
    console.error(`Could not reach the API at ${address}. ${detail}`);
    process.exit(1);
  }
  await Bun.sleep(1000);
}
