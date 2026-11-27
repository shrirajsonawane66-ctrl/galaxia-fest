import "server-only";

const REPO = "shrirajsonawane66-ctrl/galaxia-fest";

export type ChangelogCommit = {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  url: string;
};

type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; date: string } | null;
  };
};

export async function listCommits(): Promise<ChangelogCommit[]> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO}/commits?sha=main&per_page=50`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "galaxia-fest",
        },
        next: { revalidate: 3600 },
      }
    );
    if (!response.ok) return [];
    const data = (await response.json()) as GitHubCommit[];
    return data.map((item) => ({
      sha: item.sha,
      shortSha: item.sha.slice(0, 7),
      message: item.commit.message.split("\n")[0],
      author: item.commit.author?.name ?? "Unknown",
      date: item.commit.author?.date ?? "",
      url: item.html_url,
    }));
  } catch {
    return [];
  }
}
