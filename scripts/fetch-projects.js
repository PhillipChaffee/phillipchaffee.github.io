const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const [login, configPath, outputPath] = process.argv.slice(2);
const token = process.env.GITHUB_TOKEN;

if (!login || !configPath || !outputPath || !token) {
  console.error("Usage: GITHUB_TOKEN=... node fetch-projects.js <login> <_config.yml> <output.json>");
  process.exit(1);
}

const REPO_FIELDS = `
  name
  url
  description
  homepageUrl
  stargazerCount
  owner { login }
  primaryLanguage { name }`;

function readExtraProjects() {
  const extras = yaml.load(fs.readFileSync(configPath, "utf8")).extra_projects ?? [];
  return extras.map((entry) => {
    const match = /^([\w.-]+)\/([\w.-]+)$/.exec(entry);
    if (!match) {
      throw new Error(`extra_projects entry "${entry}" in ${configPath} must look like owner/name`);
    }
    return { owner: match[1], name: match[2] };
  });
}

function buildQuery(extras) {
  const extraSelections = extras
    .map(({ owner, name }, i) => `extra${i}: repository(owner: "${owner}", name: "${name}") { ${REPO_FIELDS} }`)
    .join("\n");
  // pinnedItems returns nodes in the order they are pinned on the profile.
  return `
    query ($login: String!) {
      user(login: $login) {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes { ... on Repository { ${REPO_FIELDS} } }
        }
      }
      ${extraSelections}
    }`;
}

function toProject(repo) {
  return {
    name: repo.name,
    owner: repo.owner.login,
    url: repo.url,
    description: repo.description,
    homepage: repo.homepageUrl || null,
    language: repo.primaryLanguage?.name ?? null,
    stars: repo.stargazerCount,
  };
}

async function main() {
  const extras = readExtraProjects();
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "projects-fetcher",
    },
    body: JSON.stringify({ query: buildQuery(extras), variables: { login } }),
  });
  const body = await response.json();

  if (!response.ok || body.errors || !body.data?.user) {
    throw new Error(`GitHub GraphQL request failed (${response.status}): ${JSON.stringify(body)}`);
  }

  const pinned = body.data.user.pinnedItems.nodes.map(toProject);
  const pinnedUrls = new Set(pinned.map((project) => project.url));
  const extraProjects = extras
    .map((_, i) => toProject(body.data[`extra${i}`]))
    .filter((project) => !pinnedUrls.has(project.url));
  const projects = [...pinned, ...extraProjects];

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(projects, null, 2) + "\n");
  console.log(`Wrote ${pinned.length} pinned and ${extraProjects.length} extra projects to ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
