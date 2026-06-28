import process from "node:process";

const baseUrl = (process.argv[2] ?? "https://ruahnote.onrender.com").replace(/\/$/, "");
const paths = ["/", "/api/health"];

async function checkPath(path) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    headers: {
      "user-agent": "ruahnote-production-check/1.0",
    },
  });
  const text = await response.text();

  return {
    path,
    status: response.status,
    ok: response.ok,
    renderRouting: response.headers.get("x-render-routing"),
    contentType: response.headers.get("content-type"),
    bodyPreview: text.slice(0, 200),
  };
}

async function main() {
  const results = await Promise.all(paths.map((path) => checkPath(path)));

  for (const result of results) {
    console.log(
      `${result.path} ${result.status} render-routing=${result.renderRouting ?? "n/a"}`,
    );

    if (!result.ok && result.bodyPreview) {
      console.log(`  body: ${result.bodyPreview}`);
    }
  }

  const failed = results.filter((result) => !result.ok);
  const noServer = results.some((result) => result.renderRouting === "no-server");

  if (failed.length > 0) {
    if (noServer) {
      console.error(
        "Render returned x-render-routing=no-server. Check that the Render service is deployed, connected to this repository/branch, and using the expected primary URL.",
      );
    }

    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
