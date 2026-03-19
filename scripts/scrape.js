(async () => {
  const data = [];

  document.querySelectorAll(".row .col-md-6").forEach(col => {
    const card = col.querySelector(".card");
    if (!card) return;

    const teamNameEl = card.querySelector("p.font-weight-bolder");
    const teamName = teamNameEl ? teamNameEl.innerText.trim() : "Unknown";
    const members = [];

    card.querySelectorAll("tbody tr").forEach(row => {
      const nameLink = row.querySelector("h5 a");
      if (!nameLink || !nameLink.href.includes("/profile/")) return;

      const name = nameLink.innerText.trim();
      const profileUrl = nameLink.href;

      const avatarImg = row.querySelector("img");
      const avatarSpan = row.querySelector(".avatar-title");
      const avatarUrl = avatarImg ? avatarImg.src : null;
      const initials = avatarSpan ? avatarSpan.innerText.trim() : null;

      // Extract GitHub ID from avatar URL if it's a GitHub avatar
      const githubMatch = avatarUrl?.match(/avatars\.githubusercontent\.com\/u\/(\d+)/);
      const githubId = githubMatch ? githubMatch[1] : null;

      // Picture priority: GitHub avatar > skillsranker avatar > null
      const picture = githubId
        ? `https://avatars.githubusercontent.com/u/${githubId}?v=4`
        : avatarUrl || null;

      members.push({
        name,
        profileUrl,
        initials,
        githubId,
        picture,
      });
    });

    data.push({
      teamName,
      memberCount: members.length,
      isValid: null,
      isCompany: null,
      companyDetails: null,
      members,
    });
  });

  console.log(JSON.stringify(data, null, 2));
  copy(JSON.stringify(data, null, 2));
  console.log("✅ Done! Copied to clipboard.");
})();