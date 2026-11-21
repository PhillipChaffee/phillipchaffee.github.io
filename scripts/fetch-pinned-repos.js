const fs = require("fs");
const path = require("path");

const [login, outputPath] = process.argv.slice(2);
const token = process.env.GITHUB_TOKEN;

if (!login || !outputPath || !token) {
  console.error("Usage: GITHUB_TOKEN=... node fetch-pinned-repos.js <login> <output.json>");
  process.exit(1);
}

// pinnedItems returns nodes in the order they are pinned on the profile.
const query = `
  query ($login: String!) {
    user(login: $login) {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            url
            description
            homepageUrl
            stargazerCount
            owner { login }
            primaryLanguage { name }
          }
        }
      }
    }
  }`;

async function main() {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "pinned-repos-fetcher",
    },
    body: JSON.stringify({ query, variables: { login } }),
  });
  const body = await response.json();

  if (!response.ok || body.errors || !body.data?.user) {
    throw new Error(`GitHub GraphQL request failed (${response.status}): ${JSON.stringify(body)}`);
  }

  const repos = body.data.user.pinnedItems.nodes.map((repo) => ({
    name: repo.name,
    owner: repo.owner.login,
    url: repo.url,
    description: repo.description,
    homepage: repo.homepageUrl || null,
    language: repo.primaryLanguage?.name ?? null,
    stars: repo.stargazerCount,
  }));

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(repos, null, 2) + "\n");
  console.log(`Wrote ${repos.length} pinned repositories to ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
